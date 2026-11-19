/**
 * Alimenta a escola com o movimento de duas semanas letivas (MC-040).
 *
 *   npm run db:seed:atividade
 *
 * Roda depois de `npm run db:seed` e recusa um banco que já tenha passagens.
 * Tudo passa pelos serviços do sistema, com um relógio que avança dia a dia:
 * a sequência entrada → saída, as notificações dos responsáveis, a auditoria e
 * as permissões de cada perfil valem como no uso real. Nenhuma senha é criada
 * aqui, exceto a do responsável que se cadastra (SEED_PASSWORD).
 */
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import type { DemoActor } from '../../shared/contracts/justifications';
import { createDatabase } from '../db';
import { MIN_PASSWORD_LENGTH } from '../auth/credentials';
import { AccessDeviceService } from '../modules/accessDevices/service';
import { AccessEventService } from '../modules/accessEvents/service';
import { AuthService } from '../modules/auth/service';
import { CommunicationService } from '../modules/communications/service';
import { JustificationService } from '../modules/justifications/service';
import { LinkRequestService } from '../modules/linkRequests/service';
import { GUARDIANS, SCHOOL, STAFF, STUDENTS } from './schoolData';

const fail = (message: string): never => {
  console.error(message);
  process.exit(1);
};

// ------------------------------------------------------------------ relógio
let current = new Date().toISOString();
const clock = () => current;
/** Horário local da escola (UTC-3) de um dia AAAA-MM-DD. */
const at = (day: string, time: string) => new Date(`${day}T${time}:00-03:00`).toISOString();
const setClock = (iso: string) => { current = iso; };

/** Sequência pseudoaleatória fixa: a mesma carga gera o mesmo movimento. */
let seed = 20261119;
const random = () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
};
const between = (min: number, max: number) => min + Math.floor(random() * (max - min + 1));
const pad = (value: number) => String(value).padStart(2, '0');
const timeAt = (hour: number, minuteMin: number, minuteMax: number) => `${pad(hour)}:${pad(between(minuteMin, minuteMax))}`;

const todayLocal = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date());
/** Dez dias letivos antes de hoje, mais hoje (até o horário atual). */
const schoolDays = (() => {
  const days: string[] = [];
  const cursor = new Date(`${todayLocal}T12:00:00-03:00`);
  while (days.length < 10) {
    cursor.setUTCDate(cursor.getUTCDate() - 1);
    const weekday = cursor.getUTCDay();
    if (weekday !== 0 && weekday !== 6) days.unshift(cursor.toISOString().slice(0, 10));
  }
  const todayWeekday = new Date(`${todayLocal}T12:00:00-03:00`).getUTCDay();
  if (todayWeekday !== 0 && todayWeekday !== 6) days.push(todayLocal);
  return days;
})();

// ------------------------------------------------------------------- banco
const database = createDatabase({ filename: path.resolve(process.env.DATABASE_PATH || '.data/catraca-de-troia.sqlite') });
const count = (table: string) => (database.prepare(`SELECT COUNT(*) AS total FROM ${table}`).get() as { total: number }).total;
if (count('users') === 0) fail('Banco sem escola cadastrada. Rode antes: npm run db:seed.');
if (count('access_events') > 0) {
  fail('O banco já tem passagens. Para recomeçar: npm run db:seed -- --reset e depois npm run db:seed:atividade.');
}
const password = process.env.SEED_PASSWORD ?? '';
if (password.length < MIN_PASSWORD_LENGTH) {
  fail(`Defina SEED_PASSWORD (mínimo de ${MIN_PASSWORD_LENGTH} caracteres) para a conta do responsável que se cadastra.`);
}

const actorOf = (id: string): DemoActor => {
  const row = database.prepare('SELECT id, school_id, name, role FROM users WHERE id = ?').get(id) as
    { id: string; school_id: string; name: string; role: DemoActor['role'] } | undefined;
  if (!row) return fail(`Conta ${id} não encontrada; rode npm run db:seed -- --reset.`);
  return { id: row.id, schoolId: row.school_id, name: row.name, role: row.role };
};
const coordinator = actorOf(STAFF.find((member) => member.role === 'STAFF_COORDINATION')!.id);
const gate = actorOf(STAFF.find((member) => member.role === 'STAFF_GATE')!.id);
const guardianOf = (studentId: string) => actorOf(STUDENTS.find((student) => student.id === studentId)!.guardianId);

const devices = new AccessDeviceService(database, clock, 0);
const events = new AccessEventService(database, clock);
const communications = new CommunicationService(database, clock);
const justifications = new JustificationService(database, clock);
const linkRequests = new LinkRequestService(database, clock);
const auth = new AuthService(database, clock);

