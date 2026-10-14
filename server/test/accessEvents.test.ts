import assert from 'node:assert/strict';
import { AddressInfo } from 'node:net';
import test from 'node:test';
import { createApp } from '../app';
import { createDatabase } from '../db';
import { apiRequest as request } from './authTestUtils';

const fixedNow = () => '2026-10-14T16:00:00.000Z';

const startApi = async () => {
  const database = createDatabase({ filename: ':memory:' });
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
  status: 'AUTHORIZED',
  method: 'FACIAL',
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
  assert.equal(result.body.data.pending, 1);

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
