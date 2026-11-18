import { Request, Router } from 'express';
import {
  RECOGNITION_RESULTS,
  type RecognitionRequest,
} from '../../../shared/contracts/accessDevices';
import type { ActorRequest } from '../../auth/sessionAuth';
import { invalidRequest } from '../../errors';
import { AccessDeviceService } from './service';

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

export const parseRecognitionRequest = (body: unknown): RecognitionRequest => {
  const value = body as Partial<RecognitionRequest> | null;
  if (!value || typeof value.captureId !== 'string' || !/^[A-Za-z0-9:._-]{8,120}$/.test(value.captureId)) {
    throw invalidRequest('captureId deve ter de 8 a 120 caracteres (letras, números, :, ., _ ou -).');
  }
  if (!value.result || !RECOGNITION_RESULTS.includes(value.result)) {
    throw invalidRequest('result deve ser MATCH ou NO_MATCH.');
  }
  if (value.result === 'MATCH'
    && (typeof value.studentId !== 'string' || value.studentId.trim().length === 0 || value.studentId.length > 120)) {
    throw invalidRequest('studentId é obrigatório quando result = MATCH.');
  }
  if (!isFiniteNumber(value.matchScore) || value.matchScore < -1 || value.matchScore > 1) {
    throw invalidRequest('matchScore deve ser um número entre -1 e 1.');
  }
  if (!isFiniteNumber(value.inferenceMs) || value.inferenceMs < 0 || value.inferenceMs > 60_000) {
    throw invalidRequest('inferenceMs deve ser um número entre 0 e 60000.');
  }
  if (!Number.isInteger(value.framesConfirmed) || (value.framesConfirmed as number) < 1
    || (value.framesConfirmed as number) > 60) {
    throw invalidRequest('framesConfirmed deve ser um inteiro entre 1 e 60.');
  }
  return {
    captureId: value.captureId,
    result: value.result,
    studentId: value.result === 'MATCH' ? value.studentId!.trim() : undefined,
    matchScore: value.matchScore,
    inferenceMs: value.inferenceMs,
    framesConfirmed: value.framesConfirmed as number,
  };
};

/** Rota usada pelo agente da catraca; autenticada por token do dispositivo, não por sessão. */
export const createDeviceRecognitionRouter = (service: AccessDeviceService) => {
  const router = Router();
  router.post('/device/recognitions', (request: Request, response) => {
    const device = service.authenticate(request.header('X-Device-Token')?.trim());
    const decision = service.recognize(device, parseRecognitionRequest(request.body));
    const status = decision.decision === 'AUTHORIZED' && !decision.duplicate ? 201 : 200;
    response.status(status).json({ data: decision });
  });
  return router;
};

const parseLimit = (value: unknown) => {
  if (value === undefined) return 50;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 200) {
    throw invalidRequest('limit deve ser um inteiro entre 1 e 200.');
  }
  return parsed;
};

/** Consultas do painel escolar; exigem sessão de perfil escolar. */
export const createAccessDeviceAdminRouter = (service: AccessDeviceService) => {
  const router = Router();
  router.get('/access-devices', (request, response) => {
    response.json({ data: service.listDevices((request as ActorRequest).actor) });
  });
  router.get('/access-denials', (request, response) => {
    response.json({
      data: service.listDenials((request as ActorRequest).actor, parseLimit(request.query.limit)),
    });
  });
  return router;
};
