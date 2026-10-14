import type { AuditLogRecord } from '../../shared/contracts/audit';
import { authenticatedRequest } from './authApi';

export const auditApi = {
  list: (aggregateType?: string) => {
    const query = new URLSearchParams({ limit: '100' });
    if (aggregateType) query.set('aggregateType', aggregateType);
    return authenticatedRequest<AuditLogRecord[]>(`/api/v1/audit-log?${query}`);
  },
};