const cameras = database.prepare(`
  SELECT * FROM access_devices WHERE school_id = ? AND active = 1 ORDER BY turnstile_id, id
`).all(SCHOOL.id) as Parameters<AccessDeviceService['recognize']>[0][];
const turnstileIds = [...new Set(cameras.map((camera) => camera.turnstile_id))];
if (turnstileIds.length === 0) fail('Nenhuma catraca ativa. Confira o cadastro das câmeras antes de gerar o movimento.');

// ------------------------------------------------------------------ agenda
/** Tudo entra numa agenda e roda em ordem cronológica, como aconteceria de fato. */
const agenda: Array<{ iso: string; run: () => void }> = [];
const schedule = (iso: string, run: () => void) => {
  if (Date.parse(iso) <= Date.now()) agenda.push({ iso, run: () => { setClock(iso); run(); } });
};

// --------------------------------------------------------------- passagens
const totals = { facial: 0, assisted: 0, denials: 0, absences: 0 };

const ASSISTED_REASONS = [
  'Câmera não reconheceu o estudante; identidade conferida pela portaria.',
  'Estudante de boné e máscara; identificado pela portaria.',
  'Câmera reiniciando no momento da passagem.',
];
const LATE_REASON = 'Chegada após o horário, com o responsável; liberada pela coordenação.';
const EARLY_EXIT_REASON = 'Saída antecipada solicitada pelo responsável e conferida pela secretaria.';

const pass = (studentId: string, direction: 'ENTRY' | 'EXIT', iso: string, assistedReason?: string) => {
  setClock(iso);
  const studentIndex = STUDENTS.findIndex((student) => student.id === studentId);
  const matchingCameras = cameras.filter((item) => item.direction === direction);
  const camera = matchingCameras.length > 0
    ? matchingCameras[studentIndex % matchingCameras.length]
    : undefined;
  const turnstile = camera ?? cameras[studentIndex % cameras.length];
  const turnstileId = turnstile.turnstile_id;
  if (!assistedReason && camera && random() > 0.12) {
    const decision = devices.recognize(camera, {
      captureId: `carga-${randomUUID()}`,
      result: 'MATCH',
      studentId,
      matchScore: Number((0.55 + random() * 0.27).toFixed(4)),
      inferenceMs: Number((70 + random() * 120).toFixed(1)),
      framesConfirmed: 3,
    }, 'DEMO_SIMULATION');
    if (decision.decision === 'AUTHORIZED') totals.facial += 1;
    return;
  }
  events.create(gate, studentId, {
    direction,
    turnstileId,
    turnstileName: turnstile.turnstile_name,
    status: 'MANUAL_RELEASE',
    method: 'MANUAL',
    whatsappStatus: 'PENDING',
    pushStatus: 'PENDING',
    reason: assistedReason ?? ASSISTED_REASONS[between(0, ASSISTED_REASONS.length - 1)],
  }, `carga-${randomUUID()}`, 'DEMO_SIMULATION');
  totals.assisted += 1;
};

const deny = (iso: string, reason: 'NO_MATCH' | 'LOW_SCORE') => {
  const camera = cameras[between(0, cameras.length - 1)];
  setClock(iso);
  devices.recognize(camera, {
    captureId: `carga-${randomUUID()}`,
    result: reason === 'NO_MATCH' ? 'NO_MATCH' : 'MATCH',
    studentId: reason === 'LOW_SCORE' ? STUDENTS[between(0, STUDENTS.length - 1)].id : undefined,
    matchScore: reason === 'NO_MATCH' ? Number((0.1 + random() * 0.15).toFixed(4)) : Number((0.3 + random() * 0.08).toFixed(4)),
    inferenceMs: Number((70 + random() * 120).toFixed(1)),
    framesConfirmed: reason === 'NO_MATCH' ? 1 : 3,
  }, 'DEMO_SIMULATION');
  totals.denials += 1;
};

/** Horários por turno. */
const SCHEDULE = {
  MORNING: { entry: [6, 45, 59] as const, late: [7, 20, 40] as const, exit: [12, 0, 15] as const },
  AFTERNOON: { entry: [12, 45, 59] as const, late: [13, 20, 40] as const, exit: [17, 40, 55] as const },
  FULL_TIME: { entry: [7, 0, 15] as const, late: [7, 30, 50] as const, exit: [16, 50, 59] as const },
};

