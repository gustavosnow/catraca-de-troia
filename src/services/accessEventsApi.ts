import type { AccessEventRecord, CreateAccessEventRequest } from '../../shared/contracts/accessEvents';
import type { AccessEventSyncStatus } from '../../shared/contracts/accessEventSync';
import type { AccessDirection, AccessLog, Student, Turnstile } from '../types';
import { authenticatedRequest } from './authApi';

const SOURCES: Record<AccessEventRecord['source'], NonNullable<AccessLog['source']>> = {
  FACE_PROTOTYPE: 'camera',
  ASSISTED_PASSAGE: 'assistida',
  DEMO_SIMULATION: 'simulacao',
};

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
    turma: student?.turma || 'Turma não informada',
    shift: student?.shift || 'Manhã',
    timestamp: record.occurredAt,
    exactTime,
    relativeTime: '',
    direction: record.direction === 'ENTRY' ? 'entry' : 'exit',
    turnstileId: record.turnstile.id,
    turnstileName: record.turnstile.name,
    status: record.status === 'AUTHORIZED' ? 'Autorizado' : 'LiberacaoManual',
    method: record.method === 'FACIAL' ? 'Facial' : 'Manual',
    operator: record.createdById,
    reason: record.reason,
    source: SOURCES[record.source],
    recognition: record.recognition,
    notification: {
      whatsapp: record.notification.whatsapp === 'DELIVERED' ? 'Entregue' : 'Pendente',
      pushApp: record.notification.pushApp === 'DELIVERED' ? 'Entregue' : 'Pendente',
      sentAt: exactTime,
      phoneTarget: student?.guardianPhone || '',
    },
  };
};

export const accessEventsApi = {
  getSyncStatus: () =>
    authenticatedRequest<AccessEventSyncStatus>('/api/v1/access-events/sync/status'),

  retrySyncConflicts: () =>
    authenticatedRequest<{ requeued: number }>('/api/v1/access-events/sync/retry-conflicts', {
      method: 'POST',
    }),

  /** Portal: passagens dos estudantes já carregados para o responsável da sessão. */
  listForGuardian: async (students: Student[]) => {
    const records = await Promise.all(students.map((student) =>
      authenticatedRequest<AccessEventRecord[]>(`/api/v1/students/${student.id}/access-events?limit=100`),
    ));
    return records.flat().map((record) => mapEvent(record, students));
  },

  listForSchool: async (students: Student[]) =>
    (await authenticatedRequest<AccessEventRecord[]>('/api/v1/access-events?limit=100'))
      .map((record) => mapEvent(record, students)),

  /**
   * Passagem assistida: entrada ou saída registrada pela equipe com motivo. A API
   * confere a catraca, a sequência do dia e grava operador e auditoria.
   */
  createAssisted: async (
    student: Student,
    direction: AccessDirection,
    turnstile: Turnstile,
    reason: string,
    students: Student[],
  ) => {
    const payload: CreateAccessEventRequest = {
      direction: direction === 'entry' ? 'ENTRY' : 'EXIT',
      turnstileId: turnstile.id,
      turnstileName: turnstile.name,
      status: 'MANUAL_RELEASE',
      method: 'MANUAL',
      whatsappStatus: 'PENDING',
      pushStatus: 'PENDING',
      reason,
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
