import { spawn, type ChildProcess } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import type { EdgeAgentKind, EdgeAgentRun } from '../../../shared/contracts/edgeAgents';

/**
 * Executa e acompanha os processos Python de `edge/` (MC-037).
 *
 * Cada processo é identificado por uma chave (ex.: `recognition:cat-01-entrada`
 * ou `enrollment`). A entrada padrão fica aberta: fechá-la pede ao agente que
 * encerre e libere a câmera (ver edge/supervision.py). Se o servidor cair, o
 * sistema operacional fecha a entrada e o agente encerra sozinho.
 */

export type EdgeSpawner = (
  command: string,
  args: string[],
  options: { cwd: string; env: NodeJS.ProcessEnv },
) => ChildProcess;

const defaultSpawner: EdgeSpawner = (command, args, options) => spawn(command, args, {
  cwd: options.cwd,
  env: options.env,
  stdio: ['pipe', 'pipe', 'pipe'],
  shell: false,
  windowsHide: false,
});

const MAX_LOG_LINES = 40;
const MAX_LINE_LENGTH = 300;

export interface StartEdgeProcess {
  key: string;
  kind: EdgeAgentKind;
  deviceId: string;
  studentId?: string;
  startedBy: string;
  /** Origem do vídeo; duas execuções não podem usar a mesma câmera ao mesmo tempo. */
  cameraSource: string;
  command: string;
  args: string[];
  cwd: string;
  env: NodeJS.ProcessEnv;
  onFinish?: (run: EdgeAgentRun) => void;
}

interface TrackedRun {
  record: EdgeAgentRun;
  child: ChildProcess;
  cameraSource: string;
  stopRequested: boolean;
  killTimer?: NodeJS.Timeout;
  partial: { stdout: string; stderr: string };
}

const sameCamera = (left: string, right: string) =>
  left.trim().toLowerCase() === right.trim().toLowerCase();

export class EdgeProcessManager {
  private readonly runs = new Map<string, TrackedRun>();

  constructor(
    private readonly spawner: EdgeSpawner = defaultSpawner,
    private readonly now: () => string = () => new Date().toISOString(),
    /** Tempo para o agente encerrar sozinho antes de ser finalizado à força. */
    private readonly stopTimeoutMs = 6000,
  ) {}

  get(key: string): EdgeAgentRun | undefined {
    const run = this.runs.get(key);
    return run ? this.snapshot(run) : undefined;
  }

  isActive(key: string): boolean {
    const state = this.runs.get(key)?.record.state;
    return state === 'RUNNING' || state === 'STOPPING';
  }

  /** Execução ativa que está usando esta câmera, se houver. */
  findActiveByCamera(cameraSource: string): EdgeAgentRun | undefined {
    for (const [key, run] of this.runs) {
      if (this.isActive(key) && sameCamera(run.cameraSource, cameraSource)) return this.snapshot(run);
    }
    return undefined;
  }

  start(params: StartEdgeProcess): EdgeAgentRun {
    if (this.isActive(params.key)) throw new Error(`Processo ${params.key} já está em execução.`);
    const record: EdgeAgentRun = {
      id: randomUUID(),
      kind: params.kind,
      deviceId: params.deviceId,
      studentId: params.studentId,
      state: 'RUNNING',
      startedAt: this.now(),
      startedBy: params.startedBy,
      log: [],
    };
    const child = this.spawner(params.command, params.args, { cwd: params.cwd, env: params.env });
    const run: TrackedRun = {
      record,
      child,
      cameraSource: params.cameraSource,
      stopRequested: false,
      partial: { stdout: '', stderr: '' },
    };
    this.runs.set(params.key, run);

    const collect = (stream: 'stdout' | 'stderr') => (chunk: Buffer | string) => {
      const text = run.partial[stream] + chunk.toString();
      const lines = text.split(/\r?\n/);
      run.partial[stream] = lines.pop() ?? '';
      this.appendLog(run, lines);
    };
    child.stdout?.on('data', collect('stdout'));
    child.stderr?.on('data', collect('stderr'));
    // Erro de escrita na entrada (processo já encerrado) não deve derrubar a API.
    child.stdin?.on('error', () => undefined);

    let finished = false;
    const finish = (exitCode: number | null, failure?: string) => {
      if (finished) return;
      finished = true;
      if (run.killTimer) clearTimeout(run.killTimer);
      this.appendLog(run, [run.partial.stdout, run.partial.stderr]);
      if (failure) this.appendLog(run, [failure]);
      record.exitCode = exitCode;
      record.endedAt = this.now();
      if (failure) record.state = 'FAILED';
      else if (run.stopRequested) record.state = 'STOPPED';
      else if (exitCode === 0) record.state = record.kind === 'ENROLLMENT' ? 'COMPLETED' : 'STOPPED';
      else record.state = 'FAILED';
      params.onFinish?.(this.snapshot(run));
    };
    child.once('exit', (code) => finish(code));
    child.once('error', (error) => finish(null, `Não foi possível iniciar o agente: ${error.message}`));
    return this.snapshot(run);
  }

  /** Pede ao agente que encerre; finaliza à força se ele não responder a tempo. */
  stop(key: string): EdgeAgentRun | undefined {
    const run = this.runs.get(key);
    if (!run) return undefined;
    if (run.record.state === 'RUNNING') {
      run.stopRequested = true;
      run.record.state = 'STOPPING';
      run.child.stdin?.end();
      run.killTimer = setTimeout(() => run.child.kill(), this.stopTimeoutMs);
      run.killTimer.unref?.();
    }
    return this.snapshot(run);
  }

  /** Encerramento do servidor: finaliza todos os agentes imediatamente. */
  stopAll(): void {
    for (const run of this.runs.values()) {
      if (run.record.state !== 'RUNNING' && run.record.state !== 'STOPPING') continue;
      run.stopRequested = true;
      run.child.stdin?.end();
      run.child.kill();
    }
  }

  private appendLog(run: TrackedRun, lines: string[]) {
    for (const line of lines) {
      const clean = line.trimEnd();
      if (!clean) continue;
      run.record.log.push(clean.slice(0, MAX_LINE_LENGTH));
    }
    if (run.record.log.length > MAX_LOG_LINES) {
      run.record.log.splice(0, run.record.log.length - MAX_LOG_LINES);
    }
  }

  private snapshot(run: TrackedRun): EdgeAgentRun {
    return { ...run.record, log: [...run.record.log] };
  }
}
