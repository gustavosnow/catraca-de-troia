import { randomUUID } from 'node:crypto';
import type {
  AccessEventSyncPayload,
  AccessEventSyncReceipt,
  AccessEventSyncStatus,
} from '../../../shared/contracts/accessEventSync';
import type { DemoActor } from '../../../shared/contracts/justifications';
import type { AppDatabase } from '../../db';
import { conflict, forbidden, invalidRequest } from '../../errors';
import { hashSyncPayload } from './service';

interface QueueRow {
  event_id: string;
  attempt_count: number;
}

interface EventPayloadRow {
  id: string;
  school_id: string;
  student_id: string;
  direction: AccessEventSyncPayload['direction'];
  occurred_at: string;
  turnstile_id: string;
  turnstile_name: string;
  status: AccessEventSyncPayload['status'];
  method: AccessEventSyncPayload['method'];
  created_by: string;
  source: AccessEventSyncPayload['source'];
  whatsapp_status: AccessEventSyncPayload['whatsappStatus'];
  push_status: AccessEventSyncPayload['pushStatus'];
  reason: string | null;
  origin_node_id: string;
  origin_event_id: string;
}

export type SyncTransportResult =
  | { kind: 'accepted'; remoteEventId: string }
  | { kind: 'conflict'; code: string; message: string }
  | { kind: 'retry'; code: string; message: string };

export interface AccessEventSyncTransport {
  send(payload: AccessEventSyncPayload): Promise<SyncTransportResult>;
}

const payloadFromRow = (row: EventPayloadRow): AccessEventSyncPayload => ({
  sourceNodeId: row.origin_node_id,
  sourceEventId: row.origin_event_id,
  schoolId: row.school_id,
  studentId: row.student_id,
  direction: row.direction,
  occurredAt: row.occurred_at,
  turnstileId: row.turnstile_id,
  turnstileName: row.turnstile_name,
  status: row.status,
  method: row.method,
  createdById: row.created_by,
  source: row.source,
  whatsappStatus: row.whatsapp_status,
  pushStatus: row.push_status,
  reason: row.reason ?? undefined,
});

const addMilliseconds = (iso: string, milliseconds: number) =>
  new Date(new Date(iso).getTime() + milliseconds).toISOString();

export class AccessEventSyncService {
  private running = false;

  constructor(
    private readonly database: AppDatabase,
    private readonly transport: AccessEventSyncTransport,
    private readonly now: () => string = () => new Date().toISOString(),
    private readonly configured = true,
  ) {}

  status(actor: DemoActor): AccessEventSyncStatus {
    if (actor.role === 'GUARDIAN') throw forbidden();
    const counts = this.database.prepare(`
      SELECT
        SUM(CASE WHEN state = 'PENDING' THEN 1 ELSE 0 END) AS pending,
        SUM(CASE WHEN state = 'PROCESSING' THEN 1 ELSE 0 END) AS processing,
        SUM(CASE WHEN state = 'SYNCED' THEN 1 ELSE 0 END) AS synced,
        SUM(CASE WHEN state = 'CONFLICT' THEN 1 ELSE 0 END) AS conflicts,
        MAX(synced_at) AS last_synced_at,
        MIN(CASE WHEN state = 'PENDING' THEN available_at END) AS next_attempt_at
      FROM access_event_sync_queue WHERE school_id = ?
    `).get(actor.schoolId) as Record<string, number | string | null>;
    return {
      configured: this.configured,
      pending: Number(counts.pending || 0),
      processing: Number(counts.processing || 0),
      synced: Number(counts.synced || 0),
      conflicts: Number(counts.conflicts || 0),
      lastSyncedAt: counts.last_synced_at as string || undefined,
      nextAttemptAt: counts.next_attempt_at as string || undefined,
    };
  }

