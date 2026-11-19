import { execFile } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import path from 'node:path';
import type { AccessDeviceRecord } from '../../../shared/contracts/accessDevices';
import type {
  EdgeAgentRun,
  EdgeControlStatus,
  FaceEnrollmentRecord,
  StartFaceEnrollmentRequest,
} from '../../../shared/contracts/edgeAgents';
import type { DemoActor } from '../../../shared/contracts/justifications';
import type { AppDatabase } from '../../db';
import { ApiError, conflict, forbidden, invalidRequest, notFound } from '../../errors';
import {
  AccessDeviceService,
  mapDevice,
  normalizeCameraSource,
  type AccessDeviceRow,
} from '../accessDevices/service';
import { EdgeProcessManager } from './processManager';

/**
 * Comando dos agentes de borda pelo painel (MC-037).
 *
 * Regras:
 * - desligado por padrão; só funciona com EDGE_CONTROL_ENABLED=true (uso local);
 * - argumentos dos scripts vêm da base (catraca, câmera, estudante), nunca de texto livre;
 * - iniciar/parar catraca: qualquer perfil escolar;
 * - cadastrar, listar e remover rostos: somente Coordenação e Direção, com
 *   consentimento explícito e registro em auditoria;
 * - cada início de catraca renova o token do dispositivo e o entrega só ao processo.
 */

export type RunPython = (args: string[]) => Promise<string>;

export interface EdgeControlOptions {
  enabled: boolean;
  /** Pasta `edge/` com os scripts. */
  edgeDir: string;
  /** Python do ambiente virtual; padrão edge/.venv. */
  pythonPath?: string;
  /** Endereço da API local usado pelo agente para enviar as leituras. */
  apiUrl: string;
  manager?: EdgeProcessManager;
  /** Execução curta de scripts (listar/remover cadastro); substituível em testes. */
  runPython?: RunPython;
}

const ENROLLMENT_KEY = 'enrollment';
const recognitionKey = (deviceId: string) => `recognition:${deviceId}`;
const BIOMETRIC_MANAGERS = new Set(['STAFF_COORDINATION', 'STAFF_DIRECTION']);
const STUDENT_ID_PATTERN = /^[A-Za-z0-9_-]{1,120}$/;
const MODEL_FILES = ['face_detection_yunet_2023mar.onnx', 'face_recognition_sface_2021dec.onnx'];

export const defaultPythonPath = (edgeDir: string) => (process.platform === 'win32'
  ? path.join(edgeDir, '.venv', 'Scripts', 'python.exe')
  : path.join(edgeDir, '.venv', 'bin', 'python'));

const pythonEnv = (): NodeJS.ProcessEnv => ({
  ...process.env,
  PYTHONUNBUFFERED: '1',
  PYTHONIOENCODING: 'utf-8',
});

export class EdgeAgentService {
  readonly manager: EdgeProcessManager;
  private readonly pythonPath: string;
  private readonly runPython: RunPython;

  constructor(
    private readonly database: AppDatabase,
    private readonly devices: AccessDeviceService,
    private readonly options: EdgeControlOptions,
    private readonly now: () => string = () => new Date().toISOString(),
  ) {
    this.manager = options.manager ?? new EdgeProcessManager(undefined, now);
    this.pythonPath = options.pythonPath ?? defaultPythonPath(options.edgeDir);
    this.runPython = options.runPython ?? ((args) => new Promise((resolve, reject) => {
      execFile(this.pythonPath, args, {
        cwd: this.options.edgeDir,
        env: pythonEnv(),
        timeout: 60_000,
        windowsHide: true,
      }, (error, stdout, stderr) => {
        if (error) reject(new Error((stderr || stdout || error.message).trim()));
        else resolve(stdout);
      });
    }));
  }

  // ---------------------------------------------------------------- consulta

  getStatus(actor: DemoActor): EdgeControlStatus {
    this.assertStaff(actor);
    const rows = this.database.prepare(`
      SELECT * FROM access_devices WHERE school_id = ? ORDER BY id
    `).all(actor.schoolId) as AccessDeviceRow[];
    return {
      enabled: this.options.enabled,
      ready: this.readiness(),
      cameras: rows.map((row) => ({
        device: mapDevice(row),
        recognition: this.manager.get(recognitionKey(row.id)),
      })),
      enrollment: this.manager.get(ENROLLMENT_KEY),
    };
  }

  // ------------------------------------------------------------- catracas

