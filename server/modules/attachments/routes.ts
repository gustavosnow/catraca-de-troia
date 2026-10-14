import express, { Request, Router } from 'express';
import {
  ATTACHMENT_CONTENT_TYPES,
  AttachmentContentType,
  MAX_ATTACHMENT_BYTES,
} from '../../../shared/contracts/attachments';
import { ActorRequest } from '../../auth/sessionAuth';
import { invalidRequest } from '../../errors';
import { AttachmentService } from './service';

const actorFrom = (request: Request) => (request as ActorRequest).actor;

export const createAttachmentRouter = (service: AttachmentService) => {
  const router = Router();
  router.post(
    '/attachments',
    express.raw({ type: [...ATTACHMENT_CONTENT_TYPES], limit: MAX_ATTACHMENT_BYTES }),
    (request, response) => {
      const encodedName = request.header('X-File-Name');
      const contentType = request.header('Content-Type')?.split(';')[0] as AttachmentContentType | undefined;
      if (!encodedName || encodedName.length > 540 || !contentType || !ATTACHMENT_CONTENT_TYPES.includes(contentType)) {
        throw invalidRequest('Informe nome e tipo permitido para o anexo.');
      }
      let fileName: string;
      try {
        fileName = decodeURIComponent(encodedName);
      } catch {
        throw invalidRequest('Nome de arquivo inválido.');
      }
      if (!Buffer.isBuffer(request.body)) throw invalidRequest('Conteúdo do anexo ausente.');
      response.status(201).json({
        data: service.upload(actorFrom(request), fileName, contentType, request.body),
      });
    },
  );
  router.get('/attachments/:id', (request, response) => {
    const result = service.download(actorFrom(request), request.params.id);
    response.setHeader('Content-Type', result.metadata.contentType);
    response.setHeader('Content-Length', result.metadata.sizeBytes);
    response.setHeader(
      'Content-Disposition',
      `attachment; filename*=UTF-8''${encodeURIComponent(result.metadata.fileName)}`,
    );
    response.send(result.content);
  });
  router.delete('/attachments/:id', (request, response) => {
    service.discard(actorFrom(request), request.params.id);
    response.status(204).end();
  });
  return router;
};
