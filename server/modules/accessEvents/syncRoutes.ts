import { timingSafeEqual } from 'node:crypto';
import { Request, Router } from 'express';
import type { AccessEventSyncPayload } from '../../../shared/contracts/accessEventSync';
import { invalidRequest, unauthorized } from '../../errors';
import { AccessEventSyncReceiver } from './syncService';

const isValidToken = (provided: string | undefined, expected: string) => {
  if (!provided) return false;
  const left = Buffer.from(provided);
  const right = Buffer.from(expected);
  return left.length === right.length && timingSafeEqual(left, right);
};

const parsePayload = (body: unknown): AccessEventSyncPayload => {
  const value = body as Partial<AccessEventSyncPayload> | null;
  const requiredStrings: Array<keyof AccessEventSyncPayload> = [
    'sourceNodeId', 'sourceEventId', 'schoolId', 'studentId', 'occurredAt',
    'turnstileId', 'turnstileName', 'createdById',
  ];
  if (!value || requiredStrings.some((field) =>
    typeof value[field] !== 'string' || String(value[field]).trim().length === 0
  )) throw invalidRequest('Payload de sincronização incompleto.');
  if (String(value.sourceNodeId).length > 120
    || String(value.sourceEventId).length > 200
    || String(value.schoolId).length > 120
    || String(value.studentId).length > 120
    || String(value.turnstileId).length > 80
    || String(value.turnstileName).length > 160
    || String(value.createdById).length > 120
    || (value.reason !== undefined && (
      typeof value.reason !== 'string' || value.reason.length > 500
    ))) {
    throw invalidRequest('Payload de sincronização excede os limites permitidos.');
  }
  if (!['ENTRY', 'EXIT'].includes(value.direction || '')
    || !['AUTHORIZED', 'MANUAL_RELEASE'].includes(value.status || '')
    || !['FACIAL', 'MANUAL'].includes(value.method || '')
    || value.source !== 'DEMO_SIMULATION'
    || !['DELIVERED', 'PENDING'].includes(value.whatsappStatus || '')
    || !['DELIVERED', 'PENDING'].includes(value.pushStatus || '')
    || Number.isNaN(Date.parse(value.occurredAt || ''))) {
    throw invalidRequest('Payload de sincronização contém valores inválidos.');
  }
  return value as AccessEventSyncPayload;
};

export const createAccessEventSyncReceiverRouter = (
  receiver: AccessEventSyncReceiver,
  sharedSecret: string,
) => {
  const router = Router();
  router.post('/sync/access-events', (request: Request, response) => {
    if (!isValidToken(request.header('X-Sync-Token'), sharedSecret)) {
      throw unauthorized('Credencial de sincronização inválida.');
    }
    const receipt = receiver.ingest(parsePayload(request.body));
    response.status(receipt.result === 'CREATED' ? 201 : 200).json({ data: receipt });
  });
  return router;
};
