import type {
  AbsenceJustification, AccessLog, ParentAccount, ParentNotification, SchoolNotice, Student,
} from '../src/types';
import type { GuardianLinkRequestRecord } from '../shared/contracts/linkRequests';

/**
 * Dados exclusivos do aceite visual (layout do portal em várias larguras).
 * Não são carregados pelo sistema: o portal real lê tudo da API.
 */
export const VISUAL_SCHOOL_NAME = 'Escola Municipal Catraca de Troia';

export const visualStudents: Student[] = [
  {
    id: 'visual-est-1', matricula: '2026-0001', name: 'Lívia Batista', turma: '2º Ano A', shift: 'Manhã',
    guardianName: 'Saylon Batista', guardianPhone: '(11) 90000-2001', guardianRelation: 'Pai',
    emergencyContact: '(11) 90000-2001', status: 'Ativo', age: 8, stage: 'Fundamental I',
    exitAuthorization: 'Apenas com Responsável', homeroomTeacher: 'Profª. Renata Lopes',
  },
  {
    id: 'visual-est-2', matricula: '2026-0003', name: 'Helena Batista', turma: '8º Ano B', shift: 'Tarde',
    guardianName: 'Saylon Batista', guardianPhone: '(11) 90000-2001', guardianRelation: 'Pai',
    emergencyContact: '(11) 90000-2001', status: 'Ativo', age: 14, stage: 'Fundamental II',
    exitAuthorization: 'Saída Desacompanhada Autorizada', homeroomTeacher: 'Profª. Camila Duarte',
  },
];

export const visualGuardian: ParentAccount = {
  id: 'visual-resp-1',
  name: 'Saylon Batista',
  phone: '(11) 90000-2001',
  relation: 'Pai',
  childrenIds: visualStudents.map((student) => student.id),
};

export const visualLinkRequests: GuardianLinkRequestRecord[] = [
  {
    id: 'visual-link-1', schoolId: 'visual-school', guardian: visualGuardian,
    student: { id: 'visual-unlinked', name: 'Estudante informado', enrollment: '2026-0004' },
    relationship: 'Tutor(a) Legal', status: 'REJECTED', submittedAt: '2026-11-10T13:00:00Z',
    reviewNote: 'O vínculo não pôde ser confirmado. Confira a matrícula e procure a secretaria da escola para revisar os dados da solicitação.', version: 2,
  },
];

const today = new Date();
const at = (hours: number, minutes: number) => {
  const date = new Date(today);
  date.setHours(hours, minutes, 0, 0);
  return date.toISOString();
};
const notificationDate = (hours: number, minutes: number) => new Date(at(hours, minutes)).toLocaleString('pt-BR', {
  day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
});
const log = (id: string, student: Student, direction: AccessLog['direction'], timestamp: string): AccessLog => ({
  id,
  studentId: student.id,
  studentName: student.name,
  matricula: student.matricula,
  turma: student.turma,
  shift: student.shift,
  timestamp,
  exactTime: new Date(timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
  relativeTime: '',
  direction,
  turnstileId: 'cat-01',
  turnstileName: 'Catraca 01 (Portão Principal)',
  status: 'Autorizado',
  method: 'Facial',
  source: 'camera',
  notification: { whatsapp: 'Pendente', pushApp: 'Pendente', sentAt: '', phoneTarget: student.guardianPhone },
});

export const visualLogs: AccessLog[] = [
  log('visual-log-1', visualStudents[0], 'entry', at(7, 12)),
  log('visual-log-2', visualStudents[1], 'entry', at(12, 51)),
];

export const visualNotices: SchoolNotice[] = [
  {
    id: 'visual-notice-1', title: 'Reunião de responsáveis do 2º bimestre', category: 'Pedagógico',
    author: 'Gustavo Coelho', role: 'Coordenação Pedagógica', date: today.toLocaleDateString('pt-BR'),
    time: '09:00', summary: 'Apresentação do desenvolvimento das turmas e calendário de avaliações.',
    fullContent: 'A reunião acontece no pátio coberto. Traga um documento para a identificação na portaria.',
    priority: 'important', isUnread: true, version: 1,
  },
  {
    id: 'visual-notice-2', title: 'Horário de entrada no período de provas', category: 'Geral',
    author: 'Gustavo Coelho', role: 'Coordenação Pedagógica', date: today.toLocaleDateString('pt-BR'),
    time: '08:30', summary: 'Durante as provas, o portão abre 15 minutos antes do horário habitual.',
    fullContent: 'O portão principal abre às 6h45 durante a semana de provas.',
    priority: 'info', isUnread: false, version: 1,
  },
];

export const visualNotifications: ParentNotification[] = [
  {
    id: 'visual-notification-1', title: 'Entrada registrada', message: 'Lívia Batista entrou pela Catraca 01.',
    timestamp: notificationDate(7, 12), type: 'entry', studentName: 'Lívia Batista', turnstile: 'Catraca 01', isRead: false,
  },
  {
    id: 'visual-notification-2', title: 'Reunião de responsáveis do segundo bimestre',
    message: 'A escola enviou um comunicado sobre o calendário de avaliações e a apresentação das turmas.',
    timestamp: notificationDate(14, 25), type: 'notice', isRead: false,
  },
];

export const visualJustifications: AbsenceJustification[] = [
  {
    id: 'visual-justification-1', studentId: visualStudents[1].id, studentName: visualStudents[1].name,
    date: '2026-11-10', reasonCategory: 'Compromisso Familiar',
    description: 'Viagem para acompanhar consulta de um familiar.', submittedAt: '2026-11-09T18:00:00.000Z',
    status: 'Em Análise',
  },
];
