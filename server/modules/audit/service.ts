import type { AuditLogRecord } from '../../../shared/contracts/audit';
import type { DemoActor } from '../../../shared/contracts/justifications';
import type { AppDatabase } from '../../db';
import { forbidden } from '../../errors';

interface AuditRow {
  id: string;
  actor_id: string;
  actor_name: string;
  aggregate_type: string;
  aggregate_id: string;
  action: string;
  occurred_at: string;
}

const canView = (actor: DemoActor) =>
  actor.role === 'STAFF_COORDINATION' || actor.role === 'STAFF_DIRECTION';

export class AuditService {
  constructor(private readonly database: AppDatabase) {}

  list(actor: DemoActor, limit: number, aggregateType?: string): AuditLogRecord[] {
    if (!canView(actor)) throw forbidden('Somente Coordenação ou Direção consulta a auditoria.');
    const rows = (aggregateType
      ? this.database.prepare(`
          SELECT audit.id, audit.actor_id, users.name AS actor_name,
            audit.aggregate_type, audit.aggregate_id, audit.action, audit.occurred_at
          FROM audit_log audit JOIN users ON users.id = audit.actor_id
          WHERE audit.school_id = ? AND audit.aggregate_type = ?
          ORDER BY audit.occurred_at DESC, audit.id DESC LIMIT ?
        `).all(actor.schoolId, aggregateType, limit)
      : this.database.prepare(`
          SELECT audit.id, audit.actor_id, users.name AS actor_name,
            audit.aggregate_type, audit.aggregate_id, audit.action, audit.occurred_at
          FROM audit_log audit JOIN users ON users.id = audit.actor_id
          WHERE audit.school_id = ?
          ORDER BY audit.occurred_at DESC, audit.id DESC LIMIT ?
        `).all(actor.schoolId, limit)) as AuditRow[];
    return rows.map((row) => ({
      id: row.id,
      actor: { id: row.actor_id, name: row.actor_name },
      aggregateType: row.aggregate_type,
      aggregateId: row.aggregate_id,
      action: row.action,
      occurredAt: row.occurred_at,
    }));
  }
}