  retryConflicts(actor: DemoActor): number {
    if (!['STAFF_COORDINATION', 'STAFF_DIRECTION'].includes(actor.role)) {
      throw forbidden('Somente Coordenação ou Direção pode reenfileirar conflitos.');
    }
    const timestamp = this.now();
    return this.database.prepare(`
      UPDATE access_event_sync_queue
      SET state = 'PENDING', available_at = ?, lease_expires_at = NULL,
          last_error_code = NULL, last_error_message = NULL, updated_at = ?
      WHERE school_id = ? AND state = 'CONFLICT'
    `).run(timestamp, timestamp, actor.schoolId).changes;
  }

  async processDue(limit = 50): Promise<number> {
    if (this.running) return 0;
    this.running = true;
    try {
      const timestamp = this.now();
      const rows = this.database.prepare(`
        SELECT event_id, attempt_count FROM access_event_sync_queue
        WHERE (state = 'PENDING' AND available_at <= ?)
           OR (state = 'PROCESSING' AND lease_expires_at <= ?)
        ORDER BY created_at ASC LIMIT ?
      `).all(timestamp, timestamp, limit) as QueueRow[];

      for (const row of rows) {
        const claimed = this.database.prepare(`
          UPDATE access_event_sync_queue
          SET state = 'PROCESSING', attempt_count = attempt_count + 1,
              last_attempt_at = ?, lease_expires_at = ?, updated_at = ?
          WHERE event_id = ? AND (
            (state = 'PENDING' AND available_at <= ?)
            OR (state = 'PROCESSING' AND lease_expires_at <= ?)
          )
        `).run(timestamp, addMilliseconds(timestamp, 60_000), timestamp, row.event_id, timestamp, timestamp);
        if (claimed.changes === 0) continue;

        const event = this.database.prepare(`
          SELECT * FROM access_events WHERE id = ?
        `).get(row.event_id) as EventPayloadRow | undefined;
        if (!event) continue;

        let result: SyncTransportResult;
        try {
          result = await this.transport.send(payloadFromRow(event));
        } catch (error) {
          result = {
            kind: 'retry',
            code: 'TRANSPORT_ERROR',
            message: error instanceof Error ? error.message : 'Falha de transporte.',
          };
        }
        const completedAt = this.now();
        if (result.kind === 'accepted') {
          this.database.prepare(`
            UPDATE access_event_sync_queue
            SET state = 'SYNCED', synced_at = ?, remote_event_id = ?,
                lease_expires_at = NULL, last_error_code = NULL,
                last_error_message = NULL, updated_at = ?
            WHERE event_id = ?
          `).run(completedAt, result.remoteEventId, completedAt, row.event_id);
        } else if (result.kind === 'conflict') {
          this.database.prepare(`
            UPDATE access_event_sync_queue
            SET state = 'CONFLICT', lease_expires_at = NULL, last_error_code = ?,
                last_error_message = ?, updated_at = ? WHERE event_id = ?
          `).run(result.code, result.message.slice(0, 500), completedAt, row.event_id);
        } else {
          const attempts = row.attempt_count + 1;
          const delay = Math.min(300_000, 1_000 * 2 ** Math.min(attempts - 1, 8));
          this.database.prepare(`
            UPDATE access_event_sync_queue
            SET state = 'PENDING', available_at = ?, lease_expires_at = NULL,
                last_error_code = ?, last_error_message = ?, updated_at = ?
            WHERE event_id = ?
          `).run(
            addMilliseconds(completedAt, delay),
            result.code,
            result.message.slice(0, 500),
            completedAt,
            row.event_id,
          );
        }
      }
      return rows.length;
    } finally {
      this.running = false;
    }
  }
}

export class AccessEventSyncReceiver {
  constructor(
    private readonly database: AppDatabase,
    private readonly now: () => string = () => new Date().toISOString(),
  ) {}

