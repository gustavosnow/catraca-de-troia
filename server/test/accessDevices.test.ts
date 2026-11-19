import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { AddressInfo } from 'node:net';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { createApp } from '../app';
import { ensureDemoTurnstiles } from '../maintenance/demoTurnstiles';
import { SCHOOL, STAFF } from '../maintenance/schoolData';
import { createTestDatabase } from './fixtures/schoolFixtures';
import { AccessDeviceService } from '../modules/accessDevices/service';
import { apiRequest as request } from './authTestUtils';

test('carga de catracas completa uma base antiga sem sobrescrever câmeras existentes', (t) => {
  const database = createTestDatabase();
  t.after(() => database.close());
  const operator = STAFF.find((member) => member.role === 'STAFF_GATE')!;
  database.prepare('INSERT INTO schools (id, name) VALUES (?, ?)').run(SCHOOL.id, SCHOOL.name);
  database.prepare("INSERT INTO users (id, school_id, name, role) VALUES (?, ?, ?, 'STAFF_GATE')")
    .run(operator.id, SCHOOL.id, operator.name);

  const devices = new AccessDeviceService(database);
  const entry = devices.register({
    id: 'cat-01-entrada',
    schoolId: SCHOOL.id,
    name: 'Câmera existente',
    turnstileId: 'cat-01',
    turnstileName: 'Catraca 01 (Cadastro existente)',
    direction: 'ENTRY',
    operatorUserId: operator.id,
    minScore: 0.64,
    cameraSource: '1',
  });

  assert.deepEqual(ensureDemoTurnstiles(database), ['cat-02-saida']);
  assert.deepEqual(ensureDemoTurnstiles(database), []);
  assert.equal(devices.authenticate(entry.token).camera_source, '1');

  const actor = { id: operator.id, schoolId: SCHOOL.id, name: operator.name, role: operator.role };
  const configured = devices.listDevices(actor);
  assert.deepEqual(configured.find((device) => device.id === entry.device.id), entry.device);
  assert.deepEqual(configured.filter((device) => device.turnstile.id === 'cat-02').map((device) => device.direction), ['EXIT']);
});

