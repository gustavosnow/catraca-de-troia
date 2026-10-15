import type { UserRole } from './justifications';

export type AccountStatus = 'ACTIVE' | 'BLOCKED';

export interface ManagedAccount {
  id: string;
  name: string;
  role: UserRole;
  email?: string;
  phone?: string;
  functionalRegistry?: string;
  status: AccountStatus;
  version: number;
  activeSessionCount: number;
  lastSessionAt?: string;
}

export interface UpdateAccountStatusRequest {
  status: AccountStatus;
  expectedVersion: number;
  reason: string;
}

export interface RevokeAccountSessionsRequest {
  reason: string;
}
