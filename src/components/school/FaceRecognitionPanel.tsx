import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Camera,
  CircleStop,
  Play,
  ScanFace,
  ShieldAlert,
  Trash2,
  TriangleAlert,
  Video,
} from 'lucide-react';
import type {
  AccessDenialRecord,
  AccessDeviceRecord,
  DenialReason,
} from '../../../shared/contracts/accessDevices';
import type {
  EdgeAgentRun,
  EdgeAgentState,
  EdgeControlStatus,
  FaceEnrollmentRecord,
} from '../../../shared/contracts/edgeAgents';
import type { Student } from '../../types';
import { accessDevicesApi } from '../../services/accessDevicesApi';
import { edgeAgentsApi } from '../../services/edgeAgentsApi';
import { ApiClientError } from '../../services/apiError';
import { Callout, EmptyState, Field, Tone } from '../ui';

const DENIAL_LABELS: Record<DenialReason, string> = {
  UNKNOWN_FACE: 'Rosto não cadastrado',
  LOW_SCORE: 'Similaridade abaixo do limiar',
  STUDENT_NOT_REGISTERED: 'Estudante fora do cadastro',
};

/** Rótulo e cor de cada estado do agente, conforme docs/INTEGRACAO_FRONT_CAMERAS.md. */
const RUN_STATES: Record<EdgeAgentState, { label: string; tone: Tone }> = {
  RUNNING: { label: 'Em execução', tone: 'positive' },
  STOPPING: { label: 'Parando…', tone: 'warning' },
  STOPPED: { label: 'Parado', tone: 'neutral' },
  COMPLETED: { label: 'Concluído', tone: 'positive' },
  FAILED: { label: 'Falhou', tone: 'negative' },
};

const POLL_ACTIVE_MS = 2000;
const POLL_IDLE_MS = 5000;

const isBusyState = (run?: EdgeAgentRun) => run?.state === 'RUNNING' || run?.state === 'STOPPING';

/** Última linha útil do log: avisos do OpenCV (`[ WARN`) não explicam a falha. */
const failureMessage = (run?: EdgeAgentRun) => {
  if (!run || run.state !== 'FAILED') return undefined;
  const line = [...run.log].reverse().find((entry) => entry.trim() && !entry.trimStart().startsWith('[ WARN'));
  return line?.trim();
};

/** Cancelar com a tecla q na janela do agente também encerra em FAILED. */
const isCancelled = (run?: EdgeAgentRun) =>
  run?.state === 'FAILED' && run.log.some((line) => line.includes('Cadastro cancelado'));

/** Nome da câmera pelo sentido: as duas câmeras podem estar na mesma catraca. */
const cameraLabel = (device: AccessDeviceRecord) =>
  device.direction === 'ENTRY' ? 'Câmera de entrada' : 'Câmera de saída';

const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

const errorMessage = (error: unknown, fallback: string) =>
  error instanceof ApiClientError || error instanceof Error ? error.message : fallback;

const StateChip: React.FC<{ run?: EdgeAgentRun }> = ({ run }) => {
  if (!run) return <span className="chip chip-neutral">Nunca iniciado</span>;
  const state = RUN_STATES[run.state];
  return <span className={`chip chip-${state.tone}`} role="status">{state.label}</span>;
};

interface FaceRecognitionPanelProps {
  /** Coordenação ou Direção: únicas que configuram câmera e gerenciam cadastros faciais. */
  canManageBiometrics: boolean;
  students: Student[];
  isOnline: boolean;
}

/**
 * Protótipo de reconhecimento facial (MC-036) e comando dos agentes de borda
 * (MC-037) dentro de Ferramentas. As janelas de vídeo abrem no computador do
 * servidor escolar; esta tela apenas comanda e acompanha. Nenhuma imagem ou
 * vetor facial trafega para o navegador.
 */
