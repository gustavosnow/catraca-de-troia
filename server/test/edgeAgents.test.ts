import assert from 'node:assert/strict';
import type { ChildProcess } from 'node:child_process';
import { EventEmitter } from 'node:events';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { AddressInfo } from 'node:net';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { PassThrough } from 'node:stream';
import test from 'node:test';
import { createApp } from '../app';
import { createTestDatabase } from './fixtures/schoolFixtures';
import { AccessDeviceService, hashDeviceToken } from '../modules/accessDevices/service';
import { EdgeProcessManager } from '../modules/edgeAgents/processManager';
import { EdgeAgentService } from '../modules/edgeAgents/service';
import { apiRequest as request } from './authTestUtils';

/** Processo Python simulado: encerra quando a entrada padrão é fechada, como edge/supervision.py. */
class FakeChild extends EventEmitter {
  stdin = new PassThrough();
  stdout = new PassThrough();
  stderr = new PassThrough();
  killed = false;
  constructor(readonly command: string, readonly args: string[], readonly env: NodeJS.ProcessEnv) {
    super();
    this.stdin.on('finish', () => setImmediate(() => this.emit('exit', 0)));
  }
  kill() {
    this.killed = true;
    this.emit('exit', null);
    return true;
  }
}

const startApi = async (options: { enabled?: boolean; ready?: boolean } = {}) => {
  const edgeDir = mkdtempSync(path.join(tmpdir(), 'edge-agents-'));
  const pythonPath = path.join(edgeDir, 'python-fake');
  if (options.ready ?? true) {
    writeFileSync(pythonPath, '');
    mkdirSync(path.join(edgeDir, 'models'));
    writeFileSync(path.join(edgeDir, 'models', 'face_detection_yunet_2023mar.onnx'), '');
    writeFileSync(path.join(edgeDir, 'models', 'face_recognition_sface_2021dec.onnx'), '');
  }
  const database = createTestDatabase({ filename: ':memory:' });
  const devices = new AccessDeviceService(database);
  const register = (id: string, direction: 'ENTRY' | 'EXIT', cameraSource?: string) => devices.register({
    id, schoolId: 'school-1', name: `Câmera ${id}`, turnstileId: 'cat-01',
    turnstileName: 'Catraca 01 (Portão Principal)', direction, operatorUserId: 'staff-1',
    minScore: 0.4, cameraSource,
  });
  const entry = register('cat-01-entrada', 'ENTRY', 'http://192.168.0.5:4747/video');
  register('cat-01-saida', 'EXIT', 'http://192.168.0.8:4747/video');
  register('cat-02-sem-camera', 'ENTRY');

  const children: FakeChild[] = [];
  const pythonCalls: string[][] = [];
  const manager = new EdgeProcessManager((command, args, spawnOptions) => {
    const child = new FakeChild(command, args, spawnOptions.env);
    children.push(child);
    return child as unknown as ChildProcess;
  }, undefined, 50);
  const edgeAgents = new EdgeAgentService(database, devices, {
    enabled: options.enabled ?? true,
    edgeDir,
    pythonPath,
    apiUrl: 'http://127.0.0.1:3001',
    manager,
    runPython: async (args) => {
      pythonCalls.push(args);
      return args.includes('--list')
        ? JSON.stringify([{ studentId: 'std-1', label: 'Ana Clara de Souza Mendes', samples: 8 }])
        : '1 amostra(s) apagada(s).';
    },
  });
  const server = createApp(database, { edgeAgents }).listen(0, '127.0.0.1');
  await new Promise<void>((resolve) => server.once('listening', resolve));
  const baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  return {
    database,
    children,
    pythonCalls,
    entryToken: entry.token,
    call: (pathname: string, actorId: string, init: RequestInit = {}) => request(baseUrl, pathname, actorId, init),
    close: () => new Promise<void>((resolve, reject) => server.close((error) => {
      edgeAgents.shutdown();
      database.close();
      rmSync(edgeDir, { recursive: true, force: true });
      error ? reject(error) : resolve();
    })),
  };
};

