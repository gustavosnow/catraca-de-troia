import express, { NextFunction, Request, Response } from 'express';
import { createDemoAuth } from './auth/demoAuth';
import { AppDatabase } from './db';
import { ApiError } from './errors';
import { createJustificationRouter } from './modules/justifications/routes';
import { JustificationService } from './modules/justifications/service';

export interface AppOptions {
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

  app.use('/api/v1', createDemoAuth(database, options.demoAuthEnabled ?? false));
  app.use(
    '/api/v1',
    createJustificationRouter(new JustificationService(database, options.now)),
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
