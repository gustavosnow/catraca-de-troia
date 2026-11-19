import assert from 'node:assert/strict';
import { AddressInfo } from 'node:net';
import test from 'node:test';
import { createApp } from '../app';
import { createTestDatabase } from './fixtures/schoolFixtures';
import { loginAs } from './authTestUtils';

const startApi = async () => {
  const database = createTestDatabase();
  const server = createApp(database).listen(0, '127.0.0.1');
  await new Promise<void>((resolve) => server.once('listening', resolve));
  const baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  return {
    database,
    baseUrl,
    close: () => new Promise<void>((resolve) => server.close(() => { database.close(); resolve(); })),
  };
};

/** Perfis: sem sessão, responsável com vínculo, responsável sem vínculo, Portaria, Coordenação, Direção. */
const ACTORS = ['anon', 'guardian-1', 'guardian-empty', 'staff-1', 'staff-2', 'staff-3'] as const;

/** Status esperado de cada rota de leitura por perfil (503 = permitido, comando das câmeras desligado). */
const READ_MATRIX: Record<string, number[]> = {
  '/students': [401, 403, 403, 200, 200, 200],
  '/me/students': [401, 200, 200, 200, 200, 200],
  '/access-events': [401, 403, 403, 200, 200, 200],
  '/access-events/sync/status': [401, 403, 403, 200, 200, 200],
  '/students/std-1/access-events': [401, 200, 404, 200, 200, 200],
  '/students/std-2/access-events': [401, 404, 404, 200, 200, 200],
  '/students/std-1/justifications': [401, 200, 404, 200, 200, 200],
  '/justifications': [401, 403, 403, 200, 200, 200],
  '/notices': [401, 200, 200, 200, 200, 200],
  '/notifications': [401, 200, 200, 403, 403, 403],
  '/guardian-link-requests': [401, 200, 200, 403, 200, 200],
  '/guardian-links': [401, 403, 403, 403, 200, 200],
  '/accounts': [401, 403, 403, 403, 200, 200],
  '/audit-log': [401, 403, 403, 403, 200, 200],
  '/notification-deliveries': [401, 403, 403, 403, 200, 200],
  '/access-devices': [401, 403, 403, 200, 200, 200],
  '/access-denials': [401, 403, 403, 200, 200, 200],
  '/edge-agents': [401, 403, 403, 200, 200, 200],
  '/face-enrollments': [401, 403, 403, 403, 503, 503],
  '/auth/session': [401, 200, 200, 200, 200, 200],
};

