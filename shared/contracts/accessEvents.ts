import type { LinkedStudent } from './justifications';

export const ACCESS_DIRECTIONS = ['ENTRY', 'EXIT'] as const;
export type AccessDirectionRecord = (typeof ACCESS_DIRECTIONS)[number];

export const ACCESS_METHODS = ['FACIAL', 'MANUAL'] as const;
export type AccessMethodRecord = (typeof ACCESS_METHODS)[number];

export const ACCESS_STATUSES = ['AUTHORIZED', 'MANUAL_RELEASE'] as const;
export type AccessStatusRecord = (typeof ACCESS_STATUSES)[number];

export const ACCESS_EVENT_SOURCES = ['DEMO_SIMULATION', 'FACE_PROTOTYPE'] as const;
export type AccessEventSource = (typeof ACCESS_EVENT_SOURCES)[number];

export interface AccessEventRecord {
  id: string;
  schoolId: string;
  student: LinkedStudent;
  direction: AccessDirectionRecord;
  occurredAt: string;
  turnstile: {
    id: string;
    name: string;
  };
  status: AccessStatusRecord;
  method: AccessMethodRecord;
  createdById: string;
  source: AccessEventSource;
  reason?: string;
  notification: {
    whatsapp: 'DELIVERED' | 'PENDING';
    pushApp: 'DELIVERED' | 'PENDING';
  };
  /** Presente apenas em eventos do protótipo de reconhecimento facial (MC-036). */
  recognition?: {
    deviceId: string;
    matchScore: number;
    inferenceMs: number;
  };
}

export interface CreateAccessEventRequest {
  direction: AccessDirectionRecord;
  turnstileId: string;
  turnstileName: string;
  status: AccessStatusRecord;
  method: AccessMethodRecord;
  whatsappStatus: AccessEventRecord['notification']['whatsapp'];
  pushStatus: AccessEventRecord['notification']['pushApp'];
  reason?: string;
}
