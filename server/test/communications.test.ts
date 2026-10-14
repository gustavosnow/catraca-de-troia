import assert from 'node:assert/strict';
import { AddressInfo } from 'node:net';
import test from 'node:test';
import { createApp } from '../app';
import { createDatabase } from '../db';
import { apiRequest as request } from './authTestUtils';

const startApi = async () => {
  const database = createDatabase({ filename: ':memory:' });
  const server = createApp(database, { now: () => '2026-10-14T18:00:00.000Z' })
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

const notice = {
  title: 'Reunião extraordinária de responsáveis',
  category: 'PEDAGOGICAL',
  priority: 'IMPORTANT',
  authorLabel: 'Coordenação Pedagógica',
  roleLabel: 'Coordenação',
  summary: 'Encontro acadêmico demonstrativo com os responsáveis.',
  content: 'Comunicado demonstrativo completo para validar persistência e leitura no portal.',
  notifyGuardians: true,
};

test('comunicados persistem, respeitam papéis e registram leitura por responsável', async () => {
  const api = await startApi();

  let result = await request(api.baseUrl, '/api/v1/notices', 'staff-1', {
    method: 'POST', body: JSON.stringify(notice),
  });
  assert.equal(result.response.status, 403);

  result = await request(api.baseUrl, '/api/v1/notices', 'staff-2', {
    method: 'POST', body: JSON.stringify(notice),
  });
  assert.equal(result.response.status, 201);
  const created = result.body.data;
  assert.equal(created.version, 1);

  result = await request(api.baseUrl, '/api/v1/notices', 'guardian-1');
  assert.equal(result.response.status, 200);
  assert.equal(result.body.data[0].id, created.id);
  assert.equal(result.body.data[0].isUnread, true);

  result = await request(api.baseUrl, `/api/v1/notices/${created.id}/read`, 'guardian-1', {
    method: 'POST',
  });
  assert.equal(result.response.status, 204);

  result = await request(api.baseUrl, '/api/v1/notices', 'guardian-1');
  assert.equal(result.body.data[0].isUnread, false);
  result = await request(api.baseUrl, '/api/v1/notices', 'guardian-2');
  assert.equal(result.body.data[0].isUnread, true);

  result = await request(api.baseUrl, '/api/v1/notifications', 'guardian-1');
  assert.equal(result.response.status, 200);
  assert.equal(result.body.data[0].type, 'NOTICE');
  assert.equal(result.body.data[0].readAt, undefined);

  result = await request(api.baseUrl, '/api/v1/notifications/read-all', 'guardian-1', {
    method: 'POST',
  });
  assert.equal(result.body.data.updated, 1);
  result = await request(api.baseUrl, '/api/v1/notifications', 'guardian-1');
  assert.equal(result.body.data[0].readAt, '2026-10-14T18:00:00.000Z');

  await api.close();
});

test('edição usa versão otimista e reenvio de notificação é idempotente', async () => {
  const api = await startApi();
  let result = await request(api.baseUrl, '/api/v1/notices', 'staff-2', {
    method: 'POST', body: JSON.stringify({ ...notice, notifyGuardians: false }),
  });
  const created = result.body.data;
  const update = {
    ...notice,
    notifyGuardians: undefined,
    title: 'Reunião extraordinária atualizada',
    expectedVersion: 1,
  };

  result = await request(api.baseUrl, `/api/v1/notices/${created.id}`, 'staff-2', {
    method: 'PUT', body: JSON.stringify(update),
  });
  assert.equal(result.response.status, 200);
  assert.equal(result.body.data.version, 2);

  result = await request(api.baseUrl, `/api/v1/notices/${created.id}`, 'staff-2', {
    method: 'PUT', body: JSON.stringify(update),
  });
  assert.equal(result.response.status, 409);
  assert.equal(result.body.error.code, 'VERSION_CONFLICT');

  const broadcast = {
    method: 'POST',
    headers: { 'Idempotency-Key': 'broadcast-001' },
  };
  result = await request(api.baseUrl, `/api/v1/notices/${created.id}/broadcast`, 'staff-2', broadcast);
  assert.equal(result.response.status, 200);
  assert.equal(result.body.data.recipients, 6);
  result = await request(api.baseUrl, `/api/v1/notices/${created.id}/broadcast`, 'staff-2', broadcast);
  assert.equal(result.body.data.recipients, 0);

  const count = api.database.prepare(`
    SELECT COUNT(*) AS count FROM in_app_notifications
    WHERE source_type = 'NOTICE_BROADCAST'
  `).get() as { count: number };
  assert.equal(count.count, 6);

  await api.close();
});

test('evento de acesso cria notificação somente para responsáveis vinculados', async () => {
  const api = await startApi();
  const event = {
    direction: 'ENTRY',
    turnstileId: 'cat-01',
    turnstileName: 'Catraca 01 (Portão Principal)',
    status: 'AUTHORIZED',
    method: 'FACIAL',
    whatsappStatus: 'PENDING',
    pushStatus: 'PENDING',
  };
  let result = await request(api.baseUrl, '/api/v1/students/std-1/access-events', 'staff-1', {
    method: 'POST', headers: { 'Idempotency-Key': 'notify-event-001' }, body: JSON.stringify(event),
  });
  assert.equal(result.response.status, 201);

  result = await request(api.baseUrl, '/api/v1/notifications', 'guardian-1');
  assert.equal(result.body.data.length, 1);
  assert.equal(result.body.data[0].studentName, 'Ana Clara de Souza Mendes');
  result = await request(api.baseUrl, '/api/v1/notifications', 'guardian-2');
  assert.equal(result.body.data.length, 0);

  await api.close();
});