  startRecognition(actor: DemoActor, deviceId: string): EdgeAgentRun {
    this.assertStaff(actor);
    this.assertOperational();
    const device = this.findDevice(actor, deviceId);
    if (device.active !== 1) throw conflict('DEVICE_INACTIVE', 'Esta catraca está desativada.');
    const cameraSource = this.requireCamera(device);
    const key = recognitionKey(device.id);
    if (this.manager.isActive(key)) {
      throw conflict('AGENT_ALREADY_RUNNING', 'O reconhecimento desta catraca já está em execução.');
    }
    this.assertCameraFree(cameraSource);

    const token = this.devices.rotateToken(device.id);
    const run = this.manager.start({
      key,
      kind: 'RECOGNITION',
      deviceId: device.id,
      startedBy: actor.id,
      cameraSource,
      command: this.pythonPath,
      args: ['recognize.py'],
      cwd: this.options.edgeDir,
      env: {
        ...pythonEnv(),
        EDGE_SUPERVISED: '1',
        API_URL: this.options.apiUrl,
        DEVICE_TOKEN: token,
        CAMERA_SOURCE: cameraSource,
      },
      onFinish: (finished) => this.audit(device.school_id, actor.id, 'EDGE_AGENT', device.id,
        `RECOGNITION_${finished.state}`),
    });
    this.audit(device.school_id, actor.id, 'EDGE_AGENT', device.id, 'RECOGNITION_STARTED');
    return run;
  }

  stopRecognition(actor: DemoActor, deviceId: string): EdgeAgentRun {
    this.assertStaff(actor);
    const device = this.findDevice(actor, deviceId);
    const run = this.manager.stop(recognitionKey(device.id));
    if (!run) throw notFound('O reconhecimento desta catraca não foi iniciado pelo painel.');
    return run;
  }

  setCameraSource(actor: DemoActor, deviceId: string, value: unknown): AccessDeviceRecord {
    this.assertBiometricManager(actor, 'Somente Coordenação ou Direção podem configurar câmeras.');
    const device = this.findDevice(actor, deviceId);
    const cameraSource = normalizeCameraSource(value);
    this.database.prepare('UPDATE access_devices SET camera_source = ? WHERE id = ?')
      .run(cameraSource, device.id);
    this.audit(device.school_id, actor.id, 'ACCESS_DEVICE', device.id, 'CAMERA_UPDATED');
    return mapDevice(this.findDevice(actor, deviceId));
  }

  // -------------------------------------------------------- cadastro facial

  startEnrollment(actor: DemoActor, body: unknown): EdgeAgentRun {
    this.assertBiometricManager(actor, 'Somente Coordenação ou Direção podem cadastrar rostos.');
    const request = this.parseEnrollment(body);
    this.assertOperational();
    const student = this.database.prepare(`
      SELECT id, name FROM students WHERE id = ? AND school_id = ?
    `).get(request.studentId, actor.schoolId) as { id: string; name: string } | undefined;
    if (!student) throw notFound('Estudante não encontrado nesta escola.');
    const device = this.findDevice(actor, request.deviceId);
    const cameraSource = this.requireCamera(device);
    if (this.manager.isActive(ENROLLMENT_KEY)) {
      throw conflict('ENROLLMENT_RUNNING', 'Já existe um cadastro facial em andamento.');
    }
    this.assertCameraFree(cameraSource);

    const run = this.manager.start({
      key: ENROLLMENT_KEY,
      kind: 'ENROLLMENT',
      deviceId: device.id,
      studentId: student.id,
      startedBy: actor.id,
      cameraSource,
      command: this.pythonPath,
      // Formato --opcao=valor: um nome iniciado por "-" não vira outra opção.
      args: [
        'enroll.py',
        `--student=${student.id}`,
        `--label=${student.name}`,
        `--samples=${request.samples}`,
        '--consenti',
      ],
      cwd: this.options.edgeDir,
      env: { ...pythonEnv(), EDGE_SUPERVISED: '1', CAMERA_SOURCE: cameraSource },
      onFinish: (finished) => this.audit(actor.schoolId, actor.id, 'FACE_ENROLLMENT', student.id,
        finished.state),
    });
    this.audit(actor.schoolId, actor.id, 'FACE_ENROLLMENT', student.id, 'STARTED');
    return run;
  }

  cancelEnrollment(actor: DemoActor): EdgeAgentRun {
    this.assertBiometricManager(actor, 'Somente Coordenação ou Direção podem cancelar o cadastro facial.');
    const run = this.manager.stop(ENROLLMENT_KEY);
    if (!run) throw notFound('Nenhum cadastro facial foi iniciado pelo painel.');
    return run;
  }

  async listEnrollments(actor: DemoActor): Promise<FaceEnrollmentRecord[]> {
    this.assertBiometricManager(actor, 'Somente Coordenação ou Direção podem consultar os cadastros faciais.');
    this.assertOperational();
    let output: string;
    try {
      output = await this.runPython(['enroll.py', '--list', '--json']);
    } catch (error) {
      throw new ApiError(502, 'EDGE_AGENT_ERROR',
        `Não foi possível consultar os cadastros faciais: ${(error as Error).message}`);
    }
    const people = JSON.parse(output.trim() || '[]') as Array<{
      studentId: string; label: string; samples: number;
    }>;
    const names = new Map((this.database.prepare(`
      SELECT id, name FROM students WHERE school_id = ?
    `).all(actor.schoolId) as Array<{ id: string; name: string }>).map((row) => [row.id, row.name]));
    return people.map((person) => ({
      studentId: person.studentId,
      studentName: names.get(person.studentId),
      label: person.label,
      samples: person.samples,
    }));
  }