/** Ausências planejadas (dia pelo índice na lista de dias letivos). */
const ABSENCES: Array<{ studentId: string; dayIndex: number }> = [
  { studentId: 'est-pedro-ribeiro', dayIndex: 2 },
  { studentId: 'est-bernardo-teixeira', dayIndex: 4 },
  { studentId: 'est-laura-nunes', dayIndex: 6 },
  { studentId: 'est-helena-batista', dayIndex: 7 },
  { studentId: 'est-alice-moraes', dayIndex: 8 },
];
const LATE_ARRIVALS = [{ studentId: 'est-miguel-almeida', dayIndex: 3 }, { studentId: 'est-davi-batista', dayIndex: 8 }];
const EARLY_EXITS = [{ studentId: 'est-clara-ribeiro', dayIndex: 5, time: '15:10' }];

schoolDays.forEach((day, dayIndex) => {
  for (const student of STUDENTS) {
    if (ABSENCES.some((item) => item.studentId === student.id && item.dayIndex === dayIndex)) {
      totals.absences += 1;
      continue;
    }
    const hours = SCHEDULE[student.shift];
    const late = LATE_ARRIVALS.some((item) => item.studentId === student.id && item.dayIndex === dayIndex);
    const entry = late ? hours.late : hours.entry;
    const entryIso = at(day, timeAt(entry[0], entry[1], entry[2]));
    const early = EARLY_EXITS.find((item) => item.studentId === student.id && item.dayIndex === dayIndex);
    const exitIso = early ? at(day, early.time) : at(day, timeAt(hours.exit[0], hours.exit[1], hours.exit[2]));
    schedule(entryIso, () => pass(student.id, 'ENTRY', entryIso, late ? LATE_REASON : undefined));
    schedule(exitIso, () => pass(student.id, 'EXIT', exitIso, early ? EARLY_EXIT_REASON : undefined));
  }
  // Uma ou duas leituras negadas por dia (rosto desconhecido ou similaridade baixa).
  for (let index = 0; index < between(1, 2); index += 1) {
    const iso = at(day, timeAt(random() > 0.5 ? 7 : 13, 0, 30));
    const reason = random() > 0.4 ? 'NO_MATCH' : 'LOW_SCORE';
    schedule(iso, () => deny(iso, reason));
  }
});

// -------------------------------------------------------------- comunicados
const NOTICES = [
  { dayIndex: 0, time: '09:30', title: 'Calendário de avaliações do 4º bimestre', category: 'PEDAGOGICAL', priority: 'IMPORTANT',
    summary: 'Datas das avaliações de todas as turmas, de 23/11 a 04/12.',
    content: 'As avaliações do 4º bimestre acontecem de 23 de novembro a 4 de dezembro. O calendário de cada turma está no mural da escola e com os professores regentes. Em caso de falta, a segunda chamada deve ser combinada com a coordenação.', notify: true },
  { dayIndex: 2, time: '14:00', title: 'Campanha do agasalho', category: 'EVENTS', priority: 'INFO',
    summary: 'Arrecadação de roupas e cobertores até o fim do mês.',
    content: 'A escola está arrecadando roupas e cobertores em bom estado até o fim de novembro. As doações podem ser entregues na secretaria, das 7h às 17h. Tudo será repassado à associação do bairro.', notify: false },
  { dayIndex: 4, time: '10:15', title: 'Atualização dos contatos de emergência', category: 'SECURITY', priority: 'URGENT',
    summary: 'Confira na secretaria se o telefone de emergência do estudante está atualizado.',
    content: 'Para a segurança dos estudantes, pedimos que cada família confira na secretaria o telefone de emergência cadastrado. Em situações de saúde ou de saída antecipada, é por esse contato que a escola avisa a família.', notify: true },
  { dayIndex: 6, time: '16:30', title: 'Plantão de dúvidas de matemática', category: 'ON_CALL', priority: 'INFO',
    summary: 'Às terças e quintas, das 17h às 18h, na sala 4.',
    content: 'Os estudantes do 6º ao 9º ano podem tirar dúvidas de matemática às terças e quintas, das 17h às 18h, na sala 4, com o professor Thiago Martins. A participação é livre.', notify: false },
  { dayIndex: 8, time: '11:00', title: 'Reunião de responsáveis do 4º bimestre', category: 'PEDAGOGICAL', priority: 'IMPORTANT',
    summary: 'Encontro com as famílias para o fechamento do ano letivo.',
    content: 'A reunião de responsáveis acontece no pátio coberto, às 18h30, na última semana de novembro. Serão apresentados o desenvolvimento das turmas e o calendário de recuperação. Traga um documento para a identificação na portaria.', notify: true },
] as const;
const notices: Array<{ id: string }> = [];
for (const notice of NOTICES.filter((item) => schoolDays[item.dayIndex])) {
  schedule(at(schoolDays[notice.dayIndex], notice.time), () => notices.push(communications.createNotice(coordinator, {
    title: notice.title,
    category: notice.category,
    priority: notice.priority,
    authorLabel: coordinator.name,
    roleLabel: 'Coordenação Pedagógica',
    summary: notice.summary,
    content: notice.content,
    notifyGuardians: notice.notify,
  })));
}

