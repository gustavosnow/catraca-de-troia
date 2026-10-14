import { createHash, randomUUID } from 'node:crypto';
import {
  CreateJustificationRequest,
  DemoActor,
  JustificationRecord,
  JustificationStatus,
  LinkedStudent,
  ReviewJustificationRequest,
} from '../../../shared/contracts/justifications';
import { AppDatabase } from '../../db';
import { conflict, forbidden, notFound } from '../../errors';
import { notifyUser } from '../communications/notificationWriter';

interface StudentRow {
  id: string;
  school_id: string;
  name: string;
  enrollment: string;
}

interface JustificationRow {
  id: string;
  school_id: string;
  student_id: string;
  student_name: string;
  enrollment: string;
  submitted_by: string;
  absence_start_date: string;
  absence_end_date: string | null;
  reason_category: JustificationRecord['reasonCategory'];
  description: string;
  attachment_name: string | null;
  attachment_id: string | null;
  attachment_validation_status: 'BASIC_VALIDATION_ONLY' | null;
  status: JustificationStatus;
  submitted_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  version: number;
  request_hash: string;
}

const selectJustification = `
  SELECT j.*, s.name AS student_name, s.enrollment,
    attachment.validation_status AS attachment_validation_status
  FROM justifications j
  JOIN students s ON s.id = j.student_id
  LEFT JOIN attachments attachment ON attachment.id = j.attachment_id
`;

const mapJustification = (row: JustificationRow): JustificationRecord => ({
  id: row.id,
  schoolId: row.school_id,
  student: {
    id: row.student_id,
    name: row.student_name,
    enrollment: row.enrollment,
  },
  submittedById: row.submitted_by,
  absenceStartDate: row.absence_start_date,
  absenceEndDate: row.absence_end_date ?? undefined,
  reasonCategory: row.reason_category,
  description: row.description,
  attachmentName: row.attachment_name ?? undefined,
  attachmentId: row.attachment_id ?? undefined,
  attachmentValidationStatus: row.attachment_validation_status ?? undefined,
  status: row.status,
  submittedAt: row.submitted_at,
  reviewedAt: row.reviewed_at ?? undefined,
  reviewedById: row.reviewed_by ?? undefined,
  version: row.version,
});

const stableRequestHash = (studentId: string, request: CreateJustificationRequest) =>
  createHash('sha256')
    .update(JSON.stringify({ studentId, ...request }))
    .digest('hex');

export class JustificationService {
  constructor(
    private readonly database: AppDatabase,
    private readonly now: () => string = () => new Date().toISOString(),
  ) {}

  listLinkedStudents(actor: DemoActor): LinkedStudent[] {
    if (actor.role === 'GUARDIAN') {
      return this.database.prepare(`
        SELECT s.id, s.name, s.enrollment
        FROM students s
        JOIN guardian_student_links link ON link.student_id = s.id
        WHERE link.guardian_user_id = ? AND link.status = 'APPROVED' AND s.school_id = ?
        ORDER BY s.name
      `).all(actor.id, actor.schoolId) as LinkedStudent[];
    }

    return this.database.prepare(`
      SELECT id, name, enrollment FROM students WHERE school_id = ? ORDER BY name
    `).all(actor.schoolId) as LinkedStudent[];
  }

  private findAccessibleStudent(actor: DemoActor, studentId: string): StudentRow {
    const student = this.database.prepare(`
      SELECT id, school_id, name, enrollment FROM students WHERE id = ? AND school_id = ?
    `).get(studentId, actor.schoolId) as StudentRow | undefined;
    if (!student) throw notFound('Estudante não encontrado.');

    if (actor.role === 'GUARDIAN') {
      const link = this.database.prepare(`
        SELECT 1 FROM guardian_student_links
        WHERE guardian_user_id = ? AND student_id = ? AND status = 'APPROVED'
      `).get(actor.id, studentId);
      if (!link) throw notFound('Estudante não encontrado.');
    }
    return student;
  }

  listForStudent(actor: DemoActor, studentId: string): JustificationRecord[] {
    this.findAccessibleStudent(actor, studentId);
    const rows = this.database.prepare(`
      ${selectJustification}
      WHERE j.student_id = ? AND j.school_id = ?
      ORDER BY j.submitted_at DESC
    `).all(studentId, actor.schoolId) as JustificationRow[];
    return rows.map(mapJustification);
  }

  listForSchool(actor: DemoActor, status?: JustificationStatus): JustificationRecord[] {
    if (actor.role === 'GUARDIAN') throw forbidden();
    const rows = status
      ? this.database.prepare(`
          ${selectJustification}
          WHERE j.school_id = ? AND j.status = ?
          ORDER BY j.submitted_at DESC
        `).all(actor.schoolId, status) as JustificationRow[]
      : this.database.prepare(`
          ${selectJustification}
          WHERE j.school_id = ?
          ORDER BY j.submitted_at DESC
        `).all(actor.schoolId) as JustificationRow[];
    return rows.map(mapJustification);
  }

