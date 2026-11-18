import { createHash, randomBytes, randomUUID } from 'node:crypto';
import type {
  AccessDenialRecord,
  AccessDeviceRecord,
  DenialReason,
  RecognitionDecision,
  RecognitionRequest,
} from '../../../shared/contracts/accessDevices';
import type { AccessDirectionRecord } from '../../../shared/contracts/accessEvents';
import type { DemoActor } from '../../../shared/contracts/justifications';
import type { AppDatabase } from '../../db';
import { forbidden, invalidRequest, unauthorized } from '../../errors';
import { AccessEventService } from '../accessEvents/service';

/**
 * Protótipo de reconhecimento facial (MC-036).
 *
 * O agente de borda (edge/) identifica o rosto e envia apenas o resultado.
 * Aqui a API decide a autorização: autentica a catraca, aplica o limiar
 * mínimo configurado para ela, confere se o estudante pertence à escola e
 * registra a passagem ou a negação. Nenhuma imagem ou vetor facial chega à API.
 */

export interface AccessDeviceRow {
  id: string;
  school_id: string;
  name: string;
  turnstile_id: string;
  turnstile_name: string;
  direction: AccessDirectionRecord;
  operator_user_id: string;
  min_score: number;
  token_hash: string;
  active: 0 | 1;
  created_at: string;
  last_seen_at: string | null;
}

interface AccessDenialRow {
  id: string;
  device_id: string;
  turnstile_id: string;
  turnstile_name: string;
  direction: AccessDirectionRecord;
  reason: DenialReason;
  student_id: string | null;
  match_score: number;
  inference_ms: number;
  occurred_at: string;
}

export const hashDeviceToken = (token: string) =>
  createHash('sha256').update(token).digest('hex');

const mapDevice = (row: AccessDeviceRow): AccessDeviceRecord => ({
  id: row.id,
  name: row.name,
  turnstile: { id: row.turnstile_id, name: row.turnstile_name },
  direction: row.direction,
  minScore: row.min_score,
  active: row.active === 1,
  lastSeenAt: row.last_seen_at ?? undefined,
});

const mapDenial = (row: AccessDenialRow): AccessDenialRecord => ({
  id: row.id,
  deviceId: row.device_id,
  turnstile: { id: row.turnstile_id, name: row.turnstile_name },
  direction: row.direction,
  reason: row.reason,
  studentId: row.student_id ?? undefined,
  matchScore: row.match_score,
  inferenceMs: row.inference_ms,
  occurredAt: row.occurred_at,
});

export class AccessDeviceService {
  private readonly events: AccessEventService;

  constructor(
    private readonly database: AppDatabase,
    private readonly now: () => string = () => new Date().toISOString(),
    /** Intervalo em que nova leitura do mesmo estudante na mesma catraca é tratada como repetição. */
    private readonly cooldownSeconds = 15,
  ) {
    this.events = new AccessEventService(database, now);
  }

  /** Cadastra uma catraca e devolve o token uma única vez; somente o hash é armazenado. */
  register(params: {
    id: string;
    schoolId: string;
    name: string;
    turnstileId: string;
    turnstileName: string;
    direction: AccessDirectionRecord;
    operatorUserId: string;
    minScore: number;
  }): { device: AccessDeviceRecord; token: string } {
    if (!/^[A-Za-z0-9_-]{3,60}$/.test(params.id)) {
      throw invalidRequest('O identificador da catraca deve ter de 3 a 60 caracteres (letras, números, - ou _).');
    }
    if (!(params.minScore > 0 && params.minScore < 1)) {
      throw invalidRequest('O limiar mínimo deve estar entre 0 e 1.');
    }
    const operator = this.database.prepare(`
      SELECT role, account_status FROM users WHERE id = ? AND school_id = ?
    `).get(params.operatorUserId, params.schoolId) as { role: string; account_status: string } | undefined;
    if (!operator || operator.role === 'GUARDIAN' || operator.account_status !== 'ACTIVE') {
      throw invalidRequest('O operador responsável deve ser uma conta escolar ativa.');
    }
    const token = `dev_${randomBytes(32).toString('base64url')}`;
    this.database.prepare(`
      INSERT INTO access_devices (
        id, school_id, name, turnstile_id, turnstile_name, direction,
        operator_user_id, min_score, token_hash, active, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        turnstile_id = excluded.turnstile_id,
        turnstile_name = excluded.turnstile_name,
        direction = excluded.direction,
        operator_user_id = excluded.operator_user_id,
        min_score = excluded.min_score,
        token_hash = excluded.token_hash,
        active = 1
    `).run(
      params.id, params.schoolId, params.name.trim(), params.turnstileId.trim(),
      params.turnstileName.trim(), params.direction, params.operatorUserId,
      params.minScore, hashDeviceToken(token), this.now(),
    );
    return { device: mapDevice(this.getRow(params.id)), token };
  }

