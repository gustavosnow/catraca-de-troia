import { Request, Router } from 'express';
import {
  CreateSchoolNoticeRequest,
  NOTICE_CATEGORIES,
  NOTICE_PRIORITIES,
  UpdateSchoolNoticeRequest,
} from '../../../shared/contracts/communications';
import { ActorRequest } from '../../auth/sessionAuth';
import { invalidRequest } from '../../errors';
import { CommunicationService } from './service';

const actorFrom = (request: Request) => (request as ActorRequest).actor;

const parseNotice = (body: unknown, updating: boolean) => {
  const value = body as Partial<CreateSchoolNoticeRequest & UpdateSchoolNoticeRequest> | null;
  if (!value
    || typeof value.title !== 'string' || value.title.trim().length < 5 || value.title.length > 180
    || typeof value.authorLabel !== 'string' || value.authorLabel.trim().length < 2 || value.authorLabel.length > 120
    || typeof value.roleLabel !== 'string' || value.roleLabel.trim().length < 2 || value.roleLabel.length > 120
    || typeof value.summary !== 'string' || value.summary.trim().length < 5 || value.summary.length > 500
    || typeof value.content !== 'string' || value.content.trim().length < 10 || value.content.length > 5000
    || !value.category || !NOTICE_CATEGORIES.includes(value.category)
    || !value.priority || !NOTICE_PRIORITIES.includes(value.priority)
    || (value.attachmentName !== undefined && (typeof value.attachmentName !== 'string' || value.attachmentName.length > 255))) {
    throw invalidRequest('Dados do comunicado são inválidos ou excedem os limites permitidos.');
  }
  if (updating && (!Number.isInteger(value.expectedVersion) || (value.expectedVersion ?? 0) < 1)) {
    throw invalidRequest('expectedVersion deve ser um inteiro positivo.');
  }
  if (!updating && typeof value.notifyGuardians !== 'boolean') {
    throw invalidRequest('notifyGuardians deve ser booleano.');
  }
  return value;
};

export const createCommunicationRouter = (service: CommunicationService) => {
  const router = Router();

  router.get('/notices', (request, response) => {
    response.json({ data: service.listNotices(actorFrom(request)) });
  });
  router.post('/notices', (request, response) => {
    response.status(201).json({
      data: service.createNotice(actorFrom(request), parseNotice(request.body, false) as CreateSchoolNoticeRequest),
    });
  });
  router.put('/notices/:id', (request, response) => {
    response.json({
      data: service.updateNotice(actorFrom(request), request.params.id, parseNotice(request.body, true) as UpdateSchoolNoticeRequest),
    });
  });
  router.delete('/notices/:id', (request, response) => {
    service.deleteNotice(actorFrom(request), request.params.id);
    response.status(204).end();
  });
  router.post('/notices/:id/read', (request, response) => {
    service.markNoticeRead(actorFrom(request), request.params.id);
    response.status(204).end();
  });
  router.post('/notices/:id/broadcast', (request, response) => {
    const idempotencyKey = request.header('Idempotency-Key')?.trim();
    if (!idempotencyKey || idempotencyKey.length > 200) {
      throw invalidRequest('Informe Idempotency-Key com até 200 caracteres.');
    }
    response.json({ data: { recipients: service.broadcastNotice(actorFrom(request), request.params.id, idempotencyKey) } });
  });
  router.get('/notifications', (request, response) => {
    response.json({ data: service.listNotifications(actorFrom(request)) });
  });
  router.post('/notifications/read-all', (request, response) => {
    response.json({ data: { updated: service.markAllNotificationsRead(actorFrom(request)) } });
  });

  return router;
};

