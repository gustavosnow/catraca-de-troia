import assert from 'node:assert/strict';
import test from 'node:test';
import type { AccessEventSyncPayload } from '../../shared/contracts/accessEventSync';
import type { DemoActor } from '../../shared/contracts/justifications';
import { createDatabase } from '../db';
import { ApiError } from '../errors';
import { AccessEventService } from '../modules/accessEvents/service';
import {
  AccessEventSyncReceiver,
  AccessEventSyncService,
  type AccessEventSyncTransport,
  type SyncTransportResult,
} from '../modules/accessEvents/syncService';

const actor: DemoActor = {
  id: 'staff-1',
  schoolId: 'school-1',
  name: 'Carlos Mendes',
  role: 'STAFF_GATE',
};

const eventRequest = {
  direction: 'ENTRY',
  turnstileId: 'cat-01',
  turnstileName: 'Catraca 01 (Portão Principal)',
  status: 'AUTHORIZED',
  method: 'FACIAL',
  whatsappStatus: 'PENDING',
  pushStatus: 'PENDING',
} as const;

const readPayload = (database: ReturnType<typeof createDatabase>, eventId: string) => {
  const row = database.prepare('SELECT * FROM access_events WHERE id = ?').get(eventId) as Record<string, string>;
  return {
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
    reason: row.reason || undefined,
  } as AccessEventSyncPayload;
};

test('evento e item da fila local são persistidos atomicamente', () => {
  const database = createDatabase({ filename: ':memory:' });
  const service = new AccessEventService(database, () => '2026-10-14T16:00:00.000Z', 'gate-node-01');
  const result = service.create(actor, 'std-1', eventRequest, 'offline-001');

  const queued = database.prepare(`
    SELECT state, attempt_count, school_id FROM access_event_sync_queue WHERE event_id = ?
  `).get(result.event.id) as Record<string, string | number>;
  assert.deepEqual(queued, { state: 'PENDING', attempt_count: 0, school_id: 'school-1' });
  assert.equal(readPayload(database, result.event.id).sourceNodeId, 'gate-node-01');
  database.close();
});

test('fila retenta após indisponibilidade e sincroniza quando a conectividade retorna', async () => {
  const database = createDatabase({ filename: ':memory:' });
  let currentTime = '2026-10-14T16:00:00.000Z';
  const event = new AccessEventService(database, () => currentTime, 'gate-node-01')
    .create(actor, 'std-1', eventRequest, 'offline-002').event;
  const outcomes: SyncTransportResult[] = [
    { kind: 'retry', code: 'REMOTE_UNREACHABLE', message: 'sem conexão' },
    { kind: 'accepted', remoteEventId: 'remote-event-1' },
  ];
  const transport: AccessEventSyncTransport = {
    send: async () => outcomes.shift()!,
  };
  const sync = new AccessEventSyncService(database, transport, () => currentTime);

  assert.equal(await sync.processDue(), 1);
  let queued = database.prepare(`
    SELECT state, attempt_count, available_at, last_error_code
    FROM access_event_sync_queue WHERE event_id = ?
  `).get(event.id) as Record<string, string | number>;
  assert.deepEqual(queued, {
    state: 'PENDING',
    attempt_count: 1,
    available_at: '2026-10-14T16:00:01.000Z',
    last_error_code: 'REMOTE_UNREACHABLE',
  });

  currentTime = '2026-10-14T16:00:02.000Z';
  assert.equal(await sync.processDue(), 1);
  queued = database.prepare(`
    SELECT state, attempt_count, remote_event_id, synced_at
    FROM access_event_sync_queue WHERE event_id = ?
  `).get(event.id) as Record<string, string | number>;
  assert.deepEqual(queued, {
    state: 'SYNCED',
    attempt_count: 2,
    remote_event_id: 'remote-event-1',
    synced_at: currentTime,
  });
  database.close();
});

test('receptor deduplica repetição e isola conteúdo conflitante', () => {
  const source = createDatabase({ filename: ':memory:' });
  const destination = createDatabase({ filename: ':memory:' });
  const event = new AccessEventService(source, () => '2026-10-14T16:00:00.000Z', 'gate-node-01')
    .create(actor, 'std-1', eventRequest, 'offline-003').event;
  const payload = readPayload(source, event.id);
  const receiver = new AccessEventSyncReceiver(destination, () => '2026-10-14T16:01:00.000Z');

  const first = receiver.ingest(payload);
  const duplicate = receiver.ingest(payload);
  assert.equal(first.result, 'CREATED');
  assert.deepEqual(duplicate, { eventId: first.eventId, result: 'ALREADY_SYNCED' });
  assert.equal((destination.prepare('SELECT COUNT(*) AS count FROM access_events').get() as { count: number }).count, 1);
  assert.equal((destination.prepare('SELECT COUNT(*) AS count FROM access_event_sync_queue').get() as { count: number }).count, 0);

  assert.throws(
    () => receiver.ingest({ ...payload, direction: 'EXIT' }),
    (error: unknown) => error instanceof ApiError && error.code === 'SYNC_CONFLICT',
  );
  assert.equal((destination.prepare('SELECT COUNT(*) AS count FROM access_events').get() as { count: number }).count, 1);
  source.close();
  destination.close();
});

test('item abandonado em processamento volta a ser adquirido após expiração do lease', async () => {
  const database = createDatabase({ filename: ':memory:' });
  const event = new AccessEventService(database, () => '2026-10-14T16:00:00.000Z', 'gate-node-01')
    .create(actor, 'std-1', eventRequest, 'offline-004').event;
  database.prepare(`
    UPDATE access_event_sync_queue
    SET state = 'PROCESSING', lease_expires_at = '2026-10-14T16:00:30.000Z'
    WHERE event_id = ?
  `).run(event.id);
  const sync = new AccessEventSyncService(database, {
    send: async () => ({ kind: 'accepted', remoteEventId: 'recovered-1' }),
  }, () => '2026-10-14T16:01:00.000Z');

  assert.equal(await sync.processDue(), 1);
  const queued = database.prepare(`
    SELECT state, remote_event_id FROM access_event_sync_queue WHERE event_id = ?
  `).get(event.id);
  assert.deepEqual(queued, { state: 'SYNCED', remote_event_id: 'recovered-1' });
  database.close();
});