  async removeEnrollment(actor: DemoActor, studentId: string): Promise<{ studentId: string; removed: true }> {
    this.assertBiometricManager(actor, 'Somente Coordenação ou Direção podem remover cadastros faciais.');
    this.assertOperational();
    if (!STUDENT_ID_PATTERN.test(studentId)) throw invalidRequest('studentId inválido.');
    if (this.manager.isActive(ENROLLMENT_KEY) && this.manager.get(ENROLLMENT_KEY)?.studentId === studentId) {
      throw conflict('ENROLLMENT_RUNNING', 'Cancele o cadastro em andamento deste estudante antes de removê-lo.');
    }
    try {
      await this.runPython(['enroll.py', `--remove=${studentId}`]);
    } catch (error) {
      throw new ApiError(502, 'EDGE_AGENT_ERROR',
        `Não foi possível remover o cadastro facial: ${(error as Error).message}`);
    }
    this.audit(actor.schoolId, actor.id, 'FACE_ENROLLMENT', studentId, 'REMOVED');
    return { studentId, removed: true };
  }

  /** Encerramento do servidor. */
  shutdown(): void {
    this.manager.stopAll();
  }

  // ------------------------------------------------------------- apoio

  private parseEnrollment(body: unknown): Required<StartFaceEnrollmentRequest> {
    const value = body as Partial<StartFaceEnrollmentRequest> | null;
    if (!value || typeof value.studentId !== 'string' || !STUDENT_ID_PATTERN.test(value.studentId)) {
      throw invalidRequest('studentId é obrigatório.');
    }
    if (typeof value.deviceId !== 'string' || !value.deviceId.trim()) {
      throw invalidRequest('deviceId (câmera usada no cadastro) é obrigatório.');
    }
    if (value.consent !== true) {
      throw invalidRequest(
        'Confirme que a pessoa cadastrada é adulta da equipe, consentiu com o teste e está ligada a um estudante fictício.',
      );
    }
    const samples = value.samples ?? 8;
    if (!Number.isInteger(samples) || samples < 3 || samples > 20) {
      throw invalidRequest('samples deve ser um inteiro entre 3 e 20.');
    }
    return { studentId: value.studentId, deviceId: value.deviceId.trim(), consent: true, samples };
  }

  private readiness(): EdgeControlStatus['ready'] {
    const python = existsSync(this.pythonPath);
    const models = MODEL_FILES.every((file) => existsSync(path.join(this.options.edgeDir, 'models', file)));
    let message: string | undefined;
    if (!python) message = 'Ambiente Python não encontrado. Em edge/: python -m venv .venv e pip install -r requirements.txt.';
    else if (!models) message = 'Modelos ausentes. Em edge/: python download_models.py.';
    return { python, models, message };
  }

  private assertOperational() {
    if (!this.options.enabled) {
      throw new ApiError(503, 'EDGE_CONTROL_DISABLED',
        'Comando dos agentes pelo painel desligado. Use npm run dev (EDGE_CONTROL_ENABLED=true) no computador da catraca.');
    }
    const ready = this.readiness();
    if (ready.message) throw new ApiError(503, 'EDGE_NOT_READY', ready.message);
  }

  private assertStaff(actor: DemoActor) {
    if (actor.role === 'GUARDIAN') throw forbidden();
  }

  private assertBiometricManager(actor: DemoActor, message: string) {
    if (!BIOMETRIC_MANAGERS.has(actor.role)) throw forbidden(message);
  }

  private findDevice(actor: DemoActor, deviceId: string): AccessDeviceRow {
    const row = this.database.prepare(`
      SELECT * FROM access_devices WHERE id = ? AND school_id = ?
    `).get(deviceId, actor.schoolId) as AccessDeviceRow | undefined;
    if (!row) throw notFound('Catraca não encontrada.');
    return row;
  }

  private requireCamera(device: AccessDeviceRow): string {
    if (!device.camera_source) {
      throw conflict('CAMERA_NOT_CONFIGURED',
        `Defina a câmera da catraca ${device.id} antes de iniciar (índice da webcam ou URL do vídeo).`);
    }
    return device.camera_source;
  }

  private assertCameraFree(cameraSource: string) {
    const busy = this.manager.findActiveByCamera(cameraSource);
    if (!busy) return;
    const usage = busy.kind === 'ENROLLMENT'
      ? 'pelo cadastro facial em andamento'
      : `pelo reconhecimento da catraca ${busy.deviceId}`;
    throw conflict('CAMERA_IN_USE', `Esta câmera já está sendo usada ${usage}. Pare-o antes de continuar.`);
  }

  private audit(schoolId: string, actorId: string, aggregateType: string, aggregateId: string, action: string) {
    // O fim de um processo pode ser notificado depois que o servidor fechou a base.
    if (!this.database.open) return;
    this.database.prepare(`
      INSERT INTO audit_log (
        id, school_id, actor_id, aggregate_type, aggregate_id, action,
        previous_state, new_state, occurred_at
      ) VALUES (?, ?, ?, ?, ?, ?, NULL, ?, ?)
    `).run(randomUUID(), schoolId, actorId, aggregateType, aggregateId, action, action, this.now());
  }
}
