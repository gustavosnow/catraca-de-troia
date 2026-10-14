import assert from 'node:assert/strict';
import { AddressInfo } from 'node:net';
import test from 'node:test';
import { createApp } from '../app';
import { createDatabase } from '../db';
import { apiRequest as request, loginAs } from './authTestUtils';
import { cleanupOrphanAttachments } from '../modules/attachments/service';

const startApi = async () => {
  const database = createDatabase({ filename: ':memory:' });
  const server = createApp(database, { now: () => '2026-10-14T20:00:00.000Z' })
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

const uploadPdf = async (baseUrl: string, actorId: string, content = '%PDF-1.4\nconteudo demonstrativo') => {
  const token = await loginAs(baseUrl, actorId);
  const response = await fetch(`${baseUrl}/api/v1/attachments`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/pdf',
      'X-File-Name': encodeURIComponent('atestado demonstrativo.pdf'),
    },
    body: content,
  });
  const body = await response.json() as Record<string, any>;
  return { response, body };
};

test('anexo real é validado, vinculado à justificativa e baixado somente por perfis autorizados', async () => {
  const api = await startApi();
  const upload = await uploadPdf(api.baseUrl, 'guardian-1');
  assert.equal(upload.response.status, 201);
  assert.equal(upload.body.data.validationStatus, 'BASIC_VALIDATION_ONLY');
  const attachmentId = upload.body.data.id;

  let result = await request(api.baseUrl, '/api/v1/students/std-1/justifications', 'guardian-1', {
    method: 'POST',
    headers: { 'Idempotency-Key': 'justification-with-file' },
    body: JSON.stringify({
      absenceStartDate: '2026-10-14',
      reasonCategory: 'MEDICAL',
      description: 'Consulta médica demonstrativa com comprovante local.',
      attachmentId,
    }),
  });
  assert.equal(result.response.status, 201);
  assert.equal(result.body.data.attachmentId, attachmentId);
  assert.equal(result.body.data.attachmentName, 'atestado demonstrativo.pdf');

  let token = await loginAs(api.baseUrl, 'guardian-2');
  let download = await fetch(`${api.baseUrl}/api/v1/attachments/${attachmentId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  assert.equal(download.status, 404);

  token = await loginAs(api.baseUrl, 'staff-1');
  download = await fetch(`${api.baseUrl}/api/v1/attachments/${attachmentId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  assert.equal(download.status, 403);

  token = await loginAs(api.baseUrl, 'staff-2');
  download = await fetch(`${api.baseUrl}/api/v1/attachments/${attachmentId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  assert.equal(download.status, 200);
  assert.match(await download.text(), /^%PDF-1\.4/);

  await api.close();
});

test('upload rejeita assinatura incompatível e anexo não pode ser reutilizado', async () => {
  const api = await startApi();
  let upload = await uploadPdf(api.baseUrl, 'guardian-1', 'isto não é um PDF');
  assert.equal(upload.response.status, 422);

  upload = await uploadPdf(api.baseUrl, 'guardian-1');
  const attachmentId = upload.body.data.id;
  const payload = {
    absenceStartDate: '2026-10-15',
    reasonCategory: 'MEDICAL',
    description: 'Primeira justificativa demonstrativa com o anexo.',
    attachmentId,
  };
  let result = await request(api.baseUrl, '/api/v1/students/std-1/justifications', 'guardian-1', {
    method: 'POST', headers: { 'Idempotency-Key': 'file-use-1' }, body: JSON.stringify(payload),
  });
  assert.equal(result.response.status, 201);
  result = await request(api.baseUrl, '/api/v1/students/std-1/justifications', 'guardian-1', {
    method: 'POST', headers: { 'Idempotency-Key': 'file-use-2' }, body: JSON.stringify(payload),
  });
  assert.equal(result.response.status, 404);

  const staged = await uploadPdf(api.baseUrl, 'guardian-1');
  assert.equal(cleanupOrphanAttachments(
    api.database,
    '2026-10-14T20:30:00.000Z',
    '2026-10-14T21:00:00.000Z',
  ), 1);
  result = await request(api.baseUrl, `/api/v1/attachments/${staged.body.data.id}`, 'guardian-1');
  assert.equal(result.response.status, 404);
  assert.equal((api.database.prepare(`
    SELECT COUNT(*) AS count FROM audit_log
    WHERE aggregate_type = 'ATTACHMENT' AND action = 'ORPHAN_CLEANUP'
  `).get() as { count: number }).count, 1);

  await api.close();
});
