import assert from 'node:assert/strict';
import { AddressInfo } from 'node:net';
import test from 'node:test';
import { createApp } from '../app';
import { createDatabase } from '../db';
import { apiRequest as request } from './authTestUtils';

test('piloto bloqueia upload, download e referência a anexos e preserva justificativa textual', async () => {
  const database = createDatabase({ filename: ':memory:' });
  const server = createApp(database).listen(0, '127.0.0.1');
  await new Promise<void>(resolve => server.once('listening', resolve));
  const baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  try {
    for (const [pathname, method] of [['/api/v1/attachments', 'POST'], ['/api/v1/attachments/legacy-id', 'GET'], ['/api/v1/attachments/legacy-id', 'DELETE']]) {
      const result = await request(baseUrl, pathname, 'guardian-1', { method });
      assert.equal(result.response.status, 404);
    }
    const payload = { absenceStartDate: '2026-10-29', reasonCategory: 'FORCE_MAJEURE', description: 'Problema de transporte demonstrativo.' };
    for (const extra of [{ attachmentName: 'arquivo.pdf' }, { attachmentId: 'legacy-attachment-id' }]) {
      const result = await request(baseUrl, '/api/v1/students/std-1/justifications', 'guardian-1', {
        method: 'POST', headers: { 'Idempotency-Key': `unsupported-${Object.keys(extra)[0]}` }, body: JSON.stringify({ ...payload, ...extra }),
      });
      assert.equal(result.response.status, 422);
    }
    const created = await request(baseUrl, '/api/v1/students/std-1/justifications', 'guardian-1', {
      method: 'POST', headers: { 'Idempotency-Key': 'text-only-scope' }, body: JSON.stringify(payload),
    });
    assert.equal(created.response.status, 201);
    assert.equal(created.body.data.description, payload.description);
    const id = created.body.data.id;
    const review = await request(baseUrl, `/api/v1/justifications/${id}/status`, 'staff-2', {
      method: 'PATCH', body: JSON.stringify({ status: 'APPROVED', expectedVersion: 1 }),
    });
    assert.equal(review.response.status, 200);
  } finally {
    await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    database.close();
  }
});
