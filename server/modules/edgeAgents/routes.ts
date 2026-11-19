import { NextFunction, Request, Response, Router } from 'express';
import type { ActorRequest } from '../../auth/sessionAuth';
import { EdgeAgentService } from './service';

type Handler = (request: Request, response: Response) => unknown;

/** Encaminha erros de handlers assíncronos ao tratador central (Express 4 não faz isso). */
const handle = (handler: Handler) => (request: Request, response: Response, next: NextFunction) => {
  Promise.resolve()
    .then(() => handler(request, response))
    .catch(next);
};

const actorOf = (request: Request) => (request as ActorRequest).actor;

/**
 * Comandos do painel para os agentes de borda (MC-037). Exigem sessão escolar;
 * cadastro facial exige Coordenação ou Direção (ver EdgeAgentService).
 */
export const createEdgeAgentRouter = (service: EdgeAgentService) => {
  const router = Router();

  router.get('/edge-agents', handle((request, response) => {
    response.json({ data: service.getStatus(actorOf(request)) });
  }));

  router.post('/edge-agents/recognition/:deviceId/start', handle((request, response) => {
    response.status(201).json({ data: service.startRecognition(actorOf(request), request.params.deviceId) });
  }));

  router.post('/edge-agents/recognition/:deviceId/stop', handle((request, response) => {
    response.json({ data: service.stopRecognition(actorOf(request), request.params.deviceId) });
  }));

  router.patch('/access-devices/:deviceId/camera', handle((request, response) => {
    response.json({
      data: service.setCameraSource(actorOf(request), request.params.deviceId, request.body?.cameraSource),
    });
  }));

  router.get('/face-enrollments', handle(async (request, response) => {
    response.json({ data: await service.listEnrollments(actorOf(request)) });
  }));

  router.post('/face-enrollments', handle((request, response) => {
    response.status(201).json({ data: service.startEnrollment(actorOf(request), request.body) });
  }));

  router.post('/face-enrollments/current/cancel', handle((request, response) => {
    response.json({ data: service.cancelEnrollment(actorOf(request)) });
  }));

  router.delete('/face-enrollments/:studentId', handle(async (request, response) => {
    response.json({ data: await service.removeEnrollment(actorOf(request), request.params.studentId) });
  }));

  return router;
};
