import { randomUUID } from 'node:crypto';
import type {
  NotificationDeliveryRecord,
  NotificationDeliverySnapshot,
} from '../../../shared/contracts/notificationDelivery';
import type { DemoActor } from '../../../shared/contracts/justifications';
import type { AppDatabase } from '../../db';
import { forbidden } from '../../errors';

interface DeliveryRow {
  id: string;
  recipient_name: string;
  title: string;
  channel: 'PUSH_DEMO';
  state: NotificationDeliveryRecord['state'];
  attempt_count: number;
  created_at: string;
  last_attempt_at: string | null;
  delivered_at: string | null;
  available_at: string;
  last_error: string | null;
}

const canManage = (actor: DemoActor) =>
  actor.role === 'STAFF_COORDINATION' || actor.role === 'STAFF_DIRECTION';

export class NotificationDeliveryService {
  constructor(
    private readonly database: AppDatabase,
    private readonly now: () => string = () => new Date().toISOString(),
  ) {}

  snapshot(actor: DemoActor): NotificationDeliverySnapshot {
    if (!canManage(actor)) throw forbidden('Somente Coordenação ou Direção acompanha a fila de entrega.');
    const rawCounts = this.database.prepare(`
      SELECT state, COUNT(*) AS count FROM notification_delivery_queue
      WHERE school_id = ? GROUP BY state
    `).all(actor.schoolId) as Array<{ state: NotificationDeliveryRecord['state']; count: number }>;
    const counts = { PENDING: 0, DELIVERED: 0, FAILED: 0 };
    for (const item of rawCounts) counts[item.state] = item.count;
    const rows = this.database.prepare(`
      SELECT queue.id, users.name AS recipient_name, notification.title, queue.channel,
        queue.state, queue.attempt_count, queue.created_at, queue.last_attempt_at,
        queue.delivered_at, queue.available_at, queue.last_error
      FROM notification_delivery_queue queue
      JOIN users ON users.id = queue.recipient_user_id
      JOIN in_app_notifications notification ON notification.id = queue.notification_id
      WHERE queue.school_id = ?
      ORDER BY queue.updated_at DESC, queue.id DESC LIMIT 100
    `).all(actor.schoolId) as DeliveryRow[];
    return {
      counts,
      channelConfigured: false,
      records: rows.map((row) => ({
        id: row.id,
        recipientName: row.recipient_name,
        title: row.title,
        channel: row.channel,
        state: row.state,
        attemptCount: row.attempt_count,
        createdAt: row.created_at,
        lastAttemptAt: row.last_attempt_at ?? undefined,
        deliveredAt: row.delivered_at ?? undefined,
        nextAttemptAt: row.state === 'FAILED' ? row.available_at : undefined,
        lastError: row.last_error ?? undefined,
      })),
    };
  }

  process(actor: DemoActor, outcome: 'DELIVER' | 'FAIL_RETRY') {
    if (!canManage(actor)) throw forbidden('Somente Coordenação ou Direção processa a fila demonstrativa.');
    const timestamp = this.now();
    const due = this.database.prepare(`
      SELECT id, attempt_count FROM notification_delivery_queue
      WHERE school_id = ? AND state IN ('PENDING', 'FAILED') AND available_at <= ?
      ORDER BY created_at, id LIMIT 50
    `).all(actor.schoolId, timestamp) as Array<{ id: string; attempt_count: number }>;
    this.database.transaction(() => {
      for (const item of due) {
        if (outcome === 'DELIVER') {
          this.database.prepare(`
            UPDATE notification_delivery_queue SET state = 'DELIVERED',
              attempt_count = attempt_count + 1, last_attempt_at = ?, delivered_at = ?,
              last_error = NULL, updated_at = ? WHERE id = ?
          `).run(timestamp, timestamp, timestamp, item.id);
        } else {
          const backoffMinutes = Math.min(60, 2 ** Math.min(item.attempt_count, 5));
          const availableAt = new Date(new Date(timestamp).getTime() + backoffMinutes * 60_000).toISOString();
          this.database.prepare(`
            UPDATE notification_delivery_queue SET state = 'FAILED',
              attempt_count = attempt_count + 1, last_attempt_at = ?, available_at = ?,
              last_error = 'Canal externo simulado indisponível.', updated_at = ? WHERE id = ?
          `).run(timestamp, availableAt, timestamp, item.id);
        }
      }
      if (due.length > 0) {
        this.database.prepare(`
          INSERT INTO audit_log
            (id, school_id, actor_id, aggregate_type, aggregate_id, action, previous_state, new_state, occurred_at)
          VALUES (?, ?, ?, 'NOTIFICATION_DELIVERY', ?, ?, NULL, ?, ?)
        `).run(
          randomUUID(), actor.schoolId, actor.id, randomUUID(),
          outcome === 'DELIVER' ? 'DEMO_BATCH_DELIVERED' : 'DEMO_BATCH_FAILED',
          String(due.length), timestamp,
        );
      }
    })();
    return { processed: due.length };
  }

  retry(actor: DemoActor) {
    if (!canManage(actor)) throw forbidden('Somente Coordenação ou Direção reenfileira entregas.');
    const timestamp = this.now();
    const updated = this.database.prepare(`
      UPDATE notification_delivery_queue SET state = 'PENDING', available_at = ?,
        last_error = NULL, updated_at = ? WHERE school_id = ? AND state = 'FAILED'
    `).run(timestamp, timestamp, actor.schoolId).changes;
    return { updated };
  }
}
