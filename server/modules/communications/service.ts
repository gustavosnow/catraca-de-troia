import { randomUUID } from 'node:crypto';
import type {
  CreateSchoolNoticeRequest,
  InAppNotificationRecord,
  SchoolNoticeRecord,
  UpdateSchoolNoticeRequest,
} from '../../../shared/contracts/communications';
import type { DemoActor } from '../../../shared/contracts/justifications';
import type { AppDatabase } from '../../db';
import { conflict, forbidden, notFound } from '../../errors';
import { notifySchoolGuardians } from './notificationWriter';

interface NoticeRow {
  id: string;
  school_id: string;
  title: string;
  category: SchoolNoticeRecord['category'];
  priority: SchoolNoticeRecord['priority'];
  author_label: string;
  role_label: string;
  summary: string;
  content: string;
  attachment_name: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  version: number;
  read_at: string | null;
}

interface NotificationRow {
  id: string;
  title: string;
  message: string;
  created_at: string;
  type: InAppNotificationRecord['type'];
  student_name: string | null;
  context_label: string | null;
  read_at: string | null;
}

const canManageNotices = (actor: DemoActor) =>
  ['STAFF_COORDINATION', 'STAFF_DIRECTION'].includes(actor.role);

const mapNotice = (row: NoticeRow): SchoolNoticeRecord => ({
  id: row.id,
  schoolId: row.school_id,
  title: row.title,
  category: row.category,
  priority: row.priority,
  authorLabel: row.author_label,
  roleLabel: row.role_label,
  summary: row.summary,
  content: row.content,
  attachmentName: row.attachment_name ?? undefined,
  createdById: row.created_by,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  version: row.version,
  isUnread: !row.read_at,
});

const selectNotice = `
  SELECT notice.*, reads.read_at
  FROM school_notices notice
  LEFT JOIN school_notice_reads reads
    ON reads.notice_id = notice.id AND reads.guardian_user_id = ?
`;

export class CommunicationService {
  constructor(
    private readonly database: AppDatabase,
    private readonly now: () => string = () => new Date().toISOString(),
  ) {}

  listNotices(actor: DemoActor): SchoolNoticeRecord[] {
    const rows = this.database.prepare(`
      ${selectNotice}
      WHERE notice.school_id = ? AND notice.deleted_at IS NULL
      ORDER BY notice.created_at DESC, notice.id DESC
    `).all(actor.role === 'GUARDIAN' ? actor.id : '', actor.schoolId) as NoticeRow[];
    return rows.map(mapNotice);
  }

