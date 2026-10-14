import type { UserRole } from './justifications';

export interface AuthenticatedUser {
  id: string;
  schoolId: string;
  schoolName: string;
  name: string;
  role: UserRole;
  email?: string;
  phone?: string;
  functionalRegistry?: string;
  linkedStudentIds: string[];
}

export interface AuthSession {
  token: string;
  expiresAt: string;
  user: AuthenticatedUser;
}

export interface LoginRequest {
  identifier: string;
  password: string;
  rememberMe?: boolean;
}