const startApi = async () => {
  let current = Date.parse('2026-11-17T10:00:00.000Z');
  const clock = {
    now: () => new Date(current).toISOString(),
    advanceSeconds: (seconds: number) => { current += seconds * 1000; },
  };
  const database = createTestDatabase({ filename: ':memory:' });
  const devices = new AccessDeviceService(database, clock.now);
  const entry = devices.register({
    id: 'cat-01-entrada',
    schoolId: 'school-1',
    name: 'Câmera de teste',
    turnstileId: 'cat-01',
    turnstileName: 'Catraca 01 (Portão Principal)',
    direction: 'ENTRY',
    operatorUserId: 'staff-1',
    minScore: 0.4,
  });
  const server = createApp(database, { now: clock.now }).listen(0, '127.0.0.1');
  await new Promise<void>((resolve) => server.once('listening', resolve));
  const address = server.address() as AddressInfo;
  const baseUrl = `http://127.0.0.1:${address.port}`;
  return {
    database,
    baseUrl,
    clock,
    token: entry.token,
    recognize: async (body: Record<string, unknown>, token: string | null = entry.token) => {
      const response = await fetch(`${baseUrl}/api/v1/device/recognitions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'X-Device-Token': token } : {}),
        },
        body: JSON.stringify(body),
      });
      return { response, body: await response.json() as Record<string, any> };
    },
    close: () => new Promise<void>((resolve, reject) => server.close((error) => {
      database.close();
      error ? reject(error) : resolve();
    })),
  };
};

const match = (captureId: string, overrides: Record<string, unknown> = {}) => ({
  captureId,
  result: 'MATCH',
  studentId: 'std-1',
  matchScore: 0.62,
  inferenceMs: 48.5,
  framesConfirmed: 3,
  ...overrides,
});

test('catraca precisa de token válido e ativo', async (t) => {
  const api = await startApi();
  t.after(api.close);
  let result = await api.recognize(match('capture-0001'), null);
  assert.equal(result.response.status, 401);

  result = await api.recognize(match('capture-0001'), 'dev_token-invalido');
  assert.equal(result.response.status, 401);

  result = await api.recognize({ ...match('curto'), captureId: 'x' });
  assert.equal(result.response.status, 422);

  api.database.prepare('UPDATE access_devices SET active = 0').run();
  result = await api.recognize(match('capture-0002'));
  assert.equal(result.response.status, 401);
});

test('reconhecimento acima do limiar registra entrada facial e notifica responsável', async (t) => {
  const api = await startApi();
  t.after(api.close);
  let result = await api.recognize(match('capture-0001'));
  assert.equal(result.response.status, 201);
  assert.equal(result.body.data.decision, 'AUTHORIZED');
  assert.equal(result.body.data.duplicate, false);
  const event = result.body.data.event;
  assert.equal(event.source, 'FACE_PROTOTYPE');
  assert.equal(event.method, 'FACIAL');
  assert.equal(event.direction, 'ENTRY');
  assert.equal(event.createdById, 'staff-1');
  assert.deepEqual(event.recognition, { deviceId: 'cat-01-entrada', matchScore: 0.62, inferenceMs: 48.5 });
  assert.equal(event.notification.whatsapp, 'PENDING');

  // Reenvio da mesma leitura devolve o mesmo evento.
  result = await api.recognize(match('capture-0001'));
  assert.equal(result.response.status, 200);
  assert.equal(result.body.data.duplicate, true);
  assert.equal(result.body.data.event.id, event.id);

  // Nova leitura do mesmo estudante dentro do intervalo é tratada como repetição.
  api.clock.advanceSeconds(5);
  result = await api.recognize(match('capture-0002'));
  assert.equal(result.body.data.duplicate, true);
  assert.equal(result.body.data.event.id, event.id);

  // Após o intervalo, a mesma câmera de entrada não grava outra entrada: falta a saída.
  api.clock.advanceSeconds(20);
  const eventsBefore = (api.database.prepare('SELECT COUNT(*) AS total FROM access_events').get() as { total: number }).total;
  result = await api.recognize(match('capture-0003'));
  assert.equal(result.response.status, 200);
  assert.equal(result.body.data.decision, 'SEQUENCE_BLOCKED');
  assert.equal(result.body.data.expectedDirection, 'EXIT');
  assert.equal(result.body.data.lastEvent.id, event.id);
  const eventsAfter = (api.database.prepare('SELECT COUNT(*) AS total FROM access_events').get() as { total: number }).total;
  assert.equal(eventsAfter, eventsBefore);
  const blockedDenials = (api.database.prepare('SELECT COUNT(*) AS total FROM access_denials').get() as { total: number }).total;
  assert.equal(blockedDenials, 0, 'bloqueio de sequência não vira leitura negada');

  const history = await request(api.baseUrl, '/api/v1/students/std-1/access-events', 'guardian-1');
  assert.equal(history.response.status, 200);
  assert.ok(history.body.data.some((item: { id: string }) => item.id === event.id));

  const notifications = api.database.prepare(`
    SELECT COUNT(*) AS total FROM in_app_notifications WHERE source_type = 'ACCESS_EVENT' AND source_id = ?
  `).get(event.id) as { total: number };
  assert.ok(notifications.total >= 1);

  const queued = api.database.prepare('SELECT state FROM access_event_sync_queue WHERE event_id = ?')
    .get(event.id) as { state: string };
  assert.equal(queued.state, 'PENDING');
});

test('negações ficam registradas sem estudante e sem notificar', async (t) => {
  const api = await startApi();
  t.after(api.close);
  const before = api.database.prepare('SELECT COUNT(*) AS total FROM access_events').get() as { total: number };

  let result = await api.recognize(match('capture-low', { matchScore: 0.31 }));
  assert.equal(result.response.status, 200);
  assert.equal(result.body.data.decision, 'DENIED');
  assert.equal(result.body.data.reason, 'LOW_SCORE');

  result = await api.recognize({
    captureId: 'capture-unknown', result: 'NO_MATCH', matchScore: 0.12, inferenceMs: 40, framesConfirmed: 3,
  });
  assert.equal(result.body.data.reason, 'UNKNOWN_FACE');

  result = await api.recognize(match('capture-ghost', { studentId: 'std-inexistente' }));
  assert.equal(result.body.data.reason, 'STUDENT_NOT_REGISTERED');

  // Reenvio da mesma leitura negada devolve a mesma decisão.
  const again = await api.recognize(match('capture-low', { matchScore: 0.31 }));
  assert.equal(again.body.data.reason, 'LOW_SCORE');

  const after = api.database.prepare('SELECT COUNT(*) AS total FROM access_events').get() as { total: number };
  assert.equal(after.total, before.total);

  let denials = await request(api.baseUrl, '/api/v1/access-denials', 'staff-1');
  assert.equal(denials.response.status, 200);
  assert.equal(denials.body.data.length, 3);
  assert.ok(denials.body.data.every((item: { studentId?: string }) => item.studentId === undefined));

  denials = await request(api.baseUrl, '/api/v1/access-denials', 'guardian-1');
  assert.equal(denials.response.status, 403);

  const devices = await request(api.baseUrl, '/api/v1/access-devices', 'staff-2');
  assert.equal(devices.response.status, 200);
  assert.equal(devices.body.data[0].id, 'cat-01-entrada');
  assert.equal(devices.body.data[0].tokenHash, undefined);
});

test('migração preserva eventos de bases com CHECK antigo de origem', () => {
  const directory = mkdtempSync(path.join(tmpdir(), 'catraca-mc035-'));
  const filename = path.join(directory, 'legacy.sqlite');
  try {
    let database = createTestDatabase({ filename });
    database.pragma('foreign_keys = OFF');
    database.exec(`
      DROP TABLE access_events;
      CREATE TABLE access_events (
        id TEXT PRIMARY KEY,
        school_id TEXT NOT NULL REFERENCES schools(id),
        student_id TEXT NOT NULL REFERENCES students(id),
        direction TEXT NOT NULL CHECK (direction IN ('ENTRY', 'EXIT')),
        occurred_at TEXT NOT NULL,
        turnstile_id TEXT NOT NULL,
        turnstile_name TEXT NOT NULL,
        status TEXT NOT NULL CHECK (status IN ('AUTHORIZED', 'MANUAL_RELEASE')),
        method TEXT NOT NULL CHECK (method IN ('FACIAL', 'MANUAL')),
        created_by TEXT NOT NULL REFERENCES users(id),
        source TEXT NOT NULL CHECK (source IN ('DEMO_SIMULATION')),
        whatsapp_status TEXT NOT NULL CHECK (whatsapp_status IN ('DELIVERED', 'PENDING')),
        push_status TEXT NOT NULL CHECK (push_status IN ('DELIVERED', 'PENDING')),
        reason TEXT,
        idempotency_key TEXT NOT NULL,
        request_hash TEXT NOT NULL,
        UNIQUE (created_by, idempotency_key)
      );
      INSERT INTO access_events VALUES (
        'legacy-1', 'school-1', 'std-1', 'ENTRY', '2026-10-01T10:00:00.000Z', 'cat-01',
        'Catraca 01', 'AUTHORIZED', 'FACIAL', 'staff-1', 'DEMO_SIMULATION',
        'DELIVERED', 'DELIVERED', NULL, 'legacy-key', 'legacy-hash'
      );
    `);
    database.close();

    database = createTestDatabase({ filename });
    const table = database.prepare(`
      SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'access_events'
    `).get() as { sql: string };
    assert.match(table.sql, /FACE_PROTOTYPE/);
    const legacy = database.prepare('SELECT source, origin_event_id FROM access_events WHERE id = ?')
      .get('legacy-1') as { source: string; origin_event_id: string };
    assert.equal(legacy.source, 'DEMO_SIMULATION');
    assert.equal(legacy.origin_event_id, 'legacy-1');
    assert.equal(database.pragma('foreign_keys', { simple: true }), 1);
    database.close();
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test('câmera intercala entrada e saída do mesmo estudante no dia', async (t) => {
  const api = await startApi();
  t.after(api.close);
  const exit = new AccessDeviceService(api.database, api.clock.now).register({
    id: 'cat-01-saida',
    schoolId: 'school-1',
    name: 'Câmera de saída de teste',
    turnstileId: 'cat-01',
    turnstileName: 'Catraca 01 (Portão Principal)',
    direction: 'EXIT',
    operatorUserId: 'staff-1',
    minScore: 0.4,
  });
  const decision = async (captureId: string, token: string) => (await api.recognize(match(captureId), token)).body.data;

  // Sem entrada no dia, a saída é bloqueada.
  let result = await decision('seq-capture-01', exit.token);
  assert.equal(result.decision, 'SEQUENCE_BLOCKED');
  assert.equal(result.expectedDirection, 'ENTRY');

  result = await decision('seq-capture-02', api.token);
  assert.equal(result.decision, 'AUTHORIZED');
  assert.equal(result.event.direction, 'ENTRY');

  api.clock.advanceSeconds(60);
  result = await decision('seq-capture-03', api.token);
  assert.equal(result.decision, 'SEQUENCE_BLOCKED');

  result = await decision('seq-capture-04', exit.token);
  assert.equal(result.decision, 'AUTHORIZED');
  assert.equal(result.event.direction, 'EXIT');

  api.clock.advanceSeconds(60);
  result = await decision('seq-capture-05', exit.token);
  assert.equal(result.decision, 'SEQUENCE_BLOCKED');
  assert.equal(result.expectedDirection, 'ENTRY');

  // Depois da saída, uma nova entrada volta a ser aceita.
  result = await decision('seq-capture-06', api.token);
  assert.equal(result.decision, 'AUTHORIZED');
  assert.equal(result.event.direction, 'ENTRY');

  const directions = (api.database.prepare(`
    SELECT direction FROM access_events WHERE student_id = 'std-1' ORDER BY occurred_at
  `).all() as Array<{ direction: string }>).map((row) => row.direction);
  assert.deepEqual(directions, ['ENTRY', 'EXIT', 'ENTRY']);
});