export const FaceRecognitionPanel: React.FC<FaceRecognitionPanelProps> = ({
  canManageBiometrics,
  students,
  isOnline,
}) => {
  const [status, setStatus] = useState<EdgeControlStatus>();
  const [denials, setDenials] = useState<AccessDenialRecord[]>([]);
  const [enrollments, setEnrollments] = useState<FaceEnrollmentRecord[]>([]);
  const [loadError, setLoadError] = useState<string>();
  const [actionError, setActionError] = useState<string>();
  const [busyKey, setBusyKey] = useState<string>();
  const [enrollmentsLoading, setEnrollmentsLoading] = useState(false);

  const [studentId, setStudentId] = useState('');
  const [enrollDeviceId, setEnrollDeviceId] = useState('');
  const [consent, setConsent] = useState(false);
  const [cameraDrafts, setCameraDrafts] = useState<Record<string, string>>({});
  const [openLogId, setOpenLogId] = useState<string>();

  const enabled = status?.enabled ?? false;
  const ready = Boolean(status?.ready.python && status?.ready.models);
  const canCommand = enabled && ready && isOnline;
  const cameras = useMemo(() => status?.cameras ?? [], [status]);
  const enrollment = status?.enrollment;
  const hasActiveRun = cameras.some((camera) => isBusyState(camera.recognition)) || isBusyState(enrollment);

  // Uma única consulta periódica: 2 s enquanto algo roda, 5 s no restante.
  useEffect(() => {
    if (!isOnline) return undefined;
    let active = true;
    const load = async () => {
      try {
        const [nextStatus, nextDenials] = await Promise.all([
          edgeAgentsApi.getStatus(),
          accessDevicesApi.listDenials(5),
        ]);
        if (!active) return;
        setStatus(nextStatus);
        setDenials(nextDenials);
        setLoadError(undefined);
      } catch (error) {
        if (!active) return;
        setLoadError(errorMessage(error, 'Não foi possível consultar as câmeras.'));
      }
    };
    void load();
    const interval = window.setInterval(() => void load(), hasActiveRun ? POLL_ACTIVE_MS : POLL_IDLE_MS);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [hasActiveRun, isOnline]);

  const loadEnrollments = useCallback(async () => {
    if (!canManageBiometrics || !enabled || !ready) return;
    setEnrollmentsLoading(true);
    try {
      setEnrollments(await edgeAgentsApi.listEnrollments());
    } catch (error) {
      setActionError(errorMessage(error, 'Não foi possível listar os cadastros faciais.'));
    } finally {
      setEnrollmentsLoading(false);
    }
  }, [canManageBiometrics, enabled, ready]);

  // Lista os cadastros na primeira vez e sempre que um cadastro termina.
  const lastEnrollmentRef = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (!canManageBiometrics || !enabled || !ready) return;
    const signature = enrollment ? `${enrollment.id}:${enrollment.state}` : 'none';
    if (lastEnrollmentRef.current === signature) return;
    const first = lastEnrollmentRef.current === undefined;
    lastEnrollmentRef.current = signature;
    if (first || enrollment?.state === 'COMPLETED') void loadEnrollments();
  }, [canManageBiometrics, enabled, enrollment, loadEnrollments, ready]);

  const run = async (key: string, action: () => Promise<unknown>, after?: () => Promise<void>) => {
    setBusyKey(key);
    setActionError(undefined);
    try {
      await action();
      setStatus(await edgeAgentsApi.getStatus());
      if (after) await after();
    } catch (error) {
      setActionError(errorMessage(error, 'Não foi possível concluir a ação.'));
    } finally {
      setBusyKey(undefined);
    }
  };

  const startEnrollment = () => {
    if (!studentId || !enrollDeviceId || !consent) return;
    void run('enrollment', () => edgeAgentsApi.startEnrollment({
      studentId,
      deviceId: enrollDeviceId,
      consent: true,
    }), async () => { setConsent(false); });
  };

  const removeEnrollment = (record: FaceEnrollmentRecord) => {
    const name = record.studentName ?? record.studentId;
    if (!window.confirm(`Os vetores faciais de ${name} serão apagados deste computador. Confirmar?`)) return;
    void run(`remove:${record.studentId}`, () => edgeAgentsApi.removeEnrollment(record.studentId), loadEnrollments);
  };

  const saveCamera = (device: AccessDeviceRecord) => {
    const value = (cameraDrafts[device.id] ?? '').trim();
    if (!value) return;
    void run(`camera:${device.id}`, () => edgeAgentsApi.setCameraSource(device.id, value));
  };

  const camerasWithSource = cameras.filter((camera) => camera.device.cameraSource);

  return (
    <section className="card overflow-hidden" aria-labelledby="tools-face">
      <div className="card-header">
        <div>
          <h2 id="tools-face" className="card-title flex items-center gap-2">
            <ScanFace aria-hidden="true" className="h-[18px] w-[18px] text-action" />
            Protótipo de reconhecimento facial
          </h2>
          <p className="card-subtitle">
            Protótipo de laboratório, sem homologação. A janela de vídeo abre no computador da portaria, não neste navegador.
          </p>
        </div>
        <span className="chip chip-neutral">Laboratório</span>
      </div>

      <div className="space-y-5 border-t border-line px-6 py-5">
        {loadError && <Callout tone="warning" role="alert">{loadError}</Callout>}
        {actionError && <Callout tone="negative" role="alert">{actionError}</Callout>}

        {status && !enabled && (
          <Callout tone="neutral" icon={TriangleAlert}>
            Comando das câmeras disponível somente no computador da portaria (<code className="text-ink">npm run dev</code>).
            O estado das câmeras e as leituras negadas continuam visíveis.
          </Callout>
        )}
        {status && enabled && !ready && status.ready.message && (
          <Callout tone="warning" icon={TriangleAlert}>{status.ready.message}</Callout>
        )}

        {/* ----------------------------------------------------- câmeras */}
        <div>
          <h3 className="eyebrow-muted mb-3">Câmeras das catracas</h3>
          {cameras.length === 0 ? (
            <EmptyState
              compact
              icon={Camera}
              title="Nenhuma câmera cadastrada"
              description={<>Registre os dispositivos com <code className="text-ink">npm run device:register</code> e configure o agente em <code className="text-ink">edge/</code>.</>}
            />
          ) : (
            <ul className="space-y-3">
              {cameras.map(({ device, recognition }) => {
                const failure = failureMessage(recognition);
                const running = recognition?.state === 'RUNNING';
                const stopping = recognition?.state === 'STOPPING';
                const draft = cameraDrafts[device.id] ?? device.cameraSource ?? '';
                return (
                  <li key={device.id} className="rounded-[10px] border border-line bg-surface px-4 py-3.5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="flex items-center gap-2 text-sm font-semibold text-ink">
                          <Camera aria-hidden="true" className="h-4 w-4 shrink-0 text-action" />
                          <span className="truncate">{cameraLabel(device)}</span>
                          <span className={`chip ${device.direction === 'ENTRY' ? 'chip-positive' : 'chip-neutral'}`}>
                            {device.direction === 'ENTRY' ? 'Entrada' : 'Saída'}
                          </span>
                        </p>
                        <p className="mt-0.5 text-[13px] text-muted">
                          {device.turnstile.name} · limiar {device.minScore.toFixed(2)}
                          {device.cameraSource ? ` · câmera ${device.cameraSource}` : ' · sem câmera definida'}
                          {!device.active && ' · desativada'}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-wrap items-center gap-2">
                        <StateChip run={recognition} />
                        {canCommand && (running || stopping ? (
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            disabled={stopping || busyKey === `stop:${device.id}`}
                            onClick={() => void run(`stop:${device.id}`, () => edgeAgentsApi.stopRecognition(device.id))}
                          >
                            <CircleStop aria-hidden="true" />
                            {stopping ? 'Parando…' : 'Parar'}
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            disabled={!device.cameraSource || !device.active || busyKey === `start:${device.id}`}
                            title={!device.cameraSource ? 'Defina a câmera desta catraca' : undefined}
                            onClick={() => void run(`start:${device.id}`, () => edgeAgentsApi.startRecognition(device.id))}
                          >
                            <Play aria-hidden="true" />
                            Iniciar
                          </button>
                        ))}
                      </div>
                    </div>

                    {failure && (
                      <p className="mt-2.5 text-[13px] text-negative" role="alert">{failure}</p>
                    )}
                    {recognition && recognition.log.length > 0 && (
                      <>
                        <button
                          type="button"
                          className="btn-link mt-2 text-xs"
                          aria-expanded={openLogId === recognition.id}
                          onClick={() => setOpenLogId(openLogId === recognition.id ? undefined : recognition.id)}
                        >
                          {openLogId === recognition.id ? 'Ocultar detalhes' : 'Ver detalhes'}
                        </button>
                        {openLogId === recognition.id && (
                          <pre className="mt-2 max-h-40 overflow-auto rounded-[10px] bg-white p-3 text-[11px] leading-relaxed text-ink-2">
                            {recognition.log.join('\n')}
                          </pre>
                        )}
                      </>
                    )}

                    {canManageBiometrics && enabled && (
                      <div className="mt-3 flex flex-wrap items-end gap-2 border-t border-line pt-3">
                        <Field
                          className="min-w-[220px] flex-1"
                          label="Fonte de vídeo"
                          htmlFor={`camera-${device.id}`}
                          hint="Índice da webcam (0) ou URL do celular (http://IP:4747/video). Vale no próximo início."
                        >
                          <input
                            id={`camera-${device.id}`}
                            className="input h-10"
                            value={draft}
                            placeholder="0"
                            onChange={(event) => setCameraDrafts((current) => ({ ...current, [device.id]: event.target.value }))}
                          />
                        </Field>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm mb-[22px]"
                          disabled={busyKey === `camera:${device.id}` || !draft.trim() || draft.trim() === device.cameraSource}
                          onClick={() => saveCamera(device)}
                        >
                          <Video aria-hidden="true" />
                          Salvar câmera
                        </button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* --------------------------------------------------- cadastro */}
        {canManageBiometrics && (
          <div className="border-t border-line pt-5">
            <h3 className="eyebrow-muted mb-3">Cadastro facial</h3>
            <Callout tone="warning" className="mb-4">
              Protótipo de laboratório: cadastre só o rosto de um adulto voluntário da equipe, com consentimento,
              representando o estudante no teste. Nunca cadastre o rosto de uma criança.
            </Callout>

            {isBusyState(enrollment) ? (
              <div className="rounded-[10px] border border-line bg-surface px-4 py-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-ink">Cadastro em andamento</p>
                  <StateChip run={enrollment} />
                </div>
                <p className="mt-1 text-[13px] text-muted">
                  Olhe para a câmera e varie levemente o ângulo. A janela de captura abriu no computador da portaria.
                </p>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm mt-3"
                  disabled={enrollment?.state === 'STOPPING' || busyKey === 'cancel'}
                  onClick={() => void run('cancel', () => edgeAgentsApi.cancelEnrollment())}
                >
                  Cancelar cadastro
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Estudante representado" htmlFor="enroll-student">
                    <select
                      id="enroll-student"
                      className="select"
                      value={studentId}
                      disabled={!canCommand}
                      onChange={(event) => setStudentId(event.target.value)}
                    >
                      <option value="">Selecione…</option>
                      {students.map((student) => (
                        <option key={student.id} value={student.id}>{student.name} · {student.matricula}</option>
                      ))}
                    </select>
                  </Field>
                  <Field
                    label="Câmera da captura"
                    htmlFor="enroll-device"
                    hint="Uma câmera atende um processo por vez: pare a catraca antes de cadastrar com ela."
                  >
                    <select
                      id="enroll-device"
                      className="select"
                      value={enrollDeviceId}
                      disabled={!canCommand}
                      onChange={(event) => setEnrollDeviceId(event.target.value)}
                    >
                      <option value="">Selecione…</option>
                      {camerasWithSource.map(({ device, recognition }) => (
                        <option key={device.id} value={device.id}>
                          {cameraLabel(device)} · {device.turnstile.name}{recognition?.state === 'RUNNING' ? ' (em uso)' : ''}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>

                <label htmlFor="enroll-consent" className="flex cursor-pointer items-start gap-3 rounded-[10px] border border-line bg-surface px-4 py-3 text-[13px] text-ink-2">
                  <input
                    id="enroll-consent"
                    type="checkbox"
                    className="checkbox mt-0.5"
                    checked={consent}
                    disabled={!canCommand}
                    onChange={(event) => setConsent(event.target.checked)}
                  />
                  Confirmo que a pessoa cadastrada é adulta da equipe, consentiu com o teste e não é uma criança.
                </label>

                {enrollment && !isBusyState(enrollment) && (
                  <p className={`text-[13px] ${enrollment.state === 'COMPLETED' ? 'text-positive' : 'text-muted'}`} role="status">
                    {enrollment.state === 'COMPLETED'
                      ? 'Cadastro concluído. As catracas em execução reconhecem o novo rosto em alguns segundos.'
                      : isCancelled(enrollment)
                        ? 'Cadastro cancelado na janela da câmera.'
                        : failureMessage(enrollment) ?? 'Último cadastro encerrado.'}
                  </p>
                )}

                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={!canCommand || !studentId || !enrollDeviceId || !consent || busyKey === 'enrollment'}
                  onClick={startEnrollment}
                >
                  <ScanFace aria-hidden="true" />
                  Cadastrar rosto
                </button>
              </div>
            )}

            <div className="mt-5">
              <div className="mb-2 flex items-baseline justify-between gap-3">
                <h4 className="eyebrow-muted">Rostos cadastrados neste computador</h4>
                {enrollmentsLoading && <span className="text-xs text-muted" role="status">Consultando…</span>}
              </div>
              {enrollments.length === 0 ? (
                <p className="rounded-[10px] bg-surface px-4 py-4 text-[13px] text-muted">
                  {canCommand ? 'Nenhum rosto cadastrado neste computador.' : 'Lista disponível apenas com o comando das câmeras ativo.'}
                </p>
              ) : (
                <ul className="divide-y divide-line rounded-[10px] border border-line">
                  {enrollments.map((record) => (
                    <li key={record.studentId} className="flex items-center justify-between gap-3 px-4 py-3">
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-semibold text-ink">
                          {record.studentName ?? `Estudante removido do cadastro (${record.studentId})`}
                        </p>
                        <p className={`text-xs ${record.studentName ? 'text-muted' : 'text-warning'}`}>
                          {record.samples} {record.samples === 1 ? 'amostra' : 'amostras'}
                          {!record.studentName && ' · não é reconhecido; remova e cadastre de novo para um estudante atual'}
                        </p>
                      </div>
                      <button
                        type="button"
                        className="icon-btn hover:!bg-negative-soft hover:!text-negative"
                        aria-label={`Remover cadastro de ${record.studentName ?? record.studentId}`}
                        disabled={busyKey === `remove:${record.studentId}`}
                        onClick={() => removeEnrollment(record)}
                      >
                        <Trash2 />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {/* -------------------------------------------- leituras negadas */}
        <div className="border-t border-line pt-5">
          <h3 className="eyebrow-muted mb-3 flex items-center gap-2">
            <ShieldAlert aria-hidden="true" className="h-4 w-4 text-negative" />
            Últimas leituras negadas
          </h3>
          {denials.length === 0 ? (
            <p className="rounded-[10px] bg-surface px-4 py-4 text-[13px] text-muted">
              Nenhuma leitura negada registrada.
            </p>
          ) : (
            <ul className="space-y-1.5">
              {denials.map((denial) => (
                <li key={denial.id} className="flex justify-between gap-3 text-[13px] text-ink-2">
                  <span className="truncate">
                    {DENIAL_LABELS[denial.reason]} · câmera de {denial.direction === 'ENTRY' ? 'entrada' : 'saída'}
                  </span>
                  <span className="tabular shrink-0 text-muted">
                    {Math.round(denial.matchScore * 100)}% · {formatTime(denial.occurredAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-3 text-xs text-muted">
            Tentativas negadas não geram passagem, não alteram a presença e não notificam responsáveis.
            Nenhuma imagem ou vetor facial é armazenado aqui. Use a passagem assistida quando necessário.
          </p>
        </div>
      </div>
    </section>
  );
};