  createNotice(
    actor: DemoActor,
    request: CreateSchoolNoticeRequest,
  ): SchoolNoticeRecord {
    if (!canManageNotices(actor)) {
      throw forbidden('Somente Coordenação ou Direção pode publicar comunicados.');
    }
    const id = randomUUID();
    const timestamp = this.now();
    const transaction = this.database.transaction(() => {
      this.database.prepare(`
        INSERT INTO school_notices (
          id, school_id, title, category, priority, author_label, role_label,
          summary, content, attachment_name, created_by, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id, actor.schoolId, request.title.trim(), request.category, request.priority,
        request.authorLabel.trim(), request.roleLabel.trim(), request.summary.trim(),
        request.content.trim(), request.attachmentName?.trim() || null,
        actor.id, timestamp, timestamp,
      );
      this.audit(actor, id, 'CREATED', null, request.title.trim(), timestamp);
      if (request.notifyGuardians) {
        notifySchoolGuardians(this.database, {
          schoolId: actor.schoolId,
          type: 'NOTICE',
          title: `Novo comunicado: ${request.title.trim()}`,
          message: request.summary.trim(),
          contextLabel: 'Gestão Escolar',
          sourceType: 'NOTICE_CREATED',
          sourceId: id,
          createdAt: timestamp,
        });
      }
    });
    transaction();
    return this.getNotice(actor, id);
  }

  updateNotice(
    actor: DemoActor,
    noticeId: string,
    request: UpdateSchoolNoticeRequest,
  ): SchoolNoticeRecord {
    if (!canManageNotices(actor)) {
      throw forbidden('Somente Coordenação ou Direção pode editar comunicados.');
    }
    const existing = this.findNotice(actor, noticeId);
    if (existing.version !== request.expectedVersion) {
      throw conflict('VERSION_CONFLICT', 'O comunicado foi alterado por outra operação.');
    }
    const timestamp = this.now();
    const transaction = this.database.transaction(() => {
      const result = this.database.prepare(`
        UPDATE school_notices
        SET title = ?, category = ?, priority = ?, author_label = ?, role_label = ?,
            summary = ?, content = ?, attachment_name = ?, updated_at = ?, version = version + 1
        WHERE id = ? AND school_id = ? AND deleted_at IS NULL AND version = ?
      `).run(
        request.title.trim(), request.category, request.priority,
        request.authorLabel.trim(), request.roleLabel.trim(), request.summary.trim(),
        request.content.trim(), request.attachmentName?.trim() || null,
        timestamp, noticeId, actor.schoolId, request.expectedVersion,
      );
      if (result.changes !== 1) throw conflict('VERSION_CONFLICT', 'O comunicado foi alterado por outra operação.');
      this.audit(actor, noticeId, 'UPDATED', String(existing.version), String(existing.version + 1), timestamp);
    });
    transaction();
    return this.getNotice(actor, noticeId);
  }

  deleteNotice(actor: DemoActor, noticeId: string): void {
    if (!canManageNotices(actor)) {
      throw forbidden('Somente Coordenação ou Direção pode remover comunicados.');
    }
    this.findNotice(actor, noticeId);
    const timestamp = this.now();
    const transaction = this.database.transaction(() => {
      this.database.prepare(`
        UPDATE school_notices SET deleted_at = ?, updated_at = ?, version = version + 1
        WHERE id = ? AND school_id = ? AND deleted_at IS NULL
      `).run(timestamp, timestamp, noticeId, actor.schoolId);
      this.audit(actor, noticeId, 'DELETED', 'ACTIVE', 'DELETED', timestamp);
    });
    transaction();
  }

  broadcastNotice(actor: DemoActor, noticeId: string, idempotencyKey: string): number {
    if (!canManageNotices(actor)) {
      throw forbidden('Somente Coordenação ou Direção pode gerar notificações de comunicados.');
    }
    const notice = this.findNotice(actor, noticeId);
    const existing = this.database.prepare(`
      SELECT id FROM notification_dispatches WHERE requested_by = ? AND idempotency_key = ?
    `).get(actor.id, idempotencyKey) as { id: string } | undefined;
    if (existing) return 0;

    const dispatchId = randomUUID();
    const timestamp = this.now();
    let recipients = 0;
    const transaction = this.database.transaction(() => {
      this.database.prepare(`
        INSERT INTO notification_dispatches (
          id, school_id, notice_id, requested_by, idempotency_key, created_at
        ) VALUES (?, ?, ?, ?, ?, ?)
      `).run(dispatchId, actor.schoolId, noticeId, actor.id, idempotencyKey, timestamp);
      recipients = notifySchoolGuardians(this.database, {
        schoolId: actor.schoolId,
        type: 'NOTICE',
        title: `Comunicado: ${notice.title}`,
        message: notice.summary,
        contextLabel: 'Gestão Escolar',
        sourceType: 'NOTICE_BROADCAST',
        sourceId: dispatchId,
        createdAt: timestamp,
      });
      this.audit(actor, noticeId, 'NOTIFICATION_QUEUED', null, String(recipients), timestamp);
    });
    transaction();
    return recipients;
  }

  markNoticeRead(actor: DemoActor, noticeId: string): void {
    if (actor.role !== 'GUARDIAN') throw forbidden('A leitura pertence ao perfil responsável.');
    this.findNotice(actor, noticeId);
    this.database.prepare(`
      INSERT INTO school_notice_reads (notice_id, guardian_user_id, read_at)
      VALUES (?, ?, ?)
      ON CONFLICT(notice_id, guardian_user_id) DO NOTHING
    `).run(noticeId, actor.id, this.now());
  }

  listNotifications(actor: DemoActor): InAppNotificationRecord[] {
    if (actor.role !== 'GUARDIAN') throw forbidden('Notificações internas pertencem ao perfil responsável.');
    const rows = this.database.prepare(`
      SELECT notification.*, student.name AS student_name
      FROM in_app_notifications notification
      LEFT JOIN students student ON student.id = notification.student_id
      WHERE notification.recipient_user_id = ? AND notification.school_id = ?
      ORDER BY notification.created_at DESC, notification.id DESC
      LIMIT 200
    `).all(actor.id, actor.schoolId) as NotificationRow[];
    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      message: row.message,
      occurredAt: row.created_at,
      type: row.type,
      studentName: row.student_name ?? undefined,
      contextLabel: row.context_label ?? undefined,
      readAt: row.read_at ?? undefined,
    }));
  }

  markAllNotificationsRead(actor: DemoActor): number {
    if (actor.role !== 'GUARDIAN') throw forbidden('Notificações internas pertencem ao perfil responsável.');
    return this.database.prepare(`
      UPDATE in_app_notifications SET read_at = ?
      WHERE recipient_user_id = ? AND school_id = ? AND read_at IS NULL
    `).run(this.now(), actor.id, actor.schoolId).changes;
  }

  private findNotice(actor: DemoActor, noticeId: string): NoticeRow {
    const row = this.database.prepare(`
      ${selectNotice}
      WHERE notice.id = ? AND notice.school_id = ? AND notice.deleted_at IS NULL
    `).get(actor.role === 'GUARDIAN' ? actor.id : '', noticeId, actor.schoolId) as NoticeRow | undefined;
    if (!row) throw notFound('Comunicado não encontrado.');
    return row;
  }

  private getNotice(actor: DemoActor, noticeId: string) {
    return mapNotice(this.findNotice(actor, noticeId));
  }

  private audit(
    actor: DemoActor,
    aggregateId: string,
    action: string,
    previousState: string | null,
    newState: string,
    occurredAt: string,
  ) {
    this.database.prepare(`
      INSERT INTO audit_log (
        id, school_id, actor_id, aggregate_type, aggregate_id, action,
        previous_state, new_state, occurred_at
      ) VALUES (?, ?, ?, 'SCHOOL_NOTICE', ?, ?, ?, ?, ?)
    `).run(randomUUID(), actor.schoolId, actor.id, aggregateId, action, previousState, newState, occurredAt);
  }
}

