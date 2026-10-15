import assert from 'node:assert/strict';
import { AddressInfo } from 'node:net';
import test from 'node:test';
import { createApp } from '../app';
import { createDatabase } from '../db';
import { apiRequest as request, loginAs } from './authTestUtils';

test('Coordenação administra contas e revoga sessões com auditoria', async () => {
  const database = createDatabase({ filename: ':memory:' });
  const server = createApp(database, { now: () => '2026-10-15T15:00:00.000Z' }).listen(0, '127.0.0.1');
  await new Promise<void>((resolve) => server.once('listening', resolve));
  const baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  const close = () => new Promise<void>((resolve, reject) => server.close((error) => {
    database.close();
    error ? reject(error) : resolve();
  }));

  let result = await request(baseUrl, '/api/v1/accounts', 'guardian-1');
  assert.equal(result.response.status, 403);
  result = await request(baseUrl, '/api/v1/accounts', 'staff-1');
  assert.equal(result.response.status, 403);

  const guardianToken = await loginAs(baseUrl, 'guardian-2');
  result = await request(baseUrl, '/api/v1/accounts', 'staff-2');
  assert.equal(result.response.status, 200);
  const guardian = result.body.data.find((account: { id: string }) => account.id === 'guardian-2');
  assert.equal(guardian.status, 'ACTIVE');
  assert.equal(guardian.activeSessionCount >= 1, true);

  result = await request(baseUrl, '/api/v1/accounts/guardian-2/status', 'staff-2', {
    method: 'PATCH',
    body: JSON.stringify({ status: 'BLOCKED', expectedVersion: guardian.version, reason: 'Bloqueio demonstrativo solicitado pela gestão.' }),
  });
  assert.equal(result.response.status, 200);
  assert.equal(result.body.data.status, 'BLOCKED');
  assert.equal(result.body.data.activeSessionCount, 0);

  const blockedSession = await fetch(`${baseUrl}/api/v1/auth/session`, {
    headers: { Authorization: `Bearer ${guardianToken}` },
  });
  assert.equal(blockedSession.status, 401);
  const blockedLogin = await fetch(`${baseUrl}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: 'rodrigo.oliveira@gmail.com', password: 'Troia@2026' }),
  });
  assert.equal(blockedLogin.status, 401);

  result = await request(baseUrl, '/api/v1/accounts/guardian-2/status', 'staff-2', {
    method: 'PATCH',
    body: JSON.stringify({ status: 'ACTIVE', expectedVersion: guardian.version + 1, reason: 'Conferência acadêmica concluída.' }),
  });
  assert.equal(result.response.status, 200);
  assert.equal(result.body.data.status, 'ACTIVE');

  await loginAs(baseUrl, 'guardian-2');
  result = await request(baseUrl, '/api/v1/accounts/guardian-2/revoke-sessions', 'staff-2', {
    method: 'POST',
    body: JSON.stringify({ reason: 'Encerramento remoto para teste acadêmico.' }),
  });
  assert.equal(result.response.status, 200);
  assert.equal(result.body.data.revoked >= 1, true);

  const auditActions = database.prepare(`
    SELECT action FROM audit_log WHERE aggregate_id = 'guardian-2'
      AND action IN ('ACCOUNT_BLOCKED', 'ACCOUNT_UNBLOCKED', 'SESSIONS_REVOKED_REMOTELY')
    ORDER BY occurred_at, rowid
  `).all() as Array<{ action: string }>;
  assert.deepEqual(auditActions.map((item) => item.action), [
    'ACCOUNT_BLOCKED', 'ACCOUNT_UNBLOCKED', 'SESSIONS_REVOKED_REMOTELY',
  ]);

  await close();
});

test('gestor não bloqueia a própria conta pela sessão ativa', async () => {
  const database = createDatabase({ filename: ':memory:' });
  const server = createApp(database).listen(0, '127.0.0.1');
  await new Promise<void>((resolve) => server.once('listening', resolve));
  const baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  const result = await request(baseUrl, '/api/v1/accounts/staff-2/status', 'staff-2', {
    method: 'PATCH',
    body: JSON.stringify({ status: 'BLOCKED', expectedVersion: 1, reason: 'Tentativa da própria conta.' }),
  });
  assert.equal(result.response.status, 403);
  await new Promise<void>((resolve, reject) => server.close((error) => {
    database.close();
    error ? reject(error) : resolve();
  }));
});
