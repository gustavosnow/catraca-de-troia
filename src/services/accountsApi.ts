import type {
  ManagedAccount,
  RevokeAccountSessionsRequest,
  UpdateAccountStatusRequest,
} from '../../shared/contracts/accountAdministration';
import { authenticatedRequest } from './authApi';

export const accountsApi = {
  list: () => authenticatedRequest<ManagedAccount[]>('/api/v1/accounts'),
  updateStatus: (accountId: string, input: UpdateAccountStatusRequest) =>
    authenticatedRequest<ManagedAccount>(`/api/v1/accounts/${accountId}/status`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    }),
  revokeSessions: (accountId: string, input: RevokeAccountSessionsRequest) =>
    authenticatedRequest<{ revoked: number }>(`/api/v1/accounts/${accountId}/revoke-sessions`, {
      method: 'POST',
      body: JSON.stringify(input),
    }),
};
