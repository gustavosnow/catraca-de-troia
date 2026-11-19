import type { AccessDeviceRecord } from './accessDevices';

/**
 * Controle dos agentes de borda pelo painel (MC-037).
 *
 * A API local inicia e encerra os scripts Python de `edge/` (cadastro facial e
 * catracas de entrada/saída) no mesmo computador do servidor escolar. As
 * janelas de vídeo continuam abrindo nesse computador; o painel só comanda e
 * acompanha. Somente disponível com EDGE_CONTROL_ENABLED=true.
 */
export const EDGE_AGENT_KINDS = ['RECOGNITION', 'ENROLLMENT'] as const;
export type EdgeAgentKind = (typeof EDGE_AGENT_KINDS)[number];

export const EDGE_AGENT_STATES = [
  /** Processo em execução. */
  'RUNNING',
  /** Parada solicitada; aguardando o processo liberar a câmera. */
  'STOPPING',
  /** Encerrado pelo painel ou pela tecla q na janela do agente. */
  'STOPPED',
  /** Cadastro facial concluído com todas as amostras. */
  'COMPLETED',
  /** Encerrou com erro (câmera indisponível, token recusado, modelo ausente...). */
  'FAILED',
] as const;
export type EdgeAgentState = (typeof EDGE_AGENT_STATES)[number];

export interface EdgeAgentRun {
  id: string;
  kind: EdgeAgentKind;
  /** Catraca cuja câmera o processo usa. */
  deviceId: string;
  /** Somente no cadastro facial. */
  studentId?: string;
  state: EdgeAgentState;
  startedAt: string;
  endedAt?: string;
  exitCode?: number | null;
  startedBy: string;
  /** Últimas linhas impressas pelo agente, para diagnóstico. Nunca contém imagem ou vetor. */
  log: string[];
}

export interface EdgeCameraStatus {
  device: AccessDeviceRecord;
  /** Última execução do agente de reconhecimento desta catraca, se houver. */
  recognition?: EdgeAgentRun;
}

export interface EdgeControlStatus {
  enabled: boolean;
  ready: {
    python: boolean;
    models: boolean;
    /** Orientação quando algo falta no ambiente do agente. */
    message?: string;
  };
  cameras: EdgeCameraStatus[];
  /** Última execução do cadastro facial, se houver. */
  enrollment?: EdgeAgentRun;
}

export interface StartFaceEnrollmentRequest {
  /** Estudante da base demonstrativa ao qual o rosto será associado. */
  studentId: string;
  /** Catraca cuja câmera será usada para capturar as amostras. */
  deviceId: string;
  /**
   * Confirmação explícita de que a pessoa cadastrada é adulta da equipe,
   * consentiu com o teste e está ligada a um estudante fictício.
   */
  consent: true;
  /** Quantidade de amostras (3 a 20). Padrão 8. */
  samples?: number;
}

export interface FaceEnrollmentRecord {
  studentId: string;
  /** Nome do estudante na base, quando existir. */
  studentName?: string;
  /** Rótulo exibido na tela da catraca. */
  label: string;
  samples: number;
}

export interface UpdateCameraSourceRequest {
  /** Índice da webcam (ex.: "0") ou URL do vídeo (ex.: "http://192.168.0.5:4747/video"). */
  cameraSource: string;
}
