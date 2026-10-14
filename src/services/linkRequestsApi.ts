import type {
  CreateGuardianLinkRequest,
  GuardianLinkRequestRecord,
  GuardianStudentLinkRecord,
  RevokeGuardianLinkRequest,
  ReviewGuardianLinkRequest,
} from '../../shared/contracts/linkRequests';
import { authenticatedRequest } from './authApi';

export const linkRequestsApi = {
  list: () => authenticatedRequest<GuardianLinkRequestRecord[]>('/api/v1/guardian-link-requests'),

  create: (input: CreateGuardianLinkRequest) =>
    authenticatedRequest<GuardianLinkRequestRecord>('/api/v1/guardian-link-requests', {
      method: 'POST',
      headers: {
        'Idempotency-Key': globalThis.crypto?.randomUUID?.() || `link-${Date.now()}`,
      },
      body: JSON.stringify(input),
    }),

  review: (id: string, input: ReviewGuardianLinkRequest) =>
    authenticatedRequest<GuardianLinkRequestRecord>(`/api/v1/guardian-link-requests/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    }),

  listLinks: () => authenticatedRequest<GuardianStudentLinkRecord[]>('/api/v1/guardian-links'),

  revoke: (guardianId: string, studentId: string, input: RevokeGuardianLinkRequest) =>
    authenticatedRequest<GuardianStudentLinkRecord>(
      `/api/v1/guardian-links/${guardianId}/${studentId}/revoke`,
      { method: 'PATCH', body: JSON.stringify(input) },
    ),
};
