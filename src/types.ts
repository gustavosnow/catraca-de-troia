export type Shift = 'Todos' | 'Manhã' | 'Tarde' | 'Integral';

export type AccessStatus = 'Autorizado' | 'Tolerância' | 'Bloqueado' | 'LiberacaoManual';

export type NotificationStatus = 'Entregue' | 'Lido' | 'Pendente' | 'Falha';

export interface Student {
  id: string;
  matricula: string;
  name: string;
  avatar: string;
  turma: string;
  shift: 'Manhã' | 'Tarde' | 'Integral';
  guardianName: string;
  guardianPhone: string;
  guardianRelation: string;
  email: string;
  emergencyContact: string;
  status: 'Ativo' | 'Suspenso' | 'Afastado';
  rfidCard: string;
  age?: number;
  stage?: 'Fundamental I' | 'Fundamental II';
  exitAuthorization?: 'Apenas com Responsável' | 'Transporte Escolar' | 'Saída Desacompanhada Autorizada';
  homeroomTeacher?: string;
  healthNotes?: string;
}

export interface AccessLog {
  id: string;
  studentId: string;
  studentName: string;
  matricula: string;
  avatar: string;
  turma: string;
  shift: 'Manhã' | 'Tarde' | 'Integral';
  timestamp: string; // ISO string or HH:mm:ss
  exactTime: string; // "07:34:12"
  relativeTime: string;
  turnstileId: string;
  turnstileName: string;
  status: AccessStatus;
  method: 'Facial' | 'RFID' | 'QR Code' | 'Biometria' | 'Manual';
  notification: {
    whatsapp: NotificationStatus;
    pushApp: NotificationStatus;
    sentAt: string;
    phoneTarget: string;
  };
  reason?: string;
  operator?: string;
  isNew?: boolean;
}

export interface Turnstile {
  id: string;
  name: string;
  location: string;
  status: 'Online' | 'Ocupada' | 'Manutenção' | 'Offline';
  passesToday: number;
  ipAddress: string;
  lastPing: string;
}

export interface SecurityAlert {
  id: string;
  title: string;
  description: string;
  time: string;
  type: 'unrecognized' | 'blocked_badge' | 'wrong_shift' | 'manual_override';
  severity: 'high' | 'medium' | 'low';
  turnstile: string;
  resolved: boolean;
}

export interface DayTimelineEvent {
  id: string;
  time: string;
  title: string;
  location: string;
  status: 'completed' | 'current' | 'upcoming';
  badgeType?: 'entry' | 'class' | 'break' | 'exit';
  detail?: string;
}

export interface WeeklyAccessDay {
  dayName: string;
  shortDate: string;
  fullDate: string;
  entryTime: string | null;
  exitTime: string | null;
  turnstileUsed: string;
  method: 'Facial' | 'RFID' | 'QR Code' | 'Biometria' | 'Manual' | '-';
  status: 'presente' | 'atraso_tolerado' | 'ausente_justificado' | 'ausente' | 'em_andamento';
  durationHours: string;
  notificationDelivered: boolean;
}

export interface SchoolNotice {
  id: string;
  title: string;
  category: 'Geral' | 'Pedagógico' | 'Segurança' | 'Eventos' | 'Plantão';
  author: string;
  role: string;
  date: string;
  time: string;
  summary: string;
  fullContent: string;
  priority: 'urgent' | 'important' | 'info';
  isUnread: boolean;
  attachmentName?: string;
}

export interface ParentNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type: 'entry' | 'exit' | 'notice' | 'absence' | 'security';
  studentName?: string;
  turnstile?: string;
  isRead: boolean;
}

export interface AbsenceJustification {
  id: string;
  studentId: string;
  studentName: string;
  date: string;
  endDate?: string;
  reasonCategory: 'Médico / Saúde' | 'Consulta Odontológica' | 'Motivo de Força Maior' | 'Compromisso Familiar' | 'Outro';
  description: string;
  attachmentName?: string;
  submittedAt: string;
  status: 'Em Análise' | 'Aprovado pela Coordenação' | 'Recusado';
}

export type UserRole = 'parent' | 'staff';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  cpf?: string;
  avatar?: string;
  guardianRelation?: 'Mãe' | 'Pai' | 'Avó / Avô' | 'Tutor(a) Legal' | 'Responsável';
  childrenIds?: string[];
  staffRole?: 'Operador de Portaria & Inspetor' | 'Coordenação Pedagógica' | 'Direção Escolar' | 'Segurança Patrimonial';
  functionalRegistry?: string;
  schoolUnit: string;
  inepCode?: string;
}

export interface StaffAccount {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'Operador de Portaria & Inspetor' | 'Coordenação Pedagógica' | 'Direção Escolar' | 'Segurança Patrimonial';
  functionalRegistry: string;
  schoolUnit: string;
  avatar?: string;
}


