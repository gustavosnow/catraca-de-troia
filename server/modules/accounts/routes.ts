import { Router } from 'express';
import type {
  AccountStatus,
  RevokeAccountSessionsRequest,
  UpdateAccountStatusRequest,
} from '../../../shared/contracts/accountAdministration';
import type { ActorRequest } from '../../auth/sessionAuth';
import { invalidRequest } from '../../errors';
import { AccountAdministrationService } from './service';

const parseReason = (value: unknown) => {
  if (typeof value !== 'string' || value.trim().length < 5 || value.trim().length > 500) {
    throw invalidRequest('Informe um motivo entre 5 e 500 caracteres.');
  }
  return value.trim();
};

const parseStatus = (body: unknown): UpdateAccountStatusRequest => {
  const value = body as Partial<UpdateAccountStatusRequest> | null;
  if (!value || (value.status !== 'ACTIVE' && value.status !== 'BLOCKED')) {
    throw invalidRequest('Informe um estado de conta válido.');
  }
  if (!Number.isInteger(value.expectedVersion) || (value.expectedVersion ?? 0) < 1) {
    throw invalidRequest('Informe a versão atual da conta.');
  }
  return {
    status: value.status as AccountStatus,
    expectedVersion: value.expectedVersion!,
    reason: parseReason(value.reason),
  };
};

export const createAccountAdministrationRouter = (service: AccountAdministrationService) => {
  const router = Router();
  router.get('/accounts', (request, response) => {
    response.json({ data: service.list((request as ActorRequest).actor) });
  });
  router.patch('/accounts/:accountId/status', (request, response) => {
    response.json({ data: service.updateStatus(
      (request as unknown as ActorRequest).actor,
      request.params.accountId,
      parseStatus(request.body),
    ) });
  });
  router.post('/accounts/:accountId/revoke-sessions', (request, response) => {
    const value = request.body as Partial<RevokeAccountSessionsRequest> | null;
    response.json({ data: { revoked: service.revokeSessions(
      (request as unknown as ActorRequest).actor,
      request.params.accountId,
      parseReason(value?.reason),
    ) } });
  });
  return router;
};
