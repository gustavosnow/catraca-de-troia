import { Request, Router } from 'express';
import {
  CreateGuardianLinkRequest,
  GUARDIAN_RELATIONSHIPS,
  ReviewGuardianLinkRequest,
} from '../../../shared/contracts/linkRequests';
import { ActorRequest } from '../../auth/sessionAuth';
import { invalidRequest } from '../../errors';
import { LinkRequestService } from './service';

const actorFrom = (request: Request) => (request as ActorRequest).actor;

const parseCreate = (body: unknown): CreateGuardianLinkRequest => {
  const value = body as Partial<CreateGuardianLinkRequest> | null;
  if (!value
    || typeof value.studentEnrollment !== 'string'
    || value.studentEnrollment.trim().length < 4
    || value.studentEnrollment.length > 40
    || !value.relationship
    || !GUARDIAN_RELATIONSHIPS.includes(value.relationship)) {
    throw invalidRequest('Informe matrícula e parentesco válidos.');
  }
  return value as CreateGuardianLinkRequest;
};

const parseReview = (body: unknown): ReviewGuardianLinkRequest => {
  const value = body as Partial<ReviewGuardianLinkRequest> | null;
  if (!value
    || !['APPROVED', 'REJECTED'].includes(value.status ?? '')
    || !Number.isInteger(value.expectedVersion)
    || (value.expectedVersion ?? 0) < 1
    || (value.reviewNote !== undefined
      && (typeof value.reviewNote !== 'string' || value.reviewNote.length > 500))) {
    throw invalidRequest('Informe status, versão e observação válidos.');
  }
  return value as ReviewGuardianLinkRequest;
};

export const createLinkRequestRouter = (service: LinkRequestService) => {
  const router = Router();
  router.get('/guardian-link-requests', (request, response) => {
    response.json({ data: service.list(actorFrom(request)) });
  });
  router.post('/guardian-link-requests', (request, response) => {
    const idempotencyKey = request.header('Idempotency-Key')?.trim();
    if (!idempotencyKey || idempotencyKey.length > 200) {
      throw invalidRequest('Informe Idempotency-Key com até 200 caracteres.');
    }
    const result = service.create(actorFrom(request), parseCreate(request.body), idempotencyKey);
    response.status(result.created ? 201 : 200).json({ data: result.request });
  });
  router.patch('/guardian-link-requests/:id', (request, response) => {
    response.json({ data: service.review(actorFrom(request), request.params.id, parseReview(request.body)) });
  });
  return router;
};
