import type { AccessEventRecord } from './accessEvents';

export const ACCESS_EVENT_SYNC_STATES = ['PENDING', 'PROCESSING', 'SYNCED', 'CONFLICT'] as const;
export type AccessEventSyncState = (typeof ACCESS_EVENT_SYNC_STATES)[number];

export interface AccessEventSyncPayload {
  sourceNodeId: string;
  sourceEventId: string;
  schoolId: string;
  studentId: string;
  direction: AccessEventRecord['direction'];
  occurredAt: string;
  turnstileId: string;
  turnstileName: string;
  status: AccessEventRecord['status'];
  method: AccessEventRecord['method'];
  createdById: string;
  source: AccessEventRecord['source'];
  whatsappStatus: AccessEventRecord['notification']['whatsapp'];
  pushStatus: AccessEventRecord['notification']['pushApp'];
  reason?: string;
}

export interface AccessEventSyncReceipt {
  eventId: string;
  result: 'CREATED' | 'ALREADY_SYNCED';
}

export interface AccessEventSyncStatus {
  pending: number;
  processing: number;
  synced: number;
  conflicts: number;
  lastSyncedAt?: string;
  nextAttemptAt?: string;
}

