import { createHash, randomUUID } from 'node:crypto';
import type {
  AccessEventRecord,
  CreateAccessEventRequest,
} from '../../../shared/contracts/accessEvents';
import type { DemoActor } from '../../../shared/contracts/justifications';
import type { AppDatabase } from '../../db';
import { conflict, forbidden, notFound } from '../../errors';

interface AccessEventRow {
  id: string;
  school_id: string;
  student_id: string;
  student_name: string;
  enrollment: string;
  direction: AccessEventRecord['direction'];
  occurred_at: string;
  turnstile_id: string;
  turnstile_name: string;
  status: AccessEventRecord['status'];
  method: AccessEventRecord['method'];
  created_by: string;
  source: AccessEventRecord['source'];
  whatsapp_status: AccessEventRecord['notification']['whatsapp'];
  push_status: AccessEventRecord['notification']['pushApp'];
  request_hash: string;
  reason: string | null;
}

const selectEvent = `
  SELECT event.*, student.name AS student_name, student.enrollment
  FROM access_events event
  JOIN students student ON student.id = event.student_id
`;

const mapEvent = (row: AccessEventRow): AccessEventRecord => ({
  id: row.id,
  schoolId: row.school_id,
  student: { id: row.student_id, name: row.student_name, enrollment: row.enrollment },
  direction: row.direction,
  occurredAt: row.occurred_at,
  turnstile: { id: row.turnstile_id, name: row.turnstile_name },
  status: row.status,
  method: row.method,
  createdById: row.created_by,
  source: row.source,
  reason: row.reason ?? undefined,
  notification: { whatsapp: row.whatsapp_status, pushApp: row.push_status },
});

export class AccessEventService {
  constructor(
    private readonly database: AppDatabase,
    private readonly now: () => string = () => new Date().toISOString(),
  ) {}

  private ensureAccessibleStudent(actor: DemoActor, studentId: string) {
    const student = this.database.prepare(`
      SELECT id FROM students WHERE id = ? AND school_id = ?
    `).get(studentId, actor.schoolId);
    if (!student) throw notFound('Estudante não encontrado.');

    if (actor.role === 'GUARDIAN') {
      const link = this.database.prepare(`
        SELECT 1 FROM guardian_student_links
        WHERE guardian_user_id = ? AND student_id = ? AND status = 'APPROVED'
      `).get(actor.id, studentId);
      if (!link) throw notFound('Estudante não encontrado.');
    }
  }

  listForStudent(actor: DemoActor, studentId: string, limit = 100): AccessEventRecord[] {
    this.ensureAccessibleStudent(actor, studentId);
    const rows = this.database.prepare(`
      ${selectEvent}
      WHERE event.school_id = ? AND event.student_id = ?
      ORDER BY event.occurred_at DESC, event.id DESC
      LIMIT ?
    `).all(actor.schoolId, studentId, limit) as AccessEventRow[];
    return rows.map(mapEvent);
  }

  listForSchool(actor: DemoActor, limit = 100): AccessEventRecord[] {
    if (actor.role === 'GUARDIAN') throw forbidden();
    const rows = this.database.prepare(`
      ${selectEvent}
      WHERE event.school_id = ?
      ORDER BY event.occurred_at DESC, event.id DESC
      LIMIT ?
    `).all(actor.schoolId, limit) as AccessEventRow[];
    return rows.map(mapEvent);
  }

  create(
    actor: DemoActor,
    studentId: string,
    request: CreateAccessEventRequest,
    idempotencyKey: string,
  ): { event: AccessEventRecord; created: boolean } {
    if (actor.role === 'GUARDIAN') {
      throw forbidden('Eventos de acesso só podem ser registrados por um ator escolar.');
    }
    this.ensureAccessibleStudent(actor, studentId);

    const requestHash = createHash('sha256')
      .update(JSON.stringify({ studentId, ...request }))
      .digest('hex');
    const existing = this.database.prepare(`
      ${selectEvent}
      WHERE event.created_by = ? AND event.idempotency_key = ?
    `).get(actor.id, idempotencyKey) as AccessEventRow | undefined;
    if (existing) {
      if (existing.request_hash !== requestHash) {
        throw conflict('IDEMPOTENCY_CONFLICT', 'A chave de idempotência já foi usada com outro evento.');
      }
      return { event: mapEvent(existing), created: false };
    }

    const id = randomUUID();
    const timestamp = this.now();
    const transaction = this.database.transaction(() => {
      this.database.prepare(`
        INSERT INTO access_events (
          id, school_id, student_id, direction, occurred_at, turnstile_id,
          turnstile_name, status, method, created_by, source, whatsapp_status,
          push_status, reason, idempotency_key, request_hash
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'DEMO_SIMULATION', ?, ?, ?, ?, ?)
      `).run(
        id,
        actor.schoolId,
        studentId,
        request.direction,
        timestamp,
        request.turnstileId,
        request.turnstileName.trim(),
        request.status,
        request.method,
        actor.id,
        request.whatsappStatus,
        request.pushStatus,
        request.reason?.trim() || null,
        idempotencyKey,
        requestHash,
      );
      this.database.prepare(`
        INSERT INTO audit_log (
          id, school_id, actor_id, aggregate_type, aggregate_id, action,
          previous_state, new_state, occurred_at
        ) VALUES (?, ?, ?, 'ACCESS_EVENT', ?, 'CREATED', NULL, ?, ?)
      `).run(randomUUID(), actor.schoolId, actor.id, id, request.direction, timestamp);
    });
    transaction();

    const row = this.database.prepare(`${selectEvent} WHERE event.id = ?`).get(id) as AccessEventRow;
    return { event: mapEvent(row), created: true };
  }
}
