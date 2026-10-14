import type {
  CreateGuardianLinkRequest,
  GuardianLinkRequestRecord,
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
};
