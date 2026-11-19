import type { AuthenticatedUser } from '../../shared/contracts/auth';
import type { AuthUser } from '../types';

const staffRoles: Record<Exclude<AuthenticatedUser['role'], 'GUARDIAN'>, AuthUser['staffRole']> = {
  STAFF_GATE: 'Operador de Portaria & Inspetor',
  STAFF_COORDINATION: 'Coordenação Pedagógica',
  STAFF_DIRECTION: 'Direção Escolar',
};

/** Converte a sessão da API no usuário da interface; nenhum dado vem de lista local. */
export const toAuthUser = (user: AuthenticatedUser): AuthUser => ({
  id: user.id,
  name: user.name,
  email: user.email || '',
  phone: user.phone || '',
  role: user.role === 'GUARDIAN' ? 'parent' : 'staff',
  childrenIds: user.linkedStudentIds,
  staffRole: user.role === 'GUARDIAN' ? undefined : staffRoles[user.role],
  functionalRegistry: user.functionalRegistry,
  schoolUnit: user.schoolName,
});
