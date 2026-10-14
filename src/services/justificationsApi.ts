import type {
  ApiErrorBody,
  CreateJustificationRequest,
  JustificationReason,
  JustificationRecord,
  JustificationStatus,
  LinkedStudent,
  ReviewStatus,
} from '../../shared/contracts/justifications';
import type { AbsenceJustification } from '../types';
import { apiBaseUrl } from '../config/runtime';
import { ApiClientError } from './apiError';

const reasonToApi: Record<AbsenceJustification['reasonCategory'], JustificationReason> = {
  'Médico / Saúde': 'MEDICAL',
  'Consulta Odontológica': 'DENTAL',
  'Motivo de Força Maior': 'FORCE_MAJEURE',
  'Compromisso Familiar': 'FAMILY_COMMITMENT',
  Outro: 'OTHER',
};

const reasonFromApi: Record<JustificationReason, AbsenceJustification['reasonCategory']> = {
  MEDICAL: 'Médico / Saúde',
  DENTAL: 'Consulta Odontológica',
  FORCE_MAJEURE: 'Motivo de Força Maior',
  FAMILY_COMMITMENT: 'Compromisso Familiar',
  OTHER: 'Outro',
};

const statusFromApi: Record<JustificationStatus, AbsenceJustification['status']> = {
  PENDING: 'Em Análise',
  APPROVED: 'Aprovado pela Coordenação',
  REJECTED: 'Recusado',
};

const reviewToApi: Record<
  Extract<AbsenceJustification['status'], 'Aprovado pela Coordenação' | 'Recusado'>,
  ReviewStatus
> = {
  'Aprovado pela Coordenação': 'APPROVED',
  Recusado: 'REJECTED',
};

const formatDateTime = (value?: string) => value
  ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value))
  : undefined;

export const mapJustification = (record: JustificationRecord): AbsenceJustification => ({
  id: record.id,
  studentId: record.student.id,
  studentName: record.student.name,
  date: record.absenceStartDate,
  endDate: record.absenceEndDate,
  reasonCategory: reasonFromApi[record.reasonCategory],
  description: record.description,
  attachmentName: record.attachmentName,
  submittedAt: formatDateTime(record.submittedAt) || record.submittedAt,
  status: statusFromApi[record.status],
  reviewedAt: formatDateTime(record.reviewedAt),
  reviewedBy: record.reviewedById,
  version: record.version,
});

const request = async <T>(pathname: string, actorId: string, init?: RequestInit): Promise<T> => {
  const headers = new Headers(init?.headers);
  headers.set('X-Demo-User-Id', actorId);
  if (init?.body) headers.set('Content-Type', 'application/json');

  let response: Response;
  try {
    response = await fetch(`${apiBaseUrl}${pathname}`, { ...init, headers });
  } catch {
    throw new ApiClientError(
      'API_UNAVAILABLE',
      'A API de justificativas não está acessível. Inicie o ambiente completo ou configure VITE_API_BASE_URL.',
      0,
    );
  }

  const body = await response.json().catch(() => null) as ({ data?: T } & Partial<ApiErrorBody>) | null;
  if (!response.ok) {
    throw new ApiClientError(
      body?.error?.code || 'REQUEST_FAILED',
      body?.error?.message || 'Não foi possível concluir a operação.',
      response.status,
    );
  }
  return body?.data as T;
};

export const justificationsApi = {
  listLinkedStudents: (guardianId: string) =>
    request<LinkedStudent[]>('/api/v1/me/students', guardianId),

  listForStudent: (guardianId: string, studentId: string) =>
    request<JustificationRecord[]>(`/api/v1/students/${studentId}/justifications`, guardianId),

  listForGuardian: async (guardianId: string) => {
    const students = await justificationsApi.listLinkedStudents(guardianId);
    const records = await Promise.all(
      students.map((student) => justificationsApi.listForStudent(guardianId, student.id)),
    );
    return records.flat().map(mapJustification);
  },

  listForSchool: async (staffId: string) =>
    (await request<JustificationRecord[]>('/api/v1/justifications', staffId)).map(mapJustification),

  create: async (
    guardianId: string,
    input: Omit<AbsenceJustification, 'id' | 'submittedAt' | 'status'>,
  ) => {
    const payload: CreateJustificationRequest = {
      absenceStartDate: input.date,
      absenceEndDate: input.endDate,
      reasonCategory: reasonToApi[input.reasonCategory],
      description: input.description,
      attachmentName: input.attachmentName,
    };
    const idempotencyKey = globalThis.crypto?.randomUUID?.()
      ?? `justification-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const record = await request<JustificationRecord>(
      `/api/v1/students/${input.studentId}/justifications`,
      guardianId,
      {
        method: 'POST',
        headers: { 'Idempotency-Key': idempotencyKey },
        body: JSON.stringify(payload),
      },
    );
    return mapJustification(record);
  },

  review: async (
    staffId: string,
    justification: AbsenceJustification,
    status: Extract<AbsenceJustification['status'], 'Aprovado pela Coordenação' | 'Recusado'>,
  ) => {
    const record = await request<JustificationRecord>(
      `/api/v1/justifications/${justification.id}/status`,
      staffId,
      {
        method: 'PATCH',
        body: JSON.stringify({ status: reviewToApi[status], expectedVersion: justification.version }),
      },
    );
    return mapJustification(record);
  },
};
