import { Request, Router } from 'express';
import {
  ACCESS_DIRECTIONS,
  ACCESS_METHODS,
  ACCESS_STATUSES,
  CreateAccessEventRequest,
} from '../../../shared/contracts/accessEvents';
import { ActorRequest } from '../../auth/sessionAuth';
import { invalidRequest } from '../../errors';
import { AccessEventService } from './service';
import { AccessEventSyncService } from './syncService';

const actorFrom = (request: Request) => (request as ActorRequest).actor;

const parseLimit = (value: unknown) => {
  if (value === undefined) return 100;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 500) {
    throw invalidRequest('limit deve ser um inteiro entre 1 e 500.');
  }
  return parsed;
};

const parseCreateRequest = (body: unknown): CreateAccessEventRequest => {
  const value = body as Partial<CreateAccessEventRequest> | null;
  if (!value || !value.direction || !ACCESS_DIRECTIONS.includes(value.direction)) {
    throw invalidRequest('direction deve ser ENTRY ou EXIT.');
  }
  if (typeof value.turnstileId !== 'string' || value.turnstileId.trim().length === 0 || value.turnstileId.length > 80) {
    throw invalidRequest('turnstileId é obrigatório e deve ter até 80 caracteres.');
  }
  if (typeof value.turnstileName !== 'string' || value.turnstileName.trim().length === 0 || value.turnstileName.length > 160) {
    throw invalidRequest('turnstileName é obrigatório e deve ter até 160 caracteres.');
  }
  if (!value.status || !ACCESS_STATUSES.includes(value.status)) {
    throw invalidRequest('status inválido.');
  }
  if (!value.method || !ACCESS_METHODS.includes(value.method)) {
    throw invalidRequest('method inválido.');
  }
  if (!['DELIVERED', 'PENDING'].includes(value.whatsappStatus ?? '')) {
    throw invalidRequest('whatsappStatus inválido.');
  }
  if (!['DELIVERED', 'PENDING'].includes(value.pushStatus ?? '')) {
    throw invalidRequest('pushStatus inválido.');
  }
  if (value.reason !== undefined && (typeof value.reason !== 'string' || value.reason.trim().length < 5 || value.reason.length > 500)) {
    throw invalidRequest('reason deve ter entre 5 e 500 caracteres.');
  }
  return value as CreateAccessEventRequest;
};

export const createAccessEventRouter = (
  service: AccessEventService,
  syncService: AccessEventSyncService,
) => {
  const router = Router();

  router.get('/students/:studentId/access-events', (request, response) => {
    response.json({
      data: service.listForStudent(
        actorFrom(request),
        request.params.studentId,
        parseLimit(request.query.limit),
      ),
    });
  });

  router.get('/access-events', (request, response) => {
    response.json({ data: service.listForSchool(actorFrom(request), parseLimit(request.query.limit)) });
  });

  router.get('/access-events/sync/status', (request, response) => {
    response.json({ data: syncService.status(actorFrom(request)) });
  });

  router.post('/access-events/sync/retry-conflicts', (request, response) => {
    response.json({ data: { requeued: syncService.retryConflicts(actorFrom(request)) } });
  });

  router.post('/students/:studentId/access-events', (request, response) => {
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
    response.status(result.created ? 201 : 200).json({ data: result.event });
  });

  return router;
};