// ----------------------------------------------------------- justificativas
const JUSTIFICATIONS = [
  { studentId: 'est-pedro-ribeiro', reason: 'DENTAL', review: 'APPROVED',
    description: 'Pedro teve uma consulta odontológica de urgência pela manhã e não conseguiu ir à aula.' },
  { studentId: 'est-bernardo-teixeira', reason: 'FORCE_MAJEURE', review: 'APPROVED',
    description: 'O transporte escolar não passou por causa do alagamento na avenida e não tivemos como levar o Bernardo.' },
  { studentId: 'est-laura-nunes', reason: 'FAMILY_COMMITMENT', review: undefined,
    description: 'Laura acompanhou a família no velório de um parente em outra cidade.' },
  { studentId: 'est-helena-batista', reason: 'OTHER', review: 'REJECTED',
    description: 'Helena perdeu a hora e preferimos que ficasse em casa.' },
] as const;
let justificationCount = 0;
for (const item of JUSTIFICATIONS) {
  const absence = ABSENCES.find((entry) => entry.studentId === item.studentId)!;
  const day = schoolDays[absence.dayIndex];
  if (!day || day === todayLocal) continue;
  let created: { id: string; version: number } | undefined;
  schedule(at(day, '19:40'), () => {
    created = justifications.create(guardianOf(item.studentId), item.studentId, {
      absenceStartDate: day,
      reasonCategory: item.reason,
      description: item.description,
    }, `carga-${randomUUID()}`).justification;
    justificationCount += 1;
  });
  const review = item.review;
  if (review) {
    const reviewDay = schoolDays[Math.min(absence.dayIndex + 1, schoolDays.length - 1)];
    schedule(at(reviewDay, '10:20'), () => {
      justifications.review(coordinator, created!.id, { status: review, expectedVersion: created!.version });
    });
  }
}

// --------------------------------------------------- vínculos e cadastro novo
// Pedido de vínculo errado, recusado pela coordenação.
let wrongRequest: { id: string; version: number } | undefined;
schedule(at(schoolDays[1], '20:10'), () => {
  wrongRequest = linkRequests.create(actorOf('resp-saylon-batista'), { studentEnrollment: '2026-0004', relationship: 'Pai' }, `carga-${randomUUID()}`).request;
});
schedule(at(schoolDays[2], '09:05'), () => {
  linkRequests.review(coordinator, wrongRequest!.id, {
    status: 'REJECTED',
    expectedVersion: wrongRequest!.version,
    reviewNote: 'Pedro Ribeiro não está na guarda deste responsável. Confira a matrícula com a secretaria.',
  });
});

// Mãe do Miguel se cadastra pelo portal e aguarda aprovação.
schedule(at(schoolDays[schoolDays.length - 2], '21:15'), () => {
  auth.registerGuardian({
    name: 'Ana Paula Almeida',
    email: `ana.almeida@${SCHOOL.emailDomain}`,
    phone: '(11) 90000-2007',
    password,
    studentEnrollment: '2026-0006',
    relationship: 'Mãe',
  });
});

// -------------------------------------------------------- leitura no portal
// Responsáveis abrem o portal à noite; o que chegou nos dois últimos dias fica não lido.
const readUntil = schoolDays.slice(0, -2);
for (const guardian of GUARDIANS) {
  const actor = actorOf(guardian.id);
  for (const [index, day] of readUntil.entries()) {
    if (index % 2 === 1 && guardian.id !== 'resp-saylon-batista') continue;
    schedule(at(day, '20:30'), () => communications.markAllNotificationsRead(actor));
  }
  if (random() > 0.4) {
    schedule(at(schoolDays[schoolDays.length - 2], '21:00'), () => communications.markNoticeRead(actor, notices[0].id));
  }
}

agenda
  .map((item, order) => ({ ...item, order }))
  .sort((left, right) => left.iso.localeCompare(right.iso) || left.order - right.order)
  .forEach((item) => item.run());

database.close();
console.log(`Dias letivos: ${schoolDays[0]} a ${schoolDays.at(-1)} (${schoolDays.length})`);
console.log(`Passagens: ${totals.facial} pelo protótipo facial, ${totals.assisted} assistidas | Leituras negadas: ${totals.denials} | Faltas: ${totals.absences}`);
console.log(`Comunicados: ${notices.length} | Justificativas: ${justificationCount} | Pedidos de vínculo: 2 (1 recusado, 1 pendente)`);
