import assert from 'node:assert/strict';
import { AddressInfo } from 'node:net';
import test from 'node:test';
import { createApp } from '../app';
import { createDatabase } from '../db';
import { apiRequest as request } from './authTestUtils';

test('auditoria é restrita e não expõe os estados internos', async () => {
  const database = createDatabase({ filename: ':memory:' });
  const server = createApp(database, { now: () => '2026-10-14T19:00:00.000Z' }).listen(0, '127.0.0.1');
  await new Promise<void>((resolve) => server.once('listening', resolve));
  const baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  const close = () => new Promise<void>((resolve, reject) => server.close((error) => {
    database.close();
    error ? reject(error) : resolve();
  }));

  await request(baseUrl, '/api/v1/guardian-link-requests', 'guardian-empty', {
    method: 'POST',
    headers: { 'Idempotency-Key': 'audit-visible' },
    body: JSON.stringify({ studentEnrollment: '2024-0182', relationship: 'Responsável' }),
  });
  let result = await request(baseUrl, '/api/v1/audit-log', 'guardian-empty');
  assert.equal(result.response.status, 403);
  result = await request(baseUrl, '/api/v1/audit-log', 'staff-1');
  assert.equal(result.response.status, 403);
  result = await request(baseUrl, '/api/v1/audit-log?limit=10&aggregateType=GUARDIAN_LINK_REQUEST', 'staff-2');
  assert.equal(result.response.status, 200);
  assert.equal(result.body.data.length, 1);
  assert.equal(result.body.data[0].actor.name, 'Responsável sem vínculo');
  assert.equal('previousState' in result.body.data[0], false);
  assert.equal('newState' in result.body.data[0], false);
  assert.deepEqual(Object.keys(result.body.data[0]).sort(), [
    'action', 'actor', 'aggregateId', 'aggregateType', 'id', 'occurredAt',
  ].sort());

  result = await request(baseUrl, '/api/v1/audit-log?limit=0', 'staff-2');
  assert.equal(result.response.status, 422);
  await close();
});
