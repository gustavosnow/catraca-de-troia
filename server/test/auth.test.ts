import assert from 'node:assert/strict';
import { AddressInfo } from 'node:net';
import test from 'node:test';
import { createApp } from '../app';
import { createDatabase } from '../db';

test('login cria sessão, restaura identidade e logout revoga o token', async () => {
  const database = createDatabase({ filename: ':memory:' });
  let currentTime = '2026-10-14T16:00:00.000Z';
  const app = createApp(database, { now: () => currentTime });
  const server = app.listen(0, '127.0.0.1');
  await new Promise<void>((resolve) => server.once('listening', resolve));
  const { port } = server.address() as AddressInfo;
  const baseUrl = `http://127.0.0.1:${port}`;

  let response = await fetch(`${baseUrl}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: 'claudia.mendes@gmail.com', password: 'incorreta' }),
  });
  assert.equal(response.status, 401);

  response = await fetch(`${baseUrl}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: '(11) 98765-4321', password: 'Troia@2026' }),
  });
  assert.equal(response.status, 200);
  const login = await response.json() as { data: { token: string; expiresAt: string; user: Record<string, any> } };
  assert.equal(login.data.user.id, 'guardian-1');
  assert.deepEqual(login.data.user.linkedStudentIds, ['std-1', 'std-13']);
  assert.equal(login.data.token.length > 30, true);
  assert.equal(
    (database.prepare('SELECT token_hash FROM auth_sessions').get() as { token_hash: string }).token_hash
      .includes(login.data.token),
    false,
  );

  const headers = { Authorization: `Bearer ${login.data.token}` };
  response = await fetch(`${baseUrl}/api/v1/auth/session`, { headers });
  assert.equal(response.status, 200);
  assert.equal(
    (database.prepare(`
      SELECT COUNT(*) AS count FROM audit_log
      WHERE aggregate_type = 'AUTH_SESSION' AND action = 'SESSION_CREATED'
    `).get() as { count: number }).count,
    1,
  );

  response = await fetch(`${baseUrl}/api/v1/auth/logout`, { method: 'POST', headers });
  assert.equal(response.status, 204);
  assert.equal(
    (database.prepare(`
      SELECT COUNT(*) AS count FROM audit_log
      WHERE aggregate_type = 'AUTH_SESSION' AND action = 'SESSION_REVOKED'
    `).get() as { count: number }).count,
    1,
  );
  response = await fetch(`${baseUrl}/api/v1/auth/session`, { headers });
  assert.equal(response.status, 401);

  response = await fetch(`${baseUrl}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: 'MAT-2026/0481', password: 'Troia@2026' }),
  });
  const staffLogin = await response.json() as { data: { token: string } };
  currentTime = '2026-10-15T05:00:01.000Z';
  response = await fetch(`${baseUrl}/api/v1/auth/session`, {
    headers: { Authorization: `Bearer ${staffLogin.data.token}` },
  });
  assert.equal(response.status, 401);

  await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  database.close();
});

test('API aplica cabeçalhos de segurança e limita tentativas repetidas de login', async () => {
  const database = createDatabase({ filename: ':memory:' });
  const server = createApp(database).listen(0, '127.0.0.1');
  await new Promise<void>((resolve) => server.once('listening', resolve));
  const { port } = server.address() as AddressInfo;
  const baseUrl = `http://127.0.0.1:${port}`;

  const health = await fetch(`${baseUrl}/api/health`);
  assert.equal(health.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(health.headers.get('x-frame-options'), 'DENY');
  assert.equal(health.headers.get('cache-control'), 'no-store');

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const response = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'sem.vinculo@gmail.com', password: 'senha-incorreta' }),
    });
    assert.equal(response.status, 401);
  }
  const limited = await fetch(`${baseUrl}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: 'sem.vinculo@gmail.com', password: 'senha-incorreta' }),
  });
  assert.equal(limited.status, 429);
  assert.equal((await limited.json() as { error: { code: string } }).error.code, 'RATE_LIMITED');

  await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  database.close();
});