  ingest(payload: AccessEventSyncPayload): AccessEventSyncReceipt {
    const payloadHash = hashSyncPayload(payload);
    const existing = this.database.prepare(`
      SELECT id, sync_payload_hash FROM access_events
      WHERE origin_node_id = ? AND origin_event_id = ?
    `).get(payload.sourceNodeId, payload.sourceEventId) as
      | { id: string; sync_payload_hash: string }
      | undefined;
    if (existing) {
      if (existing.sync_payload_hash !== payloadHash) {
        throw conflict('SYNC_CONFLICT', 'O identificador de origem já existe com conteúdo diferente.');
      }
      return { eventId: existing.id, result: 'ALREADY_SYNCED' };
    }

    const school = this.database.prepare('SELECT 1 FROM schools WHERE id = ?').get(payload.schoolId);
    const student = this.database.prepare(`
      SELECT 1 FROM students WHERE id = ? AND school_id = ?
    `).get(payload.studentId, payload.schoolId);
    const actor = this.database.prepare(`
      SELECT role FROM users WHERE id = ? AND school_id = ?
    `).get(payload.createdById, payload.schoolId) as { role: string } | undefined;
    if (!school || !student || !actor || actor.role === 'GUARDIAN') {
      throw invalidRequest('Escola, estudante ou ator de origem não é válido neste destino.');
    }

    const id = randomUUID();
    const timestamp = this.now();
    const transaction = this.database.transaction(() => {
      this.database.prepare(`
        INSERT INTO access_events (
          id, school_id, student_id, direction, occurred_at, turnstile_id,
          turnstile_name, status, method, created_by, source, whatsapp_status,
          push_status, reason, idempotency_key, request_hash, origin_node_id,
          origin_event_id, sync_payload_hash
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id, payload.schoolId, payload.studentId, payload.direction, payload.occurredAt,
        payload.turnstileId, payload.turnstileName, payload.status, payload.method,
        payload.createdById, payload.source, payload.whatsappStatus, payload.pushStatus,
        payload.reason || null, `sync:${payload.sourceNodeId}:${payload.sourceEventId}`,
        payloadHash, payload.sourceNodeId, payload.sourceEventId, payloadHash,
      );
      this.database.prepare(`
        INSERT INTO audit_log (
          id, school_id, actor_id, aggregate_type, aggregate_id, action,
          previous_state, new_state, occurred_at
        ) VALUES (?, ?, ?, 'ACCESS_EVENT', ?, 'SYNC_RECEIVED', NULL, ?, ?)
      `).run(randomUUID(), payload.schoolId, payload.createdById, id, payload.sourceEventId, timestamp);
    });
    transaction();
    return { eventId: id, result: 'CREATED' };
  }
}

export class HttpAccessEventSyncTransport implements AccessEventSyncTransport {
  constructor(private readonly remoteUrl: string, private readonly sharedSecret: string) {}

  async send(payload: AccessEventSyncPayload): Promise<SyncTransportResult> {
    let response: Response;
    try {
      response = await fetch(`${this.remoteUrl.replace(/\/$/, '')}/api/v1/sync/access-events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Sync-Token': this.sharedSecret },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10_000),
      });
    } catch (error) {
      return { kind: 'retry', code: 'REMOTE_UNREACHABLE', message: error instanceof Error ? error.message : 'Destino indisponível.' };
    }
    const body = await response.json().catch(() => null) as {
      data?: AccessEventSyncReceipt;
      error?: { code?: string; message?: string };
    } | null;
    if (response.ok && body?.data) return { kind: 'accepted', remoteEventId: body.data.eventId };
    if (response.status === 409 || (response.status >= 400 && response.status < 500)) {
      return {
        kind: 'conflict',
        code: body?.error?.code || `REMOTE_${response.status}`,
        message: body?.error?.message || 'O destino rejeitou o evento.',
      };
    }
    return {
      kind: 'retry',
      code: `REMOTE_${response.status}`,
      message: body?.error?.message || 'O destino está temporariamente indisponível.',
    };
  }
}
