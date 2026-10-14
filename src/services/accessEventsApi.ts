import type { AccessEventRecord, CreateAccessEventRequest } from '../../shared/contracts/accessEvents';
import type { LinkedStudent } from '../../shared/contracts/justifications';
import type { AccessDirection, AccessLog, Student, Turnstile } from '../types';
import { authenticatedRequest } from './authApi';

const mapEvent = (record: AccessEventRecord, students: Student[]): AccessLog => {
  const student = students.find((item) => item.id === record.student.id);
  const occurredAt = new Date(record.occurredAt);
  const exactTime = occurredAt.toLocaleTimeString('pt-BR', {
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
  return {
    id: record.id,
    studentId: record.student.id,
    studentName: record.student.name,
    matricula: record.student.enrollment,
    avatar: student?.avatar || '',
    turma: student?.turma || 'Turma não informada',
    shift: student?.shift || 'Manhã',
    timestamp: record.occurredAt,
    exactTime,
    relativeTime: 'Persistido na API local',
    direction: record.direction === 'ENTRY' ? 'entry' : 'exit',
    turnstileId: record.turnstile.id,
    turnstileName: record.turnstile.name,
    status: record.status === 'AUTHORIZED' ? 'Autorizado' : 'LiberacaoManual',
    method: record.method === 'FACIAL' ? 'Facial' : 'Manual',
    operator: record.createdById,
    reason: record.reason,
    notification: {
      whatsapp: record.notification.whatsapp === 'DELIVERED' ? 'Entregue' : 'Pendente',
      pushApp: record.notification.pushApp === 'DELIVERED' ? 'Entregue' : 'Pendente',
      sentAt: exactTime,
      phoneTarget: student?.guardianPhone || '',
    },
  };
};

const listLinkedStudents = () =>
  authenticatedRequest<LinkedStudent[]>('/api/v1/me/students');

export const accessEventsApi = {
  listForGuardian: async (students: Student[]) => {
    const linkedStudents = await listLinkedStudents();
    const records = await Promise.all(linkedStudents.map((student) =>
      authenticatedRequest<AccessEventRecord[]>(`/api/v1/students/${student.id}/access-events?limit=100`),
    ));
    return records.flat().map((record) => mapEvent(record, students));
  },

  listForSchool: async (students: Student[]) =>
    (await authenticatedRequest<AccessEventRecord[]>('/api/v1/access-events?limit=100'))
      .map((record) => mapEvent(record, students)),

  create: async (
    student: Student,
    direction: AccessDirection,
    turnstile: Turnstile,
    students: Student[],
    options: {
      status?: CreateAccessEventRequest['status'];
      method?: CreateAccessEventRequest['method'];
      whatsappStatus?: CreateAccessEventRequest['whatsappStatus'];
      pushStatus?: CreateAccessEventRequest['pushStatus'];
      reason?: string;
    } = {},
  ) => {
    const payload: CreateAccessEventRequest = {
      direction: direction === 'entry' ? 'ENTRY' : 'EXIT',
      turnstileId: turnstile.id,
      turnstileName: turnstile.name.split(' - ')[0] + ' ('
        + (turnstile.name.includes('Fundamental I') ? 'Fundamental I' : 'Portão Principal') + ')',
      status: options.status || 'AUTHORIZED',
      method: options.method || 'FACIAL',
      whatsappStatus: options.whatsappStatus || 'DELIVERED',
      pushStatus: options.pushStatus || 'DELIVERED',
      reason: options.reason,
    };
    const idempotencyKey = globalThis.crypto?.randomUUID?.()
      ?? `access-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const record = await authenticatedRequest<AccessEventRecord>(
      `/api/v1/students/${student.id}/access-events`,
      {
        method: 'POST',
        headers: { 'Idempotency-Key': idempotencyKey },
        body: JSON.stringify(payload),
      },
    );
    return mapEvent(record, students);
  },
};
