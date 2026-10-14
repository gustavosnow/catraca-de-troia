import { Request, Router } from 'express';
import { ActorRequest } from '../../auth/sessionAuth';
import { invalidRequest } from '../../errors';
import { AuditService } from './service';

const actorFrom = (request: Request) => (request as ActorRequest).actor;

export const createAuditRouter = (service: AuditService) => {
  const router = Router();
  router.get('/audit-log', (request, response) => {
    const rawLimit = request.query.limit;
    const limit = rawLimit === undefined ? 100 : Number(rawLimit);
    const aggregateType = typeof request.query.aggregateType === 'string'
      ? request.query.aggregateType.trim()
      : undefined;
    if (!Number.isInteger(limit) || limit < 1 || limit > 200
      || (aggregateType !== undefined && !/^[A-Z][A-Z0-9_]{0,79}$/.test(aggregateType))) {
      throw invalidRequest('Informe filtros de auditoria válidos.');
    }
    response.json({ data: service.list(actorFrom(request), limit, aggregateType) });
  });
  return router;
};
