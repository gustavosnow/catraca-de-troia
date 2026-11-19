import type { AccessDirectionRecord, AccessEventRecord } from './accessEvents';

/**
 * Contrato do protótipo de reconhecimento facial (MC-036).
 * O agente de borda envia apenas o resultado da comparação: nunca imagem
 * ou vetor facial.
 */
export const RECOGNITION_RESULTS = ['MATCH', 'NO_MATCH'] as const;
export type RecognitionResult = (typeof RECOGNITION_RESULTS)[number];

export interface RecognitionRequest {
  /** Identificador único da leitura, gerado pelo agente; garante idempotência. */
  captureId: string;
  result: RecognitionResult;
  /** Obrigatório quando result = MATCH. */
  studentId?: string;
  /** Similaridade do melhor candidato (cosseno, 0 a 1). */
  matchScore: number;
  /** Tempo de detecção + reconhecimento, em milissegundos. */
  inferenceMs: number;
  /** Quantidade de quadros consecutivos que confirmaram o mesmo candidato. */
  framesConfirmed: number;
}

export const DENIAL_REASONS = [
  'UNKNOWN_FACE',
  'LOW_SCORE',
  'STUDENT_NOT_REGISTERED',
] as const;
export type DenialReason = (typeof DENIAL_REASONS)[number];

export type RecognitionDecision =
  | { decision: 'AUTHORIZED'; duplicate: boolean; event: AccessEventRecord }
  | { decision: 'DENIED'; reason: DenialReason; denialId: string };

export interface AccessDenialRecord {
  id: string;
  deviceId: string;
  turnstile: { id: string; name: string };
  direction: AccessDirectionRecord;
  reason: DenialReason;
  /** Somente quando o estudante foi identificado, mas não autorizado. */
  studentId?: string;
  matchScore: number;
  inferenceMs: number;
  occurredAt: string;
}

export interface AccessDeviceRecord {
  id: string;
  name: string;
  turnstile: { id: string; name: string };
  direction: AccessDirectionRecord;
  minScore: number;
  active: boolean;
  lastSeenAt?: string;
  /** Origem do vídeo usada quando o agente é iniciado pela API (índice da webcam ou URL). */
  cameraSource?: string;
}
