import assert from 'node:assert/strict';
import { AddressInfo } from 'node:net';
import test from 'node:test';
import { createApp } from '../app';
import { createDatabase } from '../db';
import { apiRequest as request } from './authTestUtils';

test('fila demonstrativa persiste falha, reenfileira e conclui a entrega simulada', async () => {
  const database = createDatabase({ filename: ':memory:' });
  const server = createApp(database, { now: () => '2026-10-15T16:00:00.000Z' }).listen(0, '127.0.0.1');
  await new Promise<void>((resolve) => server.once('listening', resolve));
  const baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;

  const notice = {
    title: 'Comunicado para testar a fila externa',
    category: 'GENERAL',
    priority: 'INFO',
    authorLabel: 'Coordenação Pedagógica',
    roleLabel: 'Coordenação',
    summary: 'Mensagem acadêmica para validar estados e retentativas.',
    content: 'Conteúdo demonstrativo suficiente para criar notificações e itens na fila persistente.',
    notifyGuardians: true,
  };
  let result = await request(baseUrl, '/api/v1/notices', 'staff-2', {
    method: 'POST', body: JSON.stringify(notice),
  });
  assert.equal(result.response.status, 201);

  result = await request(baseUrl, '/api/v1/notification-deliveries', 'staff-1');
  assert.equal(result.response.status, 403);
  result = await request(baseUrl, '/api/v1/notification-deliveries', 'staff-2');
  assert.equal(result.response.status, 200);
  assert.equal(result.body.data.counts.PENDING, 6);
  assert.equal(result.body.data.channelConfigured, false);

  result = await request(baseUrl, '/api/v1/notification-deliveries/process', 'staff-2', {
    method: 'POST', body: JSON.stringify({ outcome: 'FAIL_RETRY' }),
  });
  assert.equal(result.body.data.processed, 6);
  result = await request(baseUrl, '/api/v1/notification-deliveries', 'staff-2');
  assert.equal(result.body.data.counts.FAILED, 6);
  assert.equal(result.body.data.records[0].attemptCount, 1);

  result = await request(baseUrl, '/api/v1/notification-deliveries/retry', 'staff-2', { method: 'POST' });
  assert.equal(result.body.data.updated, 6);
  result = await request(baseUrl, '/api/v1/notification-deliveries/process', 'staff-2', {
    method: 'POST', body: JSON.stringify({ outcome: 'DELIVER' }),
  });
  assert.equal(result.body.data.processed, 6);
  result = await request(baseUrl, '/api/v1/notification-deliveries', 'staff-2');
  assert.equal(result.body.data.counts.DELIVERED, 6);
  assert.equal(result.body.data.records[0].attemptCount, 2);

  await new Promise<void>((resolve, reject) => server.close((error) => {
    database.close();
    error ? reject(error) : resolve();
  }));
});
