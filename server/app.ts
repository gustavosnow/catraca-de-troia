import express, { NextFunction, Request, Response } from 'express';
import { createSessionAuth } from './auth/sessionAuth';
import { AppDatabase } from './db';
import { ApiError } from './errors';
import { createJustificationRouter } from './modules/justifications/routes';
import { JustificationService } from './modules/justifications/service';
import { createAccessEventRouter } from './modules/accessEvents/routes';
import { AccessEventService } from './modules/accessEvents/service';
import {
  AccessEventSyncReceiver,
  AccessEventSyncService,
  AccessEventSyncTransport,
} from './modules/accessEvents/syncService';
import { createAccessEventSyncReceiverRouter } from './modules/accessEvents/syncRoutes';
import { createAuthRouter } from './modules/auth/routes';
import { AuthService } from './modules/auth/service';
import { createCommunicationRouter } from './modules/communications/routes';
import { CommunicationService } from './modules/communications/service';
import { createLinkRequestRouter } from './modules/linkRequests/routes';
import { LinkRequestService } from './modules/linkRequests/service';
import { createAttachmentRouter } from './modules/attachments/routes';
import { AttachmentService } from './modules/attachments/service';
import { createAuditRouter } from './modules/audit/routes';
import { AuditService } from './modules/audit/service';

export interface AppOptions {
  /** @deprecated Mantido temporariamente para compatibilidade dos chamadores. */
  demoAuthEnabled?: boolean;
  now?: () => string;
  syncSharedSecret?: string;
  syncService?: AccessEventSyncService;
  corsOrigins?: string[];
}

export const createApp = (database: AppDatabase, options: AppOptions = {}) => {
  const app = express();
  app.disable('x-powered-by');
  const corsOrigins = options.corsOrigins ?? ['http://localhost', 'https://localhost'];
  app.use((request, response, next) => {
    response.set({
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'Referrer-Policy': 'no-referrer',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    });
    if (request.path.startsWith('/api/')) response.set('Cache-Control', 'no-store');
    const origin = request.header('Origin');
    if (origin && corsOrigins.includes(origin)) {
      response.set({
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Headers': 'Authorization, Content-Type, Idempotency-Key',
        'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
        Vary: 'Origin',
      });
    }
    if (request.method === 'OPTIONS') {
      response.sendStatus(origin && corsOrigins.includes(origin) ? 204 : 403);
      return;
    }
    next();
  });
  app.use(express.json({ limit: '32kb' }));

  app.get('/api/health', (_request, response) => {
    response.json({ status: 'ok', persistence: 'sqlite' });
  });

  if (options.syncSharedSecret) {
    app.use(
      '/api/v1',
      createAccessEventSyncReceiverRouter(
        new AccessEventSyncReceiver(database, options.now),
        options.syncSharedSecret,
      ),
    );
  }

  const authService = new AuthService(database, options.now);
  app.use('/api/v1', createAuthRouter(database, authService, options.now));
  app.use('/api/v1', createSessionAuth(database, options.now));
  app.use(
    '/api/v1',
    createJustificationRouter(new JustificationService(database, options.now)),
  );
  app.use(
    '/api/v1',
    createCommunicationRouter(new CommunicationService(database, options.now)),
  );
  app.use(
    '/api/v1',
    createLinkRequestRouter(new LinkRequestService(database, options.now)),
  );
  app.use(
    '/api/v1',
    createAttachmentRouter(new AttachmentService(database, options.now)),
  );
  app.use('/api/v1', createAuditRouter(new AuditService(database)));
  const disabledTransport: AccessEventSyncTransport = {
    send: async () => ({
      kind: 'retry',
      code: 'SYNC_NOT_CONFIGURED',
      message: 'Destino de sincronização não configurado.',
    }),
  };
  app.use(
    '/api/v1',
    createAccessEventRouter(
      new AccessEventService(database, options.now),
      options.syncService || new AccessEventSyncService(database, disabledTransport, options.now, false),
    ),
  );

  app.use((_request, _response, next) => next(new ApiError(404, 'NOT_FOUND', 'Rota não encontrada.')));
  app.use((error: unknown, _request: Request, response: Response, _next: NextFunction) => {
    if (error instanceof ApiError) {
      response.status(error.status).json({ error: { code: error.code, message: error.message } });
      return;
    }
    if ((error as { type?: string } | null)?.type === 'entity.too.large') {
      response.status(413).json({
        error: { code: 'PAYLOAD_TOO_LARGE', message: 'O anexo excede o limite de 2 MB.' },
      });
      return;
    }
    console.error(error);
    response.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Erro interno inesperado.' },
    });
  });
  return app;
};
