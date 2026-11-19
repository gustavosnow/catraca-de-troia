import { createHash, randomUUID } from 'node:crypto';
import type {
  AccessEventOverview,
  AccessEventRecord,
  AccessEventSource,
  CreateAccessEventRequest,
} from '../../../shared/contracts/accessEvents';
import type { AccessEventSyncPayload } from '../../../shared/contracts/accessEventSync';
import type { DemoActor } from '../../../shared/contracts/justifications';
import type { AppDatabase } from '../../db';
import { conflict, forbidden, invalidRequest, notFound } from '../../errors';
import { schoolDayStart } from '../../schoolDay';
import { notifyStudentGuardians } from '../communications/notificationWriter';

interface AccessEventRow {
  id: string;
  school_id: string;
  student_id: string;
  student_name: string;
  enrollment: string;
  direction: AccessEventRecord['direction'];
  occurred_at: string;
  turnstile_id: string;
  turnstile_name: string;
  status: AccessEventRecord['status'];
  method: AccessEventRecord['method'];
  created_by: string;
  source: AccessEventRecord['source'];
  whatsapp_status: AccessEventRecord['notification']['whatsapp'];
  push_status: AccessEventRecord['notification']['pushApp'];
  request_hash: string;
  idempotency_key: string;
  reason: string | null;
  origin_node_id: string;
  origin_event_id: string;
  sync_payload_hash: string;
  device_id: string | null;
  match_score: number | null;
  inference_ms: number | null;
}

export const hashSyncPayload = (payload: AccessEventSyncPayload) => createHash('sha256')
  .update(JSON.stringify(payload))
  .digest('hex');

const selectEvent = `
  SELECT event.*, student.name AS student_name, student.enrollment
  FROM access_events event
  JOIN students student ON student.id = event.student_id
`;