  private getRow(id: string) {
    return this.database.prepare('SELECT * FROM access_devices WHERE id = ?').get(id) as AccessDeviceRow;
  }

  authenticate(token: string | undefined): AccessDeviceRow {
    if (!token || token.length > 200) throw unauthorized('Credencial da catraca ausente.');
    const row = this.database.prepare(`
      SELECT device.* FROM access_devices device
      JOIN users operator ON operator.id = device.operator_user_id
      WHERE device.token_hash = ? AND device.active = 1 AND operator.account_status = 'ACTIVE'
    `).get(hashDeviceToken(token)) as AccessDeviceRow | undefined;
    if (!row) throw unauthorized('Credencial da catraca inválida ou desativada.');
    return row;
  }

  recognize(device: AccessDeviceRow, request: RecognitionRequest): RecognitionDecision {
    return this.database.transaction((): RecognitionDecision => {
      const timestamp = this.now();
      this.database.prepare('UPDATE access_devices SET last_seen_at = ? WHERE id = ?')
        .run(timestamp, device.id);

      // Reenvio da mesma leitura: devolve a decisão já tomada.
      const previousEvent = this.events.findDeviceEvent(device.operator_user_id, device.id, request.captureId);
      if (previousEvent) return { decision: 'AUTHORIZED', duplicate: true, event: previousEvent };
      const previousDenial = this.database.prepare(`
        SELECT id, reason FROM access_denials WHERE device_id = ? AND capture_id = ?
      `).get(device.id, request.captureId) as { id: string; reason: DenialReason } | undefined;
      if (previousDenial) {
        return { decision: 'DENIED', reason: previousDenial.reason, denialId: previousDenial.id };
      }

      const deny = (reason: DenialReason, studentId: string | null = null): RecognitionDecision => {
        const id = randomUUID();
        this.database.prepare(`
          INSERT INTO access_denials (
            id, school_id, device_id, capture_id, turnstile_id, turnstile_name,
            direction, reason, student_id, match_score, inference_ms, occurred_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          id, device.school_id, device.id, request.captureId, device.turnstile_id,
          device.turnstile_name, device.direction, reason, studentId,
          request.matchScore, request.inferenceMs, timestamp,
        );
        this.database.prepare(`
          INSERT INTO audit_log (
            id, school_id, actor_id, aggregate_type, aggregate_id, action,
            previous_state, new_state, occurred_at
          ) VALUES (?, ?, ?, 'ACCESS_DENIAL', ?, 'DENIED', NULL, ?, ?)
        `).run(randomUUID(), device.school_id, device.operator_user_id, id, `${reason}:${device.id}`, timestamp);
        return { decision: 'DENIED', reason, denialId: id };
      };

      if (request.result === 'NO_MATCH') return deny('UNKNOWN_FACE');
      // O limiar da catraca prevalece sobre o do agente.
      if (request.matchScore < device.min_score) return deny('LOW_SCORE');

      const student = this.database.prepare(`
        SELECT id FROM students WHERE id = ? AND school_id = ?
      `).get(request.studentId, device.school_id) as { id: string } | undefined;
      if (!student) return deny('STUDENT_NOT_REGISTERED');

      const since = new Date(Date.parse(timestamp) - this.cooldownSeconds * 1000).toISOString();
      const recent = this.events.findRecentDeviceEvent(device.id, student.id, since);
      if (recent) return { decision: 'AUTHORIZED', duplicate: true, event: recent };

      const event = this.events.recordFromDevice({
        schoolId: device.school_id,
        studentId: student.id,
        operatorUserId: device.operator_user_id,
        deviceId: device.id,
        captureId: request.captureId,
        direction: device.direction,
        turnstileId: device.turnstile_id,
        turnstileName: device.turnstile_name,
        matchScore: request.matchScore,
        inferenceMs: request.inferenceMs,
      });
      return { decision: 'AUTHORIZED', duplicate: false, event };
    })();
  }

  listDevices(actor: DemoActor): AccessDeviceRecord[] {
    if (actor.role === 'GUARDIAN') throw forbidden();
    const rows = this.database.prepare(`
      SELECT * FROM access_devices WHERE school_id = ? ORDER BY id
    `).all(actor.schoolId) as AccessDeviceRow[];
    return rows.map(mapDevice);
  }

  listDenials(actor: DemoActor, limit = 50): AccessDenialRecord[] {
    if (actor.role === 'GUARDIAN') throw forbidden();
    const rows = this.database.prepare(`
      SELECT id, device_id, turnstile_id, turnstile_name, direction, reason,
        student_id, match_score, inference_ms, occurred_at
      FROM access_denials
      WHERE school_id = ?
      ORDER BY occurred_at DESC, id DESC
      LIMIT ?
    `).all(actor.schoolId, limit) as AccessDenialRow[];
    return rows.map(mapDenial);
  }
}
