import type {
  CreateJustificationRequest,
  JustificationReason,
  JustificationRecord,
  JustificationStatus,
  LinkedStudent,
  ReviewStatus,
} from '../../shared/contracts/justifications';
import type { AbsenceJustification } from '../types';
import { authenticatedRequest } from './authApi';
import { attachmentsApi } from './attachmentsApi';

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
  attachmentId: record.attachmentId,
  attachmentValidationStatus: record.attachmentValidationStatus,
  submittedAt: formatDateTime(record.submittedAt) || record.submittedAt,
  status: statusFromApi[record.status],
  reviewedAt: formatDateTime(record.reviewedAt),
  reviewedBy: record.reviewedById,
  version: record.version,
});

export const justificationsApi = {
  listLinkedStudents: () =>
    authenticatedRequest<LinkedStudent[]>('/api/v1/me/students'),

  listForStudent: (studentId: string) =>
    authenticatedRequest<JustificationRecord[]>(`/api/v1/students/${studentId}/justifications`),

  listForGuardian: async () => {
    const students = await justificationsApi.listLinkedStudents();
    const records = await Promise.all(
      students.map((student) => justificationsApi.listForStudent(student.id)),
    );
    return records.flat().map(mapJustification);
  },

  listForSchool: async () =>
    (await authenticatedRequest<JustificationRecord[]>('/api/v1/justifications')).map(mapJustification),

  create: async (
    input: Omit<AbsenceJustification, 'id' | 'submittedAt' | 'status'>,
    attachment?: File,
  ) => {
    const uploaded = attachment ? await attachmentsApi.upload(attachment) : undefined;
    const payload: CreateJustificationRequest = {
      absenceStartDate: input.date,
      absenceEndDate: input.endDate,
      reasonCategory: reasonToApi[input.reasonCategory],
      description: input.description,
      attachmentName: uploaded?.fileName || input.attachmentName,
      attachmentId: uploaded?.id,
    };
    const idempotencyKey = globalThis.crypto?.randomUUID?.()
      ?? `justification-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    try {
      const record = await authenticatedRequest<JustificationRecord>(
        `/api/v1/students/${input.studentId}/justifications`,
        {
          method: 'POST',
          headers: { 'Idempotency-Key': idempotencyKey },
          body: JSON.stringify(payload),
        },
      );
      return mapJustification(record);
    } catch (error) {
      if (uploaded) await attachmentsApi.discard(uploaded.id).catch(() => undefined);
      throw error;
    }
  },

  review: async (
    justification: AbsenceJustification,
    status: Extract<AbsenceJustification['status'], 'Aprovado pela Coordenação' | 'Recusado'>,
  ) => {
    const record = await authenticatedRequest<JustificationRecord>(
      `/api/v1/justifications/${justification.id}/status`,
      {
        method: 'PATCH',
        body: JSON.stringify({ status: reviewToApi[status], expectedVersion: justification.version }),
      },
    );
    return mapJustification(record);
  },
};
