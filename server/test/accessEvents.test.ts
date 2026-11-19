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
