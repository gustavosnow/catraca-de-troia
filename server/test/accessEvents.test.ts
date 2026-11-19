import assert from 'node:assert/strict';
import { AddressInfo } from 'node:net';
import test from 'node:test';
import { createApp } from '../app';
import { createTestDatabase } from './fixtures/schoolFixtures';
import { apiRequest as request } from './authTestUtils';

const fixedNow = () => '2026-10-14T16:00:00.000Z';

const startApi = async () => {
  const database = createTestDatabase({ filename: ':memory:' });
  const server = createApp(database, { now: fixedNow }).listen(0, '127.0.0.1');
  await new Promise<void>((resolve) => server.once('listening', resolve));
  const address = server.address() as AddressInfo;
  return {
    database,
    baseUrl: `http://127.0.0.1:${address.port}`,
    close: () => new Promise<void>((resolve, reject) => server.close((error) => {
      database.close();
      error ? reject(error) : resolve();
    })),
  };
};

const accessEvent = {
  direction: 'ENTRY',
  turnstileId: 'cat-01',
  turnstileName: 'Catraca 01 (Portão Principal)',
  status: 'MANUAL_RELEASE',
  method: 'MANUAL',
  reason: 'Passagem assistida registrada no teste.',
  whatsappStatus: 'DELIVERED',
  pushStatus: 'DELIVERED',
};

test('eventos respeitam vínculo e somente perfis escolares registram passagem', async () => {
  const api = await startApi();

  let result = await request(api.baseUrl, '/api/v1/students/std-1/access-events', 'guardian-2');
  assert.equal(result.response.status, 404);

  result = await request(api.baseUrl, '/api/v1/students/std-1/access-events', 'guardian-1', {
    method: 'POST',
    headers: { 'Idempotency-Key': 'guardian-cannot-create' },
    body: JSON.stringify(accessEvent),
  });
  assert.equal(result.response.status, 403);

  result = await request(api.baseUrl, '/api/v1/students/std-1/access-events', 'staff-1', {
    method: 'POST',
    headers: { 'Idempotency-Key': 'event-001' },
    body: JSON.stringify(accessEvent),
  });
  assert.equal(result.response.status, 201);
  assert.equal(result.body.data.direction, 'ENTRY');
  const eventId = result.body.data.id;

  result = await request(api.baseUrl, '/api/v1/students/std-1/access-events', 'guardian-1');
  assert.equal(result.response.status, 200);
  assert.equal(result.body.data[0].id, eventId);

  result = await request(api.baseUrl, '/api/v1/access-events/sync/status', 'staff-1');
  assert.equal(result.response.status, 200);
  assert.equal(result.body.data.configured, false);
  assert.equal(result.body.data.pending, 1);

  api.database.prepare(`
    UPDATE access_event_sync_queue SET state = 'CONFLICT' WHERE event_id = ?
  `).run(eventId);
  result = await request(api.baseUrl, '/api/v1/access-events/sync/retry-conflicts', 'staff-1', {
    method: 'POST',
  });
  assert.equal(result.response.status, 403);

  result = await request(api.baseUrl, '/api/v1/access-events/sync/retry-conflicts', 'staff-2', {
    method: 'POST',
  });
  assert.equal(result.response.status, 200);
  assert.equal(result.body.data.requeued, 1);

  result = await request(api.baseUrl, '/api/v1/access-events/sync/status', 'guardian-1');
  assert.equal(result.response.status, 403);

  result = await request(api.baseUrl, '/api/v1/access-events', 'guardian-1');
  assert.equal(result.response.status, 403);

  await api.close();
});