export const isDemoCapture = (captureId: string) =>
  /^carga-[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/.test(captureId);
const hexDigit = '[0-9a-f]';
const legacyDemoGlob = `carga-${[8, 4, 4, 4, 12].map((size) => hexDigit.repeat(size)).join('-')}`;

// As primeiras cargas usavam as mesmas origens das operações manuais e do protótipo.
const eventSource = (row: Pick<AccessEventRow, 'source' | 'idempotency_key'>): AccessEventSource =>
  isDemoCapture(row.idempotency_key.replace(/^device:[^:]+:/, '')) ? 'DEMO_SIMULATION' : row.source;

const mapEvent = (row: AccessEventRow): AccessEventRecord => ({
  id: row.id,
  schoolId: row.school_id,
  student: { id: row.student_id, name: row.student_name, enrollment: row.enrollment },
  direction: row.direction,
  occurredAt: row.occurred_at,
  turnstile: { id: row.turnstile_id, name: row.turnstile_name },
  status: row.status,
  method: row.method,
  createdById: row.created_by,
  source: eventSource(row),
  reason: row.reason ?? undefined,
  notification: { whatsapp: row.whatsapp_status, pushApp: row.push_status },
  ...(eventSource(row) === 'FACE_PROTOTYPE' && row.device_id && row.match_score !== null && row.inference_ms !== null
    ? {
        recognition: {
          deviceId: row.device_id,
          matchScore: row.match_score,
          inferenceMs: row.inference_ms,
        },
      }
    : {}),
});

const hashRequest = (value: unknown) => createHash('sha256')
  .update(JSON.stringify(value))
  .digest('hex');

export class AccessEventService {
  constructor(
    private readonly database: AppDatabase,
    private readonly now: () => string = () => new Date().toISOString(),
    private readonly nodeId = process.env.SYNC_NODE_ID || 'school-local-demo',
  ) {}

  private ensureAccessibleStudent(actor: DemoActor, studentId: string) {
    const student = this.database.prepare(`
      SELECT id FROM students WHERE id = ? AND school_id = ?
    `).get(studentId, actor.schoolId);
    if (!student) throw notFound('Estudante não encontrado.');

    if (actor.role === 'GUARDIAN') {
      const link = this.database.prepare(`
        SELECT 1 FROM guardian_student_links
        WHERE guardian_user_id = ? AND student_id = ? AND status = 'APPROVED'
      `).get(actor.id, studentId);
      if (!link) throw notFound('Estudante não encontrado.');
    }
  }

  listForStudent(actor: DemoActor, studentId: string, limit = 100): AccessEventRecord[] {
    this.ensureAccessibleStudent(actor, studentId);
    const rows = this.database.prepare(`
      ${selectEvent}
      WHERE event.school_id = ? AND event.student_id = ?
      ORDER BY event.occurred_at DESC, event.id DESC
      LIMIT ?
    `).all(actor.schoolId, studentId, limit) as AccessEventRow[];
    return rows.map(mapEvent);
  }

  listForSchool(actor: DemoActor, limit = 100): AccessEventRecord[] {
    if (actor.role === 'GUARDIAN') throw forbidden();
    const rows = this.database.prepare(`
      ${selectEvent}
      WHERE event.school_id = ?
      ORDER BY event.occurred_at DESC, event.id DESC
      LIMIT ?
    `).all(actor.schoolId, limit) as AccessEventRow[];
    return rows.map(mapEvent);
  }

  overviewForSchool(actor: DemoActor): AccessEventOverview {
    if (actor.role === 'GUARDIAN') throw forbidden();
    const now = this.now();
    const rows = this.database.prepare(`
      WITH day_events AS (
        SELECT direction, turnstile_id, source, idempotency_key,
          ROW_NUMBER() OVER (PARTITION BY student_id ORDER BY occurred_at DESC, id DESC) AS student_order
        FROM access_events
        WHERE school_id = ? AND occurred_at >= ? AND occurred_at <= ?
      )
      SELECT turnstile_id AS id, COUNT(*) AS passes,
        SUM(direction = 'ENTRY') AS entries,
        SUM(direction = 'ENTRY' AND student_order = 1) AS onCampus,
        MAX(source = 'DEMO_SIMULATION' OR idempotency_key GLOB ?
          OR idempotency_key GLOB ?) AS hasDemoRecords
      FROM day_events
      GROUP BY turnstile_id
      ORDER BY turnstile_id
    `).all(actor.schoolId, schoolDayStart(now), now, legacyDemoGlob, `device:*:${legacyDemoGlob}`) as {
      id: string; passes: number; entries: number; onCampus: number; hasDemoRecords: number;
    }[];
    return {
      entries: rows.reduce((sum, row) => sum + row.entries, 0),
      exits: rows.reduce((sum, row) => sum + row.passes - row.entries, 0),
      onCampus: rows.reduce((sum, row) => sum + row.onCampus, 0),
      hasDemoRecords: rows.some((row) => Boolean(row.hasDemoRecords)),
      turnstiles: rows.map(({ id, passes }) => ({ id, passes })),
    };
  }

  private findRow(createdById: string, idempotencyKey: string) {
    return this.database.prepare(`
      ${selectEvent}
      WHERE event.created_by = ? AND event.idempotency_key = ?
    `).get(createdById, idempotencyKey) as AccessEventRow | undefined;
  }

  create(
    actor: DemoActor,
    studentId: string,
    request: CreateAccessEventRequest,
    idempotencyKey: string,
    source: 'ASSISTED_PASSAGE' | 'DEMO_SIMULATION' = 'ASSISTED_PASSAGE',
  ): { event: AccessEventRecord; created: boolean } {
    if (actor.role === 'GUARDIAN') {
      throw forbidden('Eventos de acesso só podem ser registrados por um ator escolar.');
    }
    this.ensureAccessibleStudent(actor, studentId);
    // Passagem facial só entra pela rota da câmera (token do dispositivo).
    if (request.method !== 'MANUAL' || request.status !== 'MANUAL_RELEASE' || !request.reason?.trim()) {
      throw invalidRequest('Pelo painel, registre somente passagem assistida, com motivo.');
    }
    const turnstile = this.database.prepare(`
      SELECT turnstile_id, turnstile_name FROM access_devices
      WHERE school_id = ? AND turnstile_id = ? AND active = 1
      LIMIT 1
    `).get(actor.schoolId, request.turnstileId) as { turnstile_id: string; turnstile_name: string } | undefined;
    if (!turnstile) throw invalidRequest('Selecione uma catraca cadastrada e ativa.');
    // Nome da catraca vem do cadastro; o status de entrega nunca vem do cliente.
    const normalized: CreateAccessEventRequest = {
      ...request,
      turnstileName: turnstile.turnstile_name,
      whatsappStatus: 'PENDING',
      pushStatus: 'PENDING',
      reason: request.reason.trim(),
    };

    const requestHash = hashRequest({ studentId, ...request });
    const existing = this.findRow(actor.id, idempotencyKey);
    if (existing) {
      if (existing.request_hash !== requestHash) {
        throw conflict('IDEMPOTENCY_CONFLICT', 'A chave de idempotência já foi usada com outro evento.');
      }
      return { event: mapEvent(existing), created: false };
    }

    const event = this.database.transaction(() => {
      const sequence = this.checkSequence(actor.schoolId, studentId, normalized.direction);
      if (!sequence.allowed) {
        throw conflict(
          'SEQUENCE_CONFLICT',
          sequence.expectedDirection === 'EXIT'
            ? 'Este estudante já tem entrada registrada hoje. Registre a saída antes de uma nova entrada.'
            : 'Este estudante não tem entrada em aberto hoje. Registre a entrada antes da saída.',
        );
      }
      return this.insertEvent({
        schoolId: actor.schoolId,
        studentId,
        createdById: actor.id,
        request: normalized,
        idempotencyKey,
        requestHash,
        source,
      });
    })();
    return { event, created: true };
  }

  /**
   * Sequência obrigatória por estudante no dia letivo: a primeira passagem é
   * entrada e depois alterna (entrada → saída → entrada). Vale para câmera e
   * para passagem assistida; eventos recebidos por sincronização não passam aqui.
   */
  checkSequence(schoolId: string, studentId: string, direction: AccessEventRecord['direction']) {
    const since = schoolDayStart(this.now());
    const last = this.database.prepare(`
      ${selectEvent}
      WHERE event.school_id = ? AND event.student_id = ? AND event.occurred_at >= ?
      ORDER BY event.occurred_at DESC, event.id DESC
      LIMIT 1
    `).get(schoolId, studentId, since) as AccessEventRow | undefined;
    const expectedDirection: AccessEventRecord['direction'] = last?.direction === 'ENTRY' ? 'EXIT' : 'ENTRY';
    return {
      allowed: direction === expectedDirection,
      expectedDirection,
      lastEvent: last ? mapEvent(last) : undefined,
    };
  }

  /** Evento da mesma catraca e do mesmo estudante desde `since`, para ignorar leituras repetidas. */
  findRecentDeviceEvent(deviceId: string, studentId: string, since: string) {
    const row = this.database.prepare(`
      ${selectEvent}
      WHERE event.device_id = ? AND event.student_id = ? AND event.occurred_at >= ?
      ORDER BY event.occurred_at DESC
      LIMIT 1
    `).get(deviceId, studentId, since) as AccessEventRow | undefined;
    return row ? mapEvent(row) : undefined;
  }

  static deviceIdempotencyKey(deviceId: string, captureId: string) {
    return `device:${deviceId}:${captureId}`;
  }

  findDeviceEvent(operatorUserId: string, deviceId: string, captureId: string) {
    const row = this.findRow(operatorUserId, AccessEventService.deviceIdempotencyKey(deviceId, captureId));
    return row ? mapEvent(row) : undefined;
  }

  /**
   * Registra a passagem identificada pelo protótipo facial (MC-036). Deve ser
   * chamado dentro da transação do serviço de dispositivos, que já autenticou
   * a catraca e conferiu o estudante.
   */
  recordFromDevice(params: {
    schoolId: string;
    studentId: string;
    operatorUserId: string;
    deviceId: string;
    captureId: string;
    direction: AccessEventRecord['direction'];
    turnstileId: string;
    turnstileName: string;
    matchScore: number;
    inferenceMs: number;
    source: 'FACE_PROTOTYPE' | 'DEMO_SIMULATION';
  }): AccessEventRecord {
    const request: CreateAccessEventRequest = {
      direction: params.direction,
      turnstileId: params.turnstileId,
      turnstileName: params.turnstileName,
      status: 'AUTHORIZED',
      method: 'FACIAL',
      whatsappStatus: 'PENDING',
      pushStatus: 'PENDING',
    };
    return this.insertEvent({
      schoolId: params.schoolId,
      studentId: params.studentId,
      createdById: params.operatorUserId,
      request,
      idempotencyKey: AccessEventService.deviceIdempotencyKey(params.deviceId, params.captureId),
      requestHash: hashRequest({ studentId: params.studentId, deviceId: params.deviceId, ...request }),
      source: params.source,
      recognition: {
        deviceId: params.deviceId,
        matchScore: params.matchScore,
        inferenceMs: params.inferenceMs,
      },
    });
  }

  /** Grava evento, fila de sincronização, auditoria e notificação interna. Requer transação externa. */
  private insertEvent(params: {
    schoolId: string;
    studentId: string;
    createdById: string;
    request: CreateAccessEventRequest;
    idempotencyKey: string;
    requestHash: string;
    source: AccessEventSource;
    recognition?: AccessEventRecord['recognition'];
  }): AccessEventRecord {
    const { request, schoolId, studentId, createdById } = params;
    const id = randomUUID();
    const timestamp = this.now();
    const turnstileName = request.turnstileName.trim();
    const syncPayload: AccessEventSyncPayload = {
      sourceNodeId: this.nodeId,
      sourceEventId: id,
      schoolId,
      studentId,
      direction: request.direction,
      occurredAt: timestamp,
      turnstileId: request.turnstileId,
      turnstileName,
      status: request.status,
      method: request.method,
      createdById,
      source: params.source,
      whatsappStatus: request.whatsappStatus,
      pushStatus: request.pushStatus,
      reason: request.reason?.trim() || undefined,
    };
    this.database.prepare(`
      INSERT INTO access_events (
        id, school_id, student_id, direction, occurred_at, turnstile_id,
        turnstile_name, status, method, created_by, source, whatsapp_status,
        push_status, reason, idempotency_key, request_hash, origin_node_id,
        origin_event_id, sync_payload_hash, device_id, match_score, inference_ms
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      schoolId,
      studentId,
      request.direction,
      timestamp,
      request.turnstileId,
      turnstileName,
      request.status,
      request.method,
      createdById,
      params.source,
      request.whatsappStatus,
      request.pushStatus,
      request.reason?.trim() || null,
      params.idempotencyKey,
      params.requestHash,
      this.nodeId,
      id,
      hashSyncPayload(syncPayload),
      params.recognition?.deviceId ?? null,
      params.recognition?.matchScore ?? null,
      params.recognition?.inferenceMs ?? null,
    );
    this.database.prepare(`
      INSERT INTO access_event_sync_queue (
        event_id, school_id, state, available_at, created_at, updated_at
      ) VALUES (?, ?, 'PENDING', ?, ?, ?)
    `).run(id, schoolId, timestamp, timestamp, timestamp);
    this.database.prepare(`
      INSERT INTO audit_log (
        id, school_id, actor_id, aggregate_type, aggregate_id, action,
        previous_state, new_state, occurred_at
      ) VALUES (?, ?, ?, 'ACCESS_EVENT', ?, 'CREATED', NULL, ?, ?)
    `).run(
      randomUUID(),
      schoolId,
      createdById,
      id,
      params.recognition ? `${request.direction}:${params.recognition.deviceId}` : request.direction,
      timestamp,
    );
    const student = this.database.prepare('SELECT name FROM students WHERE id = ?')
      .get(studentId) as { name: string };
    notifyStudentGuardians(this.database, studentId, {
      schoolId,
      type: request.direction,
      title: request.direction === 'ENTRY' ? 'Entrada registrada' : 'Saída registrada',
      message: `${student.name} teve ${request.direction === 'ENTRY' ? 'entrada' : 'saída'} registrada em ${turnstileName}.`,
      studentId,
      contextLabel: params.source === 'DEMO_SIMULATION'
        ? `${turnstileName} · Dados de demonstração`
        : turnstileName,
      sourceType: 'ACCESS_EVENT',
      sourceId: id,
      createdAt: timestamp,
    });

    const row = this.database.prepare(`${selectEvent} WHERE event.id = ?`).get(id) as AccessEventRow;
    return mapEvent(row);
  }
}
