import express, { NextFunction, Request, Response } from 'express';
import { createSessionAuth } from './auth/sessionAuth';
import { AppDatabase } from './db';
import { ApiError } from './errors';
import { createJustificationRouter } from './modules/justifications/routes';
import { JustificationService } from './modules/justifications/service';
import { createAccessEventRouter } from './modules/accessEvents/routes';
import { AccessEventService } from './modules/accessEvents/service';
import { createAuthRouter } from './modules/auth/routes';
import { AuthService } from './modules/auth/service';

export interface AppOptions {
  /** @deprecated Mantido temporariamente para compatibilidade dos chamadores. */
  demoAuthEnabled?: boolean;
  now?: () => string;
}

export const createApp = (database: AppDatabase, options: AppOptions = {}) => {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '32kb' }));

  app.get('/api/health', (_request, response) => {
    response.json({ status: 'ok', persistence: 'sqlite' });
  });

  const authService = new AuthService(database, options.now);
  app.use('/api/v1', createAuthRouter(database, authService, options.now));
  app.use('/api/v1', createSessionAuth(database, options.now));
  app.use(
    '/api/v1',
    createJustificationRouter(new JustificationService(database, options.now)),
  );
  app.use(
    '/api/v1',
    createAccessEventRouter(new AccessEventService(database, options.now)),
  );

  app.use((_request, _response, next) => next(new ApiError(404, 'NOT_FOUND', 'Rota não encontrada.')));
  app.use((error: unknown, _request: Request, response: Response, _next: NextFunction) => {
    if (error instanceof ApiError) {
      response.status(error.status).json({ error: { code: error.code, message: error.message } });
      return;
    }
    console.error(error);
    response.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Erro interno inesperado.' },
    });
  });
  return app;
};