test('indicadores cobrem o dia inteiro mesmo quando o histórico recente corta passagens', async (t) => {
  const api = await startApi();
  t.after(api.close);
  const insert = api.database.prepare(`
    INSERT INTO access_events (id, school_id, student_id, direction, occurred_at, turnstile_id,
      turnstile_name, status, method, created_by, source, whatsapp_status, push_status,
      idempotency_key, request_hash, match_score, inference_ms, device_id)
    VALUES (?, 'school-1', ?, ?, ?, ?, 'Catraca do teste', 'AUTHORIZED', 'FACIAL', 'staff-1', ?,
      'PENDING', 'PENDING', ?, 'fixture', 0.7, 135, 'camera-teste')
  `);
  api.database.transaction(() => {
    insert.run('first', 'std-1', 'ENTRY', '2026-10-14T03:00:00.000Z', 'cat-02',
      'FACE_PROTOTYPE', 'device:camera-teste:carga-08e990d0-9e91-42dd-9b54-05c1672f27a1');
    insert.run('previous-day', 'std-3', 'ENTRY', '2026-10-14T02:59:59.999Z', 'cat-02',
      'FACE_PROTOTYPE', 'previous-day');
    insert.run('future', 'std-4', 'ENTRY', '2026-10-14T16:01:00.000Z', 'cat-02',
      'FACE_PROTOTYPE', 'future');
    for (let index = 0; index < 102; index += 1) {
      const instant = new Date(Date.parse('2026-10-14T11:00:00.000Z') + index * 1000).toISOString();
      const id = `today-${index}`;
      insert.run(id, 'std-2', index % 2 === 0 ? 'ENTRY' : 'EXIT', instant, 'cat-01',
        'FACE_PROTOTYPE', id);
    }
  })();

  const recent = await request(api.baseUrl, '/api/v1/access-events', 'staff-1');
  assert.equal(recent.body.data.length, 100);
  assert.ok(!recent.body.data.some((event: { id: string }) => event.id === 'first'));
  const overview = await request(api.baseUrl, '/api/v1/access-events/overview', 'staff-1');
  assert.equal(overview.response.status, 200);
  assert.deepEqual(overview.body.data, {
    entries: 52,
    exits: 51,
    onCampus: 1,
    hasDemoRecords: true,
    turnstiles: [{ id: 'cat-01', passes: 102 }, { id: 'cat-02', passes: 1 }],
  });
  const guardian = await request(api.baseUrl, '/api/v1/students/std-1/access-events', 'guardian-1');
  assert.equal(guardian.body.data[0].source, 'DEMO_SIMULATION');
  assert.equal(guardian.body.data[0].recognition, undefined);
  const [labEvent] = recent.body.data.filter((event: { id: string }) => event.id === 'today-101');
  assert.equal(labEvent.source, 'FACE_PROTOTYPE');
  assert.equal(labEvent.recognition.inferenceMs, 135);
});

test('criação de evento é idempotente e auditável', async () => {
  const api = await startApi();
  const init = {
    method: 'POST',
    headers: { 'Idempotency-Key': 'event-idempotent-001' },
    body: JSON.stringify(accessEvent),
  };

  let result = await request(api.baseUrl, '/api/v1/students/std-1/access-events', 'staff-1', init);
  assert.equal(result.response.status, 201);
  const eventId = result.body.data.id;

  result = await request(api.baseUrl, '/api/v1/students/std-1/access-events', 'staff-1', init);
  assert.equal(result.response.status, 200);
  assert.equal(result.body.data.id, eventId);

  const audit = api.database.prepare(`
    SELECT action, actor_id, new_state FROM audit_log WHERE aggregate_id = ?
  `).all(eventId) as Array<Record<string, string>>;
  assert.deepEqual(audit, [{ action: 'CREATED', actor_id: 'staff-1', new_state: 'ENTRY' }]);

  await api.close();
});

test('rota manual aceita só passagem assistida em catraca cadastrada e respeita a sequência', async (t) => {
  const api = await startApi();
  t.after(api.close);
  const post = (key: string, body: Record<string, unknown>, studentId = 'std-2') =>
    request(api.baseUrl, `/api/v1/students/${studentId}/access-events`, 'staff-1', {
      method: 'POST', headers: { 'Idempotency-Key': key }, body: JSON.stringify(body),
    });

  // Passagem "facial" pelo painel é recusada: só a câmera autenticada grava facial.
  let result = await post('manual-facial', { ...accessEvent, status: 'AUTHORIZED', method: 'FACIAL' });
  assert.equal(result.response.status, 422);

  result = await post('manual-sem-motivo', { ...accessEvent, reason: undefined });
  assert.equal(result.response.status, 422);

  result = await post('manual-catraca-falsa', { ...accessEvent, turnstileId: 'cat-99' });
  assert.equal(result.response.status, 422);

  // Saída sem entrada no dia é recusada.
  result = await post('manual-saida-primeiro', { ...accessEvent, direction: 'EXIT' });
  assert.equal(result.response.status, 409);
  assert.equal(result.body.error.code, 'SEQUENCE_CONFLICT');

  // Cliente não define status de entrega nem nome da catraca.
  result = await post('manual-entrada', {
    ...accessEvent, whatsappStatus: 'DELIVERED', pushStatus: 'DELIVERED', turnstileName: 'Nome inventado',
  });
  assert.equal(result.response.status, 201);
  assert.equal(result.body.data.source, 'ASSISTED_PASSAGE');
  assert.equal(result.body.data.notification.whatsapp, 'PENDING');
  assert.equal(result.body.data.notification.pushApp, 'PENDING');
  assert.equal(result.body.data.turnstile.name, 'Catraca 01 (Portão Principal)');

  result = await post('manual-entrada-repetida', accessEvent);
  assert.equal(result.response.status, 409);

  result = await post('manual-saida', { ...accessEvent, direction: 'EXIT' });
  assert.equal(result.response.status, 201);
  assert.equal(result.body.data.direction, 'EXIT');
});