test('cada rota de leitura responde conforme o perfil da sessão', async (t) => {
  const api = await startApi();
  t.after(api.close);
  const tokens = new Map<string, string>();
  for (const actor of ACTORS.slice(1)) tokens.set(actor, await loginAs(api.baseUrl, actor));

  const mismatches: string[] = [];
  for (const [pathname, expected] of Object.entries(READ_MATRIX)) {
    for (const [index, actor] of ACTORS.entries()) {
      const token = tokens.get(actor);
      const response = await fetch(`${api.baseUrl}/api/v1${pathname}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (response.status !== expected[index]) {
        mismatches.push(`${pathname} como ${actor}: ${response.status}, esperado ${expected[index]}`);
      }
    }
  }
  assert.deepEqual(mismatches, []);
});

test('ações de escrita restritas recusam perfis sem permissão', async (t) => {
  const api = await startApi();
  t.after(api.close);
  const call = async (actor: string, method: string, pathname: string, body?: unknown) => {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${await loginAs(api.baseUrl, actor)}`,
      'Content-Type': 'application/json',
      'Idempotency-Key': `rbac-${actor}-${pathname}-${method}`,
    };
    return (await fetch(`${api.baseUrl}/api/v1${pathname}`, {
      method, headers, body: body ? JSON.stringify(body) : undefined,
    })).status;
  };
  // Responsável não registra passagem nem publica comunicado.
  const assisted = {
    direction: 'ENTRY', turnstileId: 'cat-01', turnstileName: 'Catraca 01', status: 'MANUAL_RELEASE',
    method: 'MANUAL', whatsappStatus: 'PENDING', pushStatus: 'PENDING', reason: 'Teste de permissão do perfil.',
  };
  const notice = {
    title: 'Aviso de teste', category: 'GENERAL', priority: 'INFO', authorLabel: 'Teste', roleLabel: 'Teste',
    summary: 'Resumo do aviso de teste.', content: 'Conteúdo do aviso de teste de permissão.', notifyGuardians: false,
  };
  assert.equal(await call('guardian-1', 'POST', '/students/std-1/access-events', assisted), 403);
  assert.equal(await call('guardian-1', 'POST', '/notices', notice), 403);
  // Portaria não administra contas, vínculos, entregas nem câmeras.
  assert.equal(await call('staff-1', 'PATCH', '/accounts/guardian-1/status', { status: 'BLOCKED', expectedVersion: 1, reason: 'teste de permissão' }), 403);
  assert.equal(await call('staff-1', 'PATCH', '/guardian-links/guardian-1/std-1/revoke', { expectedVersion: 1, reason: 'teste de permissão' }), 403);
  assert.equal(await call('staff-1', 'POST', '/notification-deliveries/process', { outcome: 'DELIVER' }), 403);
  assert.equal(await call('staff-1', 'PATCH', '/access-devices/fixture-cat-01-portaria/camera', { cameraSource: '0' }), 403);
  // Portaria consulta, mas não publica comunicados nem analisa justificativas.
  assert.equal(await call('staff-1', 'POST', '/notices', notice), 403);
  assert.equal(await call('staff-1', 'PATCH', '/justifications/abs-inexistente/status', { status: 'APPROVED', expectedVersion: 1 }), 403);
  // Equipe não solicita vínculo como se fosse responsável.
  assert.equal(await call('staff-2', 'POST', '/guardian-link-requests', { studentEnrollment: '2024-0891', relationship: 'Mãe' }), 403);
});

test('lista de estudantes traz a ficha completa para a escola e só o próprio vínculo ao responsável', async (t) => {
  const api = await startApi();
  t.after(api.close);
  api.database.prepare(`
    UPDATE students SET class_name = '5º Ano A', shift = 'MORNING', stage = 'EARLY_YEARS' WHERE id = 'std-1'
  `).run();
  api.database.prepare(`
    INSERT INTO guardian_student_links (guardian_user_id, student_id, status, approved_at, approved_by, relationship)
    VALUES ('guardian-2', 'std-1', 'APPROVED', '2026-10-13T12:00:00.000Z', 'staff-2', 'Pai')
  `).run();

  const school = await fetch(`${api.baseUrl}/api/v1/students`, {
    headers: { Authorization: `Bearer ${await loginAs(api.baseUrl, 'staff-1')}` },
  }).then((response) => response.json()) as { data: Array<Record<string, any>> };
  const ana = school.data.find((student) => student.id === 'std-1')!;
  assert.equal(ana.className, '5º Ano A');
  assert.equal(ana.shift, 'MORNING');
  assert.deepEqual(ana.guardians.map((guardian: { id: string }) => guardian.id).sort(), ['guardian-1', 'guardian-2']);

  const guardian = await fetch(`${api.baseUrl}/api/v1/me/students`, {
    headers: { Authorization: `Bearer ${await loginAs(api.baseUrl, 'guardian-1')}` },
  }).then((response) => response.json()) as { data: Array<Record<string, any>> };
  const ownView = guardian.data.find((student) => student.id === 'std-1')!;
  assert.deepEqual(ownView.guardians.map((item: { id: string }) => item.id), ['guardian-1'], 'não expõe outros responsáveis');
});

test('cadastro de responsável cria conta e pedido de vínculo, sem liberar dados antes da aprovação', async (t) => {
  const api = await startApi();
  t.after(api.close);
  const register = (body: Record<string, unknown>) => fetch(`${api.baseUrl}/api/v1/auth/register`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  const valid = {
    name: 'Joana Teste Silva', email: 'joana.teste@example.com', phone: '(11) 91234-5678',
    password: 'SenhaSegura1', studentEnrollment: '2024-0891', relationship: 'Mãe',
  };

  assert.equal((await register({ ...valid, studentEnrollment: '9999-0000' })).status, 404);
  assert.equal((await register({ ...valid, password: 'curta' })).status, 422);
  assert.equal((await register({ ...valid, relationship: 'Vizinha' })).status, 422);

  const created = await register(valid);
  assert.equal(created.status, 201);
  const session = (await created.json() as { data: { token: string; user: { role: string; linkedStudentIds: string[] } } }).data;
  assert.equal(session.user.role, 'GUARDIAN');
  assert.deepEqual(session.user.linkedStudentIds, []);

  const auth = { Authorization: `Bearer ${session.token}` };
  const students = await fetch(`${api.baseUrl}/api/v1/me/students`, { headers: auth }).then((r) => r.json()) as { data: unknown[] };
  assert.deepEqual(students.data, []);
  assert.equal((await fetch(`${api.baseUrl}/api/v1/students/std-1/access-events`, { headers: auth })).status, 404);
  const requests = await fetch(`${api.baseUrl}/api/v1/guardian-link-requests`, { headers: auth }).then((r) => r.json()) as { data: Array<{ status: string }> };
  assert.equal(requests.data.length, 1);
  assert.equal(requests.data[0].status, 'PENDING');

  // Mesmo e-mail não cria segunda conta.
  assert.equal((await register({ ...valid, phone: '(11) 95555-0000' })).status, 409);
  // Cadastro pelo portal nunca cria conta da equipe.
  const role = api.database.prepare("SELECT role FROM users WHERE email = 'joana.teste@example.com'").get() as { role: string };
  assert.equal(role.role, 'GUARDIAN');
});
