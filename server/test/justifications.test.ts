import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { AddressInfo } from 'node:net';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { createApp } from '../app';
import { AppDatabase, createDatabase } from '../db';
import { apiRequest as request } from './authTestUtils';

const fixedNow = () => '2026-10-14T15:30:00.000Z';

const startApi = async (database: AppDatabase) => {
  const server = createApp(database, { now: fixedNow }).listen(0, '127.0.0.1');
  await new Promise<void>((resolve) => server.once('listening', resolve));
  const address = server.address() as AddressInfo;
  return {
    baseUrl: `http://127.0.0.1:${address.port}`,
    close: () => new Promise<void>((resolve, reject) =>
      server.close((error) => error ? reject(error) : resolve()),
    ),
  };
};

const newJustification = {
  absenceStartDate: '2026-10-14',
  reasonCategory: 'MEDICAL',
  description: 'Consulta médica demonstrativa.',
};

test('sessão é obrigatória e vínculos são aplicados no backend', async () => {
  const database = createDatabase({ filename: ':memory:' });
  const api = await startApi(database);
  let result = await request(api.baseUrl, '/api/v1/me');
  assert.equal(result.response.status, 401);

  result = await request(api.baseUrl, '/api/v1/me/students', 'guardian-1');
  assert.equal(result.response.status, 200);
  assert.deepEqual(result.body.data.map((student: { id: string }) => student.id).sort(), ['std-1', 'std-13']);

  result = await request(api.baseUrl, '/api/v1/me/students', 'guardian-empty');
  assert.equal(result.response.status, 200);
  assert.deepEqual(result.body.data, []);

  result = await request(api.baseUrl, '/api/v1/students/std-1/justifications', 'guardian-2');
  assert.equal(result.response.status, 404);
  assert.equal(result.body.error.code, 'NOT_FOUND');

  await api.close();
  database.close();
});

test('criação é idempotente, auditável e persiste após reabrir o SQLite', async () => {
  const tempDirectory = mkdtempSync(path.join(tmpdir(), 'catraca-api-'));
  const filename = path.join(tempDirectory, 'test.sqlite');
  let database = createDatabase({ filename });
  let api = await startApi(database);

  const createHeaders = { 'Idempotency-Key': 'request-001' };
  let result = await request(api.baseUrl, '/api/v1/students/std-1/justifications', 'guardian-1', {
    method: 'POST',
    headers: createHeaders,
    body: JSON.stringify(newJustification),
  });
  assert.equal(result.response.status, 201);
  const justificationId = result.body.data.id as string;
  assert.equal(result.body.data.status, 'PENDING');
  assert.equal(result.body.data.version, 1);

  result = await request(api.baseUrl, '/api/v1/students/std-1/justifications', 'guardian-1', {
    method: 'POST',
    headers: createHeaders,
    body: JSON.stringify(newJustification),
  });
  assert.equal(result.response.status, 200);
  assert.equal(result.body.data.id, justificationId);

  result = await request(api.baseUrl, '/api/v1/students/std-1/justifications', 'guardian-1', {
    method: 'POST',
    headers: createHeaders,
    body: JSON.stringify({ ...newJustification, description: 'Conteúdo diferente.' }),
  });
  assert.equal(result.response.status, 409);
  assert.equal(result.body.error.code, 'IDEMPOTENCY_CONFLICT');

  assert.equal(
    (database.prepare(`
      SELECT COUNT(*) AS count FROM audit_log WHERE aggregate_type = 'JUSTIFICATION'
    `).get() as { count: number }).count,
    1,
  );
  await api.close();
  database.close();

  database = createDatabase({ filename });
  api = await startApi(database);
  result = await request(api.baseUrl, '/api/v1/students/std-1/justifications', 'guardian-1');
  assert.equal(result.response.status, 200);
  assert.equal(result.body.data.length, 1);
  assert.equal(result.body.data[0].id, justificationId);

  await api.close();
  database.close();
  rmSync(tempDirectory, { recursive: true, force: true });
});

test('somente Coordenação ou Direção revisa com controle otimista e auditoria', async () => {
  const database = createDatabase({ filename: ':memory:' });
  const api = await startApi(database);

  let result = await request(api.baseUrl, '/api/v1/students/std-1/justifications', 'guardian-1', {
    method: 'POST',
    headers: { 'Idempotency-Key': 'request-review-001' },
    body: JSON.stringify(newJustification),
  });
  const justificationId = result.body.data.id as string;

  result = await request(api.baseUrl, `/api/v1/justifications/${justificationId}/status`, 'staff-1', {
    method: 'PATCH',
    body: JSON.stringify({ status: 'APPROVED', expectedVersion: 1 }),
  });
  assert.equal(result.response.status, 403);

  result = await request(api.baseUrl, `/api/v1/justifications/${justificationId}/status`, 'staff-2', {
    method: 'PATCH',
    body: JSON.stringify({ status: 'APPROVED', expectedVersion: 1 }),
  });
  assert.equal(result.response.status, 200);
  assert.equal(result.body.data.status, 'APPROVED');
  assert.equal(result.body.data.version, 2);
  assert.equal(result.body.data.reviewedById, 'staff-2');

  result = await request(api.baseUrl, `/api/v1/justifications/${justificationId}/status`, 'staff-3', {
    method: 'PATCH',
    body: JSON.stringify({ status: 'REJECTED', expectedVersion: 1 }),
  });
  assert.equal(result.response.status, 409);
  assert.equal(result.body.error.code, 'VERSION_CONFLICT');

  const audit = database.prepare(`
    SELECT action, actor_id, previous_state, new_state FROM audit_log
    WHERE aggregate_id = ? ORDER BY occurred_at, action
  `).all(justificationId) as Array<Record<string, string | null>>;
  assert.equal(audit.length, 2);
  assert.deepEqual(audit.map((entry) => entry.action).sort(), ['CREATED', 'REVIEWED']);
  assert.equal(audit.find((entry) => entry.action === 'REVIEWED')?.actor_id, 'staff-2');
  assert.equal(audit.find((entry) => entry.action === 'REVIEWED')?.new_state, 'APPROVED');

  await api.close();
  database.close();
});
