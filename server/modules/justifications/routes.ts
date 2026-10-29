import { Request, Router } from 'express';
import {
  CreateJustificationRequest,
  JUSTIFICATION_REASONS,
  JUSTIFICATION_STATUSES,
  ReviewJustificationRequest,
} from '../../../shared/contracts/justifications';
import { ActorRequest } from '../../auth/sessionAuth';
import { invalidRequest } from '../../errors';
import { JustificationService } from './service';

const actorFrom = (request: Request) => (request as ActorRequest).actor;

const isIsoDate = (value: unknown): value is string => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
};

const parseCreateRequest = (body: unknown): CreateJustificationRequest => {
  const value = body as Partial<CreateJustificationRequest> | null;
  if (!value || !isIsoDate(value.absenceStartDate)) {
    throw invalidRequest('absenceStartDate deve usar o formato YYYY-MM-DD.');
  }
  if (value.absenceEndDate && !isIsoDate(value.absenceEndDate)) {
    throw invalidRequest('absenceEndDate deve usar o formato YYYY-MM-DD.');
  }
  if (value.absenceEndDate && value.absenceEndDate < value.absenceStartDate) {
    throw invalidRequest('absenceEndDate não pode ser anterior a absenceStartDate.');
  }
  if (!value.reasonCategory || !JUSTIFICATION_REASONS.includes(value.reasonCategory)) {
    throw invalidRequest('reasonCategory é inválida.');
  }
  if (typeof value.description !== 'string' || value.description.trim().length < 5 || value.description.length > 2000) {
    throw invalidRequest('description deve ter entre 5 e 2000 caracteres.');
  }
  if (value.attachmentName !== undefined || value.attachmentId !== undefined) {
    throw invalidRequest('O piloto recebe somente justificativas textuais, sem anexos.');
  }
  return {
    absenceStartDate: value.absenceStartDate,
    absenceEndDate: value.absenceEndDate,
    reasonCategory: value.reasonCategory,
    description: value.description,
  };
};

const parseReviewRequest = (body: unknown): ReviewJustificationRequest => {
  const value = body as Partial<ReviewJustificationRequest> | null;
  if (!value || !['APPROVED', 'REJECTED'].includes(value.status ?? '')) {
    throw invalidRequest('status deve ser APPROVED ou REJECTED.');
  }
  if (!Number.isInteger(value.expectedVersion) || (value.expectedVersion ?? 0) < 1) {
    throw invalidRequest('expectedVersion deve ser um inteiro positivo.');
  }
  return value as ReviewJustificationRequest;
};

export const createJustificationRouter = (service: JustificationService) => {
  const router = Router();

  router.get('/me', (request, response) => {
    response.json({ actor: actorFrom(request) });
  });

  router.get('/me/students', (request, response) => {
    response.json({ data: service.listLinkedStudents(actorFrom(request)) });
  });

  router.get('/students/:studentId/justifications', (request, response) => {
    response.json({
      data: service.listForStudent(actorFrom(request), request.params.studentId),
    });
  });

  router.post('/students/:studentId/justifications', (request, response) => {
    const idempotencyKey = request.header('Idempotency-Key')?.trim();
    if (!idempotencyKey || idempotencyKey.length > 200) {
      throw invalidRequest('Informe Idempotency-Key com até 200 caracteres.');
    }
    const result = service.create(
      actorFrom(request),
      request.params.studentId,
      parseCreateRequest(request.body),
      idempotencyKey,
    );
    response.status(result.created ? 201 : 200).json({ data: result.justification });
  });

  router.get('/justifications', (request, response) => {
    const status = request.query.status;
    if (status !== undefined && (typeof status !== 'string' || !JUSTIFICATION_STATUSES.includes(status as never))) {
      throw invalidRequest('Filtro status inválido.');
    }
    response.json({
      data: service.listForSchool(actorFrom(request), status as never),
    });
  });

  router.patch('/justifications/:id/status', (request, response) => {
    response.json({
      data: service.review(
        actorFrom(request),
        request.params.id,
        parseReviewRequest(request.body),
      ),
    });
  });

  return router;
};
