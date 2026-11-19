import type { AccessDeviceRecord } from '../../shared/contracts/accessDevices';
import type {
  EdgeAgentRun,
  EdgeControlStatus,
  FaceEnrollmentRecord,
  StartFaceEnrollmentRequest,
} from '../../shared/contracts/edgeAgents';
import { authenticatedRequest } from './authApi';

/**
 * Comandos dos agentes de borda pelo painel (MC-037): iniciar/parar as catracas
 * de entrada e saída e o cadastro facial. As janelas de vídeo abrem no computador
 * do servidor escolar; consulte `getStatus` a cada poucos segundos para acompanhar.
 * Cadastro, consulta e remoção de rostos exigem Coordenação ou Direção.
 */
export const edgeAgentsApi = {
  getStatus: () => authenticatedRequest<EdgeControlStatus>('/api/v1/edge-agents'),

  startRecognition: (deviceId: string) => authenticatedRequest<EdgeAgentRun>(
    `/api/v1/edge-agents/recognition/${encodeURIComponent(deviceId)}/start`,
    { method: 'POST' },
  ),
  stopRecognition: (deviceId: string) => authenticatedRequest<EdgeAgentRun>(
    `/api/v1/edge-agents/recognition/${encodeURIComponent(deviceId)}/stop`,
    { method: 'POST' },
  ),
  setCameraSource: (deviceId: string, cameraSource: string) => authenticatedRequest<AccessDeviceRecord>(
    `/api/v1/access-devices/${encodeURIComponent(deviceId)}/camera`,
    { method: 'PATCH', body: JSON.stringify({ cameraSource }) },
  ),

  listEnrollments: () => authenticatedRequest<FaceEnrollmentRecord[]>('/api/v1/face-enrollments'),
  startEnrollment: (request: StartFaceEnrollmentRequest) => authenticatedRequest<EdgeAgentRun>(
    '/api/v1/face-enrollments',
    { method: 'POST', body: JSON.stringify(request) },
  ),
  cancelEnrollment: () => authenticatedRequest<EdgeAgentRun>(
    '/api/v1/face-enrollments/current/cancel',
    { method: 'POST' },
  ),
  removeEnrollment: (studentId: string) => authenticatedRequest<{ studentId: string; removed: true }>(
    `/api/v1/face-enrollments/${encodeURIComponent(studentId)}`,
    { method: 'DELETE' },
  ),
};
