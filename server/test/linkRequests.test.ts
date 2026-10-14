import assert from 'node:assert/strict';
import { AddressInfo } from 'node:net';
import test from 'node:test';
import { createApp } from '../app';
import { createDatabase } from '../db';
import { apiRequest as request } from './authTestUtils';

const startApi = async () => {
  const database = createDatabase({ filename: ':memory:' });
  const server = createApp(database, { now: () => '2026-10-14T19:00:00.000Z' })
    .listen(0, '127.0.0.1');
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

test('responsável solicita vínculo e somente Coordenação ou Direção analisa', async () => {
  const api = await startApi();
  const create = {
    method: 'POST',
    headers: { 'Idempotency-Key': 'link-request-001' },
    body: JSON.stringify({ studentEnrollment: '2024-0182', relationship: 'Responsável' }),
  };

  let result = await request(api.baseUrl, '/api/v1/guardian-link-requests', 'guardian-empty', create);
  assert.equal(result.response.status, 201);
  assert.equal(result.body.data.status, 'PENDING');
  assert.equal(result.body.data.student.name, 'Estudante informado');
  const created = result.body.data;

  result = await request(api.baseUrl, '/api/v1/guardian-link-requests', 'guardian-empty', create);
  assert.equal(result.response.status, 200);
  assert.equal(result.body.data.id, created.id);

  result = await request(api.baseUrl, '/api/v1/guardian-link-requests', 'staff-1');
  assert.equal(result.response.status, 403);
  result = await request(api.baseUrl, '/api/v1/guardian-link-requests', 'staff-2');
  assert.equal(result.body.data[0].student.name, 'Enzo Gabriel Soares');
  result = await request(api.baseUrl, `/api/v1/guardian-link-requests/${created.id}`, 'staff-1', {
    method: 'PATCH',
    body: JSON.stringify({ status: 'APPROVED', expectedVersion: 1 }),
  });
  assert.equal(result.response.status, 403);

  result = await request(api.baseUrl, `/api/v1/guardian-link-requests/${created.id}`, 'staff-2', {
    method: 'PATCH',
    body: JSON.stringify({ status: 'APPROVED', expectedVersion: 1, reviewNote: 'Documentação conferida.' }),
  });
  assert.equal(result.response.status, 200);
  assert.equal(result.body.data.status, 'APPROVED');
  assert.equal(result.body.data.version, 2);

  result = await request(api.baseUrl, '/api/v1/me/students', 'guardian-empty');
  assert.deepEqual(result.body.data.map((student: { id: string }) => student.id), ['std-12']);

  result = await request(api.baseUrl, '/api/v1/notifications', 'guardian-empty');
  assert.equal(result.body.data[0].title, 'Vínculo aprovado');

  const auditCount = api.database.prepare(`
    SELECT COUNT(*) AS count FROM audit_log
    WHERE aggregate_type = 'GUARDIAN_LINK_REQUEST' AND aggregate_id = ?
  `).get(created.id) as { count: number };
  assert.equal(auditCount.count, 2);

  await api.close();
});

test('solicitação não permite vínculo já aprovado nem revisão repetida', async () => {
  const api = await startApi();
  let result = await request(api.baseUrl, '/api/v1/guardian-link-requests', 'guardian-1', {
    method: 'POST',
    headers: { 'Idempotency-Key': 'existing-link' },
    body: JSON.stringify({ studentEnrollment: '2024-0891', relationship: 'Mãe' }),
  });
  assert.equal(result.response.status, 409);
  assert.equal(result.body.error.code, 'LINK_ALREADY_APPROVED');

  result = await request(api.baseUrl, '/api/v1/guardian-link-requests', 'guardian-empty', {
    method: 'POST',
    headers: { 'Idempotency-Key': 'reject-link' },
    body: JSON.stringify({ studentEnrollment: '2024-1311', relationship: 'Responsável' }),
  });
  const created = result.body.data;
  result = await request(api.baseUrl, `/api/v1/guardian-link-requests/${created.id}`, 'staff-3', {
    method: 'PATCH',
    body: JSON.stringify({ status: 'REJECTED', expectedVersion: 1 }),
  });
  assert.equal(result.response.status, 200);
  result = await request(api.baseUrl, `/api/v1/guardian-link-requests/${created.id}`, 'staff-2', {
    method: 'PATCH',
    body: JSON.stringify({ status: 'APPROVED', expectedVersion: 2 }),
  });
  assert.equal(result.response.status, 409);
  assert.equal(result.body.error.code, 'LINK_REQUEST_ALREADY_REVIEWED');

  await api.close();
});

test('Coordenação revoga vínculo imediatamente e a operação fica auditada', async () => {
  const api = await startApi();
  let result = await request(api.baseUrl, '/api/v1/guardian-links', 'staff-1');
  assert.equal(result.response.status, 403);

  result = await request(api.baseUrl, '/api/v1/guardian-links', 'staff-2');
  assert.equal(result.response.status, 200);
  const link = result.body.data.find((item: { guardian: { id: string }; student: { id: string } }) =>
    item.guardian.id === 'guardian-1' && item.student.id === 'std-1');
  assert.equal(link.status, 'APPROVED');

  result = await request(api.baseUrl, '/api/v1/guardian-links/guardian-1/std-1/revoke', 'staff-1', {
    method: 'PATCH',
    body: JSON.stringify({ expectedVersion: link.version, reason: 'Tentativa sem autorização.' }),
  });
  assert.equal(result.response.status, 403);

  result = await request(api.baseUrl, '/api/v1/guardian-links/guardian-1/std-1/revoke', 'staff-2', {
    method: 'PATCH',
    body: JSON.stringify({ expectedVersion: link.version, reason: 'Solicitação formal da família.' }),
  });
  assert.equal(result.response.status, 200);
  assert.equal(result.body.data.status, 'REVOKED');
  assert.equal(result.body.data.version, link.version + 1);

  result = await request(api.baseUrl, '/api/v1/me/students', 'guardian-1');
  assert.deepEqual(result.body.data.map((student: { id: string }) => student.id), ['std-13']);
  result = await request(api.baseUrl, '/api/v1/students/std-1/access-events', 'guardian-1');
  assert.equal(result.response.status, 404);

  result = await request(api.baseUrl, '/api/v1/notifications', 'guardian-1');
  assert.equal(result.body.data[0].title, 'Vínculo revogado');

  const audit = api.database.prepare(`
    SELECT action, actor_id FROM audit_log
    WHERE aggregate_type = 'GUARDIAN_STUDENT_LINK' AND aggregate_id = ?
  `).get('guardian-1:std-1') as { action: string; actor_id: string };
  assert.deepEqual(audit, { action: 'REVOKED', actor_id: 'staff-2' });

  result = await request(api.baseUrl, '/api/v1/guardian-links/guardian-1/std-1/revoke', 'staff-3', {
    method: 'PATCH',
    body: JSON.stringify({ expectedVersion: link.version, reason: 'Repetição indevida.' }),
  });
  assert.equal(result.response.status, 409);
  assert.equal(result.body.error.code, 'LINK_ALREADY_REVOKED');
  await api.close();
});

test('vínculo revogado pode passar por nova solicitação e revalidação', async () => {
  const api = await startApi();
  const link = (await request(api.baseUrl, '/api/v1/guardian-links', 'staff-2')).body.data
    .find((item: { guardian: { id: string }; student: { id: string } }) =>
      item.guardian.id === 'guardian-1' && item.student.id === 'std-1');
  await request(api.baseUrl, '/api/v1/guardian-links/guardian-1/std-1/revoke', 'staff-2', {
    method: 'PATCH',
    body: JSON.stringify({ expectedVersion: link.version, reason: 'Revalidação documental necessária.' }),
  });
  let result = await request(api.baseUrl, '/api/v1/guardian-link-requests', 'guardian-1', {
    method: 'POST',
    headers: { 'Idempotency-Key': 'revalidate-link' },
    body: JSON.stringify({ studentEnrollment: '2024-0891', relationship: 'Mãe' }),
  });
  assert.equal(result.response.status, 201);
  const pending = result.body.data;
  result = await request(api.baseUrl, `/api/v1/guardian-link-requests/${pending.id}`, 'staff-3', {
    method: 'PATCH',
    body: JSON.stringify({ status: 'APPROVED', expectedVersion: 1 }),
  });
  assert.equal(result.response.status, 200);
  result = await request(api.baseUrl, '/api/v1/guardian-links', 'staff-3');
  const restored = result.body.data.find((item: { guardian: { id: string }; student: { id: string } }) =>
    item.guardian.id === 'guardian-1' && item.student.id === 'std-1');
  assert.equal(restored.status, 'APPROVED');
  assert.equal(restored.version, link.version + 2);
  assert.equal(restored.revokedAt, undefined);
  await api.close();
});