  create(
    actor: DemoActor,
    studentId: string,
    request: CreateJustificationRequest,
    idempotencyKey: string,
  ): { justification: JustificationRecord; created: boolean } {
    if (actor.role !== 'GUARDIAN') {
      throw forbidden('Somente um responsável vinculado pode enviar justificativas neste fluxo.');
    }
    this.findAccessibleStudent(actor, studentId);

    const requestHash = stableRequestHash(studentId, request);
    const existing = this.database.prepare(`
      ${selectJustification}
      WHERE j.submitted_by = ? AND j.idempotency_key = ?
    `).get(actor.id, idempotencyKey) as JustificationRow | undefined;
    if (existing) {
      if (existing.request_hash !== requestHash) {
        throw conflict(
          'IDEMPOTENCY_CONFLICT',
          'A chave de idempotência já foi usada com outro conteúdo.',
        );
      }
      return { justification: mapJustification(existing), created: false };
    }

    const attachment = request.attachmentId
      ? this.database.prepare(`
          SELECT id, file_name FROM attachments
          WHERE id = ? AND school_id = ? AND uploaded_by = ?
            AND purpose = 'JUSTIFICATION' AND aggregate_id IS NULL
        `).get(request.attachmentId, actor.schoolId, actor.id) as { id: string; file_name: string } | undefined
      : undefined;
    if (request.attachmentId && !attachment) throw notFound('Anexo não encontrado ou já utilizado.');

    const id = randomUUID();
    const timestamp = this.now();
    const transaction = this.database.transaction(() => {
      this.database.prepare(`
        INSERT INTO justifications (
          id, school_id, student_id, submitted_by, absence_start_date, absence_end_date,
          reason_category, description, attachment_name, attachment_id, status, submitted_at,
          version, idempotency_key, request_hash
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', ?, 1, ?, ?)
      `).run(
        id,
        actor.schoolId,
        studentId,
        actor.id,
        request.absenceStartDate,
        request.absenceEndDate ?? null,
        request.reasonCategory,
        request.description.trim(),
        attachment?.file_name || request.attachmentName?.trim() || null,
        attachment?.id || null,
        timestamp,
        idempotencyKey,
        requestHash,
      );

      if (attachment) {
        const bound = this.database.prepare(`
          UPDATE attachments SET aggregate_type = 'JUSTIFICATION', aggregate_id = ?
          WHERE id = ? AND aggregate_id IS NULL
        `).run(id, attachment.id);
        if (bound.changes !== 1) throw conflict('ATTACHMENT_CONFLICT', 'O anexo já foi utilizado.');
      }

      this.database.prepare(`
        INSERT INTO audit_log (
          id, school_id, actor_id, aggregate_type, aggregate_id, action,
          previous_state, new_state, occurred_at
        ) VALUES (?, ?, ?, 'JUSTIFICATION', ?, 'CREATED', NULL, 'PENDING', ?)
      `).run(randomUUID(), actor.schoolId, actor.id, id, timestamp);
      notifyUser(this.database, actor.id, {
        schoolId: actor.schoolId,
        type: 'ABSENCE',
        title: 'Justificativa registrada no portal',
        message: `A justificativa para ${request.absenceStartDate} foi protocolada para análise.`,
        studentId,
        contextLabel: 'Secretaria Escolar',
        sourceType: 'JUSTIFICATION_CREATED',
        sourceId: id,
        createdAt: timestamp,
      });
    });
    transaction();

    const row = this.database.prepare(`${selectJustification} WHERE j.id = ?`).get(id) as JustificationRow;
    return { justification: mapJustification(row), created: true };
  }

  review(
    actor: DemoActor,
    justificationId: string,
    request: ReviewJustificationRequest,
  ): JustificationRecord {
    if (!['STAFF_COORDINATION', 'STAFF_DIRECTION'].includes(actor.role)) {
      throw forbidden('Somente Coordenação ou Direção pode analisar justificativas.');
    }

    const existing = this.database.prepare(`
      ${selectJustification}
      WHERE j.id = ? AND j.school_id = ?
    `).get(justificationId, actor.schoolId) as JustificationRow | undefined;
    if (!existing) throw notFound('Justificativa não encontrada.');
    if (existing.version !== request.expectedVersion) {
      throw conflict('VERSION_CONFLICT', 'A justificativa foi alterada por outra operação.');
    }
    if (existing.status !== 'PENDING') {
      throw conflict('STATUS_CONFLICT', 'Somente justificativas pendentes podem ser analisadas.');
    }

    const timestamp = this.now();
    const transaction = this.database.transaction(() => {
      const result = this.database.prepare(`
        UPDATE justifications
        SET status = ?, reviewed_at = ?, reviewed_by = ?, version = version + 1
        WHERE id = ? AND school_id = ? AND status = 'PENDING' AND version = ?
      `).run(
        request.status,
        timestamp,
        actor.id,
        justificationId,
        actor.schoolId,
        request.expectedVersion,
      );
      if (result.changes !== 1) {
        throw conflict('VERSION_CONFLICT', 'A justificativa foi alterada por outra operação.');
      }

      this.database.prepare(`
        INSERT INTO audit_log (
          id, school_id, actor_id, aggregate_type, aggregate_id, action,
          previous_state, new_state, occurred_at
        ) VALUES (?, ?, ?, 'JUSTIFICATION', ?, 'REVIEWED', ?, ?, ?)
      `).run(
        randomUUID(),
        actor.schoolId,
        actor.id,
        justificationId,
        existing.status,
        request.status,
        timestamp,
      );
      notifyUser(this.database, existing.submitted_by, {
        schoolId: actor.schoolId,
        type: 'ABSENCE',
        title: request.status === 'APPROVED' ? 'Justificativa aprovada' : 'Justificativa não aprovada',
        message: `A justificativa para ${existing.absence_start_date} foi ${request.status === 'APPROVED' ? 'aprovada' : 'recusada'} pela escola.`,
        studentId: existing.student_id,
        contextLabel: 'Coordenação Escolar',
        sourceType: 'JUSTIFICATION_REVIEWED',
        sourceId: justificationId,
        createdAt: timestamp,
      });
    });
    transaction();

    const updated = this.database.prepare(`${selectJustification} WHERE j.id = ?`).get(justificationId) as JustificationRow;
    return mapJustification(updated);
  }
}
