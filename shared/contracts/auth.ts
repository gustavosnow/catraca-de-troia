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

/**
 * Cadastro do responsável pelo portal. Cria a conta e, na mesma operação, a
 * solicitação de vínculo com a matrícula informada. Nenhum dado do estudante é
 * liberado antes da aprovação da Coordenação ou Direção.
 */
export interface RegisterGuardianRequest {
  name: string;
  email: string;
  phone: string;
  /** Opcional; quando informado, também serve para entrar. */
  cpf?: string;
  password: string;
  studentEnrollment: string;
  relationship: string;
}
