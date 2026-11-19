export type Shift = 'Todos' | 'Manhã' | 'Tarde' | 'Integral';

export type AccessStatus = 'Autorizado' | 'Tolerância' | 'Bloqueado' | 'LiberacaoManual';

export type NotificationStatus = 'Entregue' | 'Lido' | 'Pendente' | 'Falha';

export type AccessDirection = 'entry' | 'exit';

/** Ficha do estudante como a interface usa; vem de /students ou /me/students. */
export interface Student {
  id: string;
  matricula: string;
  name: string;
  turma: string;
  shift: 'Manhã' | 'Tarde' | 'Integral';
  /** Primeiro responsável com vínculo aprovado; vazio quando ainda não há vínculo. */
  guardianName: string;
  guardianPhone: string;
  guardianRelation: string;
  emergencyContact: string;
  status: 'Ativo' | 'Suspenso' | 'Afastado';
  age?: number;
  stage?: 'Fundamental I' | 'Fundamental II';
  exitAuthorization?: 'Apenas com Responsável' | 'Transporte Escolar' | 'Saída Desacompanhada Autorizada';
  homeroomTeacher?: string;
}

export interface AccessLog {
  id: string;
  studentId: string;
  studentName: string;
  matricula: string;
  turma: string;
  shift: 'Manhã' | 'Tarde' | 'Integral';
  timestamp: string; // ISO string or HH:mm:ss
  exactTime: string; // "07:34:12"
  relativeTime: string;
  direction: AccessDirection;
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
  /** Origem: câmera do protótipo facial, passagem assistida ou simulação de bases antigas. */
  source?: 'camera' | 'assistida' | 'simulacao';
  recognition?: {
    deviceId: string;
    matchScore: number;
    inferenceMs: number;
  };
}

/** Câmera (sentido) de uma catraca cadastrada em access_devices. */
export interface TurnstileLane {
  deviceId: string;
  direction: AccessDirection;
  active: boolean;
  lastSeenAt?: string;
}

/** Catraca cadastrada, agrupando as câmeras de entrada e de saída. */
export interface Turnstile {
  id: string;
  name: string;
  lanes: TurnstileLane[];
}

/** Ponto de atenção do dia: leitura negada pelo protótipo facial. */
export interface SecurityAlert {
  id: string;
  demo: boolean;
  title: string;
  turnstileName: string;
  direction: AccessDirection;
  occurredAt: string;
}

/** Responsável da sessão no portal (montado a partir da sessão e de /me/students). */
export interface ParentAccount {
  id: string;
  name: string;
  phone: string;
  relation: string;
  childrenIds: string[];
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
  status: 'presente' | 'atraso_tolerado' | 'ausente_justificado' | 'ausente' | 'em_andamento' | 'sem_registro';
  durationHours: string;
  hasDemoRecords: boolean;
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
  version?: number;
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
  attachmentId?: string;
  attachmentValidationStatus?: 'BASIC_VALIDATION_ONLY';
  submittedAt: string;
  status: 'Em Análise' | 'Aprovado pela Coordenação' | 'Recusado';
  reviewedAt?: string;
  reviewedBy?: string;
  version?: number;
}

export type UserRole = 'parent' | 'staff';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  childrenIds?: string[];
  staffRole?: 'Operador de Portaria & Inspetor' | 'Coordenação Pedagógica' | 'Direção Escolar';
  functionalRegistry?: string;
  schoolUnit: string;
}