const post = (body?: unknown): RequestInit => ({
  method: 'POST',
  ...(body === undefined ? {} : { body: JSON.stringify(body) }),
});
const waitFor = async (condition: () => boolean) => {
  for (let attempt = 0; attempt < 50 && !condition(); attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  assert.ok(condition(), 'condição não atingida a tempo');
};

test('inicia a catraca com token renovado entregue só ao processo e para pelo painel', async () => {
  const api = await startApi();
  try {
    const started = await api.call('/api/v1/edge-agents/recognition/cat-01-entrada/start', 'staff-1', post());
    assert.equal(started.response.status, 201);
    assert.equal(started.body.data.state, 'RUNNING');
    assert.equal(JSON.stringify(started.body).includes('dev_'), false, 'token não pode voltar na resposta');

    const [child] = api.children;
    assert.deepEqual(child.args, ['recognize.py']);
    assert.equal(child.env.EDGE_SUPERVISED, '1');
    assert.equal(child.env.CAMERA_SOURCE, 'http://192.168.0.5:4747/video');
    const stored = api.database.prepare('SELECT token_hash FROM access_devices WHERE id = ?')
      .get('cat-01-entrada') as { token_hash: string };
    assert.equal(stored.token_hash, hashDeviceToken(child.env.DEVICE_TOKEN!));
    assert.notEqual(child.env.DEVICE_TOKEN, api.entryToken, 'o token anterior deve ser invalidado');

    const again = await api.call('/api/v1/edge-agents/recognition/cat-01-entrada/start', 'staff-1', post());
    assert.equal(again.response.status, 409);
    assert.equal(again.body.error.code, 'AGENT_ALREADY_RUNNING');

    child.stdout.write('Catraca pronta: 1 pessoa(s) cadastrada(s), limiar 0.45.\n');
    const status = await api.call('/api/v1/edge-agents', 'staff-1');
    const camera = status.body.data.cameras.find((item: any) => item.device.id === 'cat-01-entrada');
    assert.equal(camera.recognition.state, 'RUNNING');
    assert.match(camera.recognition.log.at(-1), /Catraca pronta/);

    const stopped = await api.call('/api/v1/edge-agents/recognition/cat-01-entrada/stop', 'staff-1', post());
    assert.equal(stopped.body.data.state, 'STOPPING');
    await waitFor(() => (api.database.prepare(`
      SELECT COUNT(*) AS total FROM audit_log WHERE aggregate_id = 'cat-01-entrada' AND action = 'RECOGNITION_STOPPED'
    `).get() as { total: number }).total === 1);
    const after = await api.call('/api/v1/edge-agents', 'staff-1');
    assert.equal(after.body.data.cameras.find((item: any) => item.device.id === 'cat-01-entrada')
      .recognition.state, 'STOPPED');
  } finally {
    await api.close();
  }
});

test('entrada e saída rodam juntas, mas a mesma câmera não é usada duas vezes', async () => {
  const api = await startApi();
  try {
    assert.equal((await api.call('/api/v1/edge-agents/recognition/cat-01-entrada/start', 'staff-1', post())).response.status, 201);
    assert.equal((await api.call('/api/v1/edge-agents/recognition/cat-01-saida/start', 'staff-1', post())).response.status, 201);

    const enrollment = await api.call('/api/v1/face-enrollments', 'staff-2', post({
      studentId: 'std-1', deviceId: 'cat-01-entrada', consent: true,
    }));
    assert.equal(enrollment.response.status, 409);
    assert.equal(enrollment.body.error.code, 'CAMERA_IN_USE');

    const noCamera = await api.call('/api/v1/edge-agents/recognition/cat-02-sem-camera/start', 'staff-1', post());
    assert.equal(noCamera.response.status, 409);
    assert.equal(noCamera.body.error.code, 'CAMERA_NOT_CONFIGURED');
  } finally {
    await api.close();
  }
});

test('cadastro facial exige Coordenação/Direção, consentimento e estudante da escola', async () => {
  const api = await startApi();
  try {
    const body = { studentId: 'std-1', deviceId: 'cat-01-entrada', consent: true };
    assert.equal((await api.call('/api/v1/face-enrollments', 'staff-1', post(body))).response.status, 403);
    assert.equal((await api.call('/api/v1/face-enrollments', 'guardian-1', post(body))).response.status, 403);
    assert.equal((await api.call('/api/v1/face-enrollments', 'staff-2', post({ ...body, consent: false }))).response.status, 422);
    assert.equal((await api.call('/api/v1/face-enrollments', 'staff-2', post({ ...body, studentId: 'std-999' }))).response.status, 404);
    assert.equal(api.children.length, 0);

    const started = await api.call('/api/v1/face-enrollments', 'staff-2', post(body));
    assert.equal(started.response.status, 201);
    const [child] = api.children;
    assert.deepEqual(child.args, [
      'enroll.py', '--student=std-1', '--label=Ana Clara de Souza Mendes', '--samples=8', '--consenti',
    ]);
    assert.equal(child.env.DEVICE_TOKEN === undefined || !child.env.DEVICE_TOKEN.startsWith('dev_'), true);

    const second = await api.call('/api/v1/face-enrollments', 'staff-3', post({ ...body, studentId: 'std-2' }));
    assert.equal(second.body.error.code, 'ENROLLMENT_RUNNING');

    child.emit('exit', 0);
    const status = await api.call('/api/v1/edge-agents', 'staff-2');
    assert.equal(status.body.data.enrollment.state, 'COMPLETED');
    const actions = api.database.prepare(`
      SELECT action FROM audit_log WHERE aggregate_type = 'FACE_ENROLLMENT' ORDER BY rowid
    `).all() as Array<{ action: string }>;
    assert.deepEqual(actions.map((row) => row.action), ['STARTED', 'COMPLETED']);
  } finally {
    await api.close();
  }
});

test('lista e remove cadastros faciais com auditoria', async () => {
  const api = await startApi();
  try {
    assert.equal((await api.call('/api/v1/face-enrollments', 'staff-1')).response.status, 403);
    const list = await api.call('/api/v1/face-enrollments', 'staff-3');
    assert.deepEqual(list.body.data, [{
      studentId: 'std-1', studentName: 'Ana Clara de Souza Mendes', label: 'Ana Clara de Souza Mendes', samples: 8,
    }]);

    const removed = await api.call('/api/v1/face-enrollments/std-1', 'staff-3', { method: 'DELETE' });
    assert.equal(removed.response.status, 200);
    assert.deepEqual(api.pythonCalls.at(-1), ['enroll.py', '--remove=std-1']);
    const audit = api.database.prepare(`
      SELECT COUNT(*) AS total FROM audit_log WHERE aggregate_type = 'FACE_ENROLLMENT' AND action = 'REMOVED'
    `).get() as { total: number };
    assert.equal(audit.total, 1);
  } finally {
    await api.close();
  }
});

test('configura a câmera sem aceitar credenciais na URL', async () => {
  const api = await startApi();
  try {
    const patch = (cameraSource: string, actor = 'staff-2') => api.call(
      '/api/v1/access-devices/cat-02-sem-camera/camera', actor,
      { method: 'PATCH', body: JSON.stringify({ cameraSource }) },
    );
    assert.equal((await patch('1', 'staff-1')).response.status, 403);
    assert.equal((await patch('http://admin:senha@192.168.0.9:4747/video')).response.status, 422);
    assert.equal((await patch('file:///etc/passwd')).response.status, 422);
    const ok = await patch('http://192.168.0.9:4747/video');
    assert.equal(ok.response.status, 200);
    assert.equal(ok.body.data.cameraSource, 'http://192.168.0.9:4747/video');
    assert.equal((await patch(' 01 ')).body.data.cameraSource, '1');
  } finally {
    await api.close();
  }
});

test('fica desligado sem opt-in e informa ambiente incompleto', async () => {
  const disabled = await startApi({ enabled: false });
  try {
    const result = await disabled.call('/api/v1/edge-agents/recognition/cat-01-entrada/start', 'staff-1', post());
    assert.equal(result.response.status, 503);
    assert.equal(result.body.error.code, 'EDGE_CONTROL_DISABLED');
    assert.equal((await disabled.call('/api/v1/edge-agents', 'staff-1')).body.data.enabled, false);
    assert.equal((await disabled.call('/api/v1/edge-agents', 'guardian-1')).response.status, 403);
  } finally {
    await disabled.close();
  }

  const notReady = await startApi({ ready: false });
  try {
    const result = await notReady.call('/api/v1/edge-agents/recognition/cat-01-entrada/start', 'staff-1', post());
    assert.equal(result.response.status, 503);
    assert.equal(result.body.error.code, 'EDGE_NOT_READY');
    assert.equal(notReady.children.length, 0);
  } finally {
    await notReady.close();
  }
});
