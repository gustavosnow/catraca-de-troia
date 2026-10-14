import { createHash, randomUUID } from 'node:crypto';
import type {
  CreateGuardianLinkRequest,
  GuardianLinkRequestRecord,
  GuardianRelationship,
  LinkRequestStatus,
  ReviewGuardianLinkRequest,
} from '../../../shared/contracts/linkRequests';
import type { DemoActor } from '../../../shared/contracts/justifications';
import type { AppDatabase } from '../../db';
import { conflict, forbidden, notFound } from '../../errors';
import { notifyUser } from '../communications/notificationWriter';

interface LinkRequestRow {
  id: string;
  school_id: string;
  guardian_user_id: string;
  guardian_name: string;
  student_id: string;
  student_name: string;
  enrollment: string;
  relationship: GuardianRelationship;
  status: LinkRequestStatus;
  submitted_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  review_note: string | null;
  version: number;
  request_hash: string;
}

const selectRequest = `
  SELECT request.*, guardian.name AS guardian_name, student.name AS student_name,
    student.enrollment
  FROM guardian_link_requests request
  JOIN users guardian ON guardian.id = request.guardian_user_id
  JOIN students student ON student.id = request.student_id
`;

const mapRequest = (row: LinkRequestRow): GuardianLinkRequestRecord => ({
  id: row.id,
  schoolId: row.school_id,
  guardian: { id: row.guardian_user_id, name: row.guardian_name },
  student: { id: row.student_id, name: row.student_name, enrollment: row.enrollment },
  relationship: row.relationship,
  status: row.status,
  submittedAt: row.submitted_at,
  reviewedAt: row.reviewed_at ?? undefined,
  reviewedById: row.reviewed_by ?? undefined,
  reviewNote: row.review_note ?? undefined,
  version: row.version,
});

const mapForGuardian = (row: LinkRequestRow): GuardianLinkRequestRecord => {
  const record = mapRequest(row);
  return row.status === 'APPROVED'
    ? record
    : { ...record, student: { ...record.student, name: 'Estudante informado' } };
};

const requestHash = (request: CreateGuardianLinkRequest) => createHash('sha256')
  .update(JSON.stringify(request))
  .digest('hex');

const canReview = (actor: DemoActor) =>
  actor.role === 'STAFF_COORDINATION' || actor.role === 'STAFF_DIRECTION';

export class LinkRequestService {
  constructor(
    private readonly database: AppDatabase,
    private readonly now: () => string = () => new Date().toISOString(),
  ) {}

  list(actor: DemoActor): GuardianLinkRequestRecord[] {
    if (actor.role === 'GUARDIAN') {
      return (this.database.prepare(`
        ${selectRequest}
        WHERE request.guardian_user_id = ? AND request.school_id = ?
        ORDER BY request.submitted_at DESC
      `).all(actor.id, actor.schoolId) as LinkRequestRow[]).map(mapForGuardian);
    }
    if (!canReview(actor)) throw forbidden('Somente Coordenação ou Direção consulta solicitações de vínculo.');
    return (this.database.prepare(`
      ${selectRequest}
      WHERE request.school_id = ?
      ORDER BY CASE request.status WHEN 'PENDING' THEN 0 ELSE 1 END, request.submitted_at DESC
    `).all(actor.schoolId) as LinkRequestRow[]).map(mapRequest);
  }

  create(
    actor: DemoActor,
    request: CreateGuardianLinkRequest,
    idempotencyKey: string,
  ): { request: GuardianLinkRequestRecord; created: boolean } {
    if (actor.role !== 'GUARDIAN') throw forbidden('Somente responsáveis solicitam vínculos.');
    const normalized = {
      studentEnrollment: request.studentEnrollment.trim(),
      relationship: request.relationship,
    };
    const hash = requestHash(normalized);
    const existingByKey = this.database.prepare(`
      ${selectRequest}
      WHERE request.guardian_user_id = ? AND request.idempotency_key = ?
    `).get(actor.id, idempotencyKey) as LinkRequestRow | undefined;
    if (existingByKey) {
      if (existingByKey.request_hash !== hash) {
        throw conflict('IDEMPOTENCY_CONFLICT', 'A chave de idempotência já foi usada com outros dados.');
      }
      return { request: mapForGuardian(existingByKey), created: false };
    }

    const student = this.database.prepare(`
      SELECT id, name, enrollment FROM students WHERE school_id = ? AND enrollment = ?
    `).get(actor.schoolId, normalized.studentEnrollment) as {
      id: string; name: string; enrollment: string;
    } | undefined;
    if (!student) throw notFound('Matrícula não localizada nesta unidade escolar.');

    const approved = this.database.prepare(`
      SELECT 1 FROM guardian_student_links
      WHERE guardian_user_id = ? AND student_id = ? AND status = 'APPROVED'
    `).get(actor.id, student.id);
    if (approved) throw conflict('LINK_ALREADY_APPROVED', 'Este vínculo já está aprovado.');

    const pending = this.database.prepare(`
      SELECT 1 FROM guardian_link_requests
      WHERE guardian_user_id = ? AND student_id = ? AND status = 'PENDING'
    `).get(actor.id, student.id);
    if (pending) throw conflict('LINK_REQUEST_PENDING', 'Já existe uma solicitação pendente para esta matrícula.');

    const id = randomUUID();
    const submittedAt = this.now();
    this.database.transaction(() => {
      this.database.prepare(`
        INSERT INTO guardian_link_requests (
          id, school_id, guardian_user_id, student_id, relationship, status,
          submitted_at, version, idempotency_key, request_hash
        ) VALUES (?, ?, ?, ?, ?, 'PENDING', ?, 1, ?, ?)
      `).run(id, actor.schoolId, actor.id, student.id, normalized.relationship, submittedAt, idempotencyKey, hash);
      this.database.prepare(`
        INSERT INTO audit_log (
          id, school_id, actor_id, aggregate_type, aggregate_id, action,
          previous_state, new_state, occurred_at
        ) VALUES (?, ?, ?, 'GUARDIAN_LINK_REQUEST', ?, 'CREATED', NULL, ?, ?)
      `).run(randomUUID(), actor.schoolId, actor.id, id, JSON.stringify({ status: 'PENDING' }), submittedAt);
    })();
    const created = this.find(actor.schoolId, id);
    return { request: mapForGuardian(created), created: true };
  }

