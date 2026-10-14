import { Router } from 'express';
import type { LoginRequest } from '../../../shared/contracts/auth';
import type { ActorRequest } from '../../auth/sessionAuth';
import { createSessionAuth } from '../../auth/sessionAuth';
import type { AppDatabase } from '../../db';
import { invalidRequest } from '../../errors';
import { AuthService } from './service';

const parseLogin = (body: unknown): LoginRequest => {
  const value = body as Partial<LoginRequest> | null;
  if (!value || typeof value.identifier !== 'string' || value.identifier.trim().length < 3 || value.identifier.length > 254) {
    throw invalidRequest('Informe um identificador válido.');
  }
  if (typeof value.password !== 'string' || value.password.length < 8 || value.password.length > 128) {
    throw invalidRequest('A senha deve ter entre 8 e 128 caracteres.');
  }
  return {
    identifier: value.identifier,
    password: value.password,
    rememberMe: value.rememberMe === true,
  };
};

export const createAuthRouter = (
  database: AppDatabase,
  service: AuthService,
  now?: () => string,
) => {
  const router = Router();
  const authenticate = createSessionAuth(database, now);

  router.use((_request, response, next) => {
    response.set('Cache-Control', 'no-store');
    next();
  });

  router.post('/auth/login', (request, response) => {
    response.json({ data: service.login(parseLogin(request.body)) });
  });
  router.get('/auth/session', authenticate, (request, response) => {
    response.json({ data: service.currentUser((request as ActorRequest).actor.id) });
  });
  router.post('/auth/logout', authenticate, (request, response) => {
    service.logout(request as ActorRequest);
    response.status(204).end();
  });

  return router;
};