  review(actor: DemoActor, id: string, request: ReviewGuardianLinkRequest): GuardianLinkRequestRecord {
    if (!canReview(actor)) throw forbidden('Somente Coordenação ou Direção analisa solicitações de vínculo.');
    const current = this.find(actor.schoolId, id);
    if (current.status !== 'PENDING') {
      throw conflict('LINK_REQUEST_ALREADY_REVIEWED', 'A solicitação já foi analisada.');
    }
    if (current.version !== request.expectedVersion) {
      throw conflict('VERSION_CONFLICT', 'A solicitação foi alterada. Atualize a lista antes de analisar.');
    }

    const reviewedAt = this.now();
    this.database.transaction(() => {
      const result = this.database.prepare(`
        UPDATE guardian_link_requests
        SET status = ?, reviewed_at = ?, reviewed_by = ?, review_note = ?, version = version + 1
        WHERE id = ? AND school_id = ? AND status = 'PENDING' AND version = ?
      `).run(
        request.status,
        reviewedAt,
        actor.id,
        request.reviewNote?.trim() || null,
        id,
        actor.schoolId,
        request.expectedVersion,
      );
      if (result.changes !== 1) throw conflict('VERSION_CONFLICT', 'A solicitação foi alterada.');

      if (request.status === 'APPROVED') {
        this.database.prepare(`
          INSERT INTO guardian_student_links (
            guardian_user_id, student_id, status, approved_at, approved_by
          ) VALUES (?, ?, 'APPROVED', ?, ?)
          ON CONFLICT(guardian_user_id, student_id) DO UPDATE SET
            status = 'APPROVED', approved_at = excluded.approved_at, approved_by = excluded.approved_by
        `).run(current.guardian_user_id, current.student_id, reviewedAt, actor.id);
      }

      this.database.prepare(`
        INSERT INTO audit_log (
          id, school_id, actor_id, aggregate_type, aggregate_id, action,
          previous_state, new_state, occurred_at
        ) VALUES (?, ?, ?, 'GUARDIAN_LINK_REQUEST', ?, 'REVIEWED', ?, ?, ?)
      `).run(
        randomUUID(), actor.schoolId, actor.id, id,
        JSON.stringify({ status: current.status, version: current.version }),
        JSON.stringify({ status: request.status, version: current.version + 1 }),
        reviewedAt,
      );

      notifyUser(this.database, current.guardian_user_id, {
        schoolId: actor.schoolId,
        type: 'SECURITY',
        title: request.status === 'APPROVED' ? 'Vínculo aprovado' : 'Solicitação de vínculo analisada',
        message: request.status === 'APPROVED'
          ? `O vínculo com ${current.student_name} foi aprovado pela escola.`
          : 'A solicitação de vínculo não foi aprovada. Consulte a escola para orientação.',
        studentId: current.student_id,
        contextLabel: 'Validação escolar de vínculo',
        sourceType: 'LINK_REQUEST_REVIEW',
        sourceId: id,
        createdAt: reviewedAt,
      });
    })();
    return mapRequest(this.find(actor.schoolId, id));
  }

  private find(schoolId: string, id: string): LinkRequestRow {
    const row = this.database.prepare(`
      ${selectRequest}
      WHERE request.id = ? AND request.school_id = ?
    `).get(id, schoolId) as LinkRequestRow | undefined;
    if (!row) throw notFound('Solicitação de vínculo não encontrada.');
    return row;
  }
}
