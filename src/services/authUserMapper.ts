import type { AuthenticatedUser } from '../../shared/contracts/auth';
import { PARENT_ACCOUNTS, STAFF_ACCOUNTS } from '../data/mockData';
import type { AuthUser } from '../types';

const staffRoles: Record<Exclude<AuthenticatedUser['role'], 'GUARDIAN'>, AuthUser['staffRole']> = {
  STAFF_GATE: 'Operador de Portaria & Inspetor',
  STAFF_COORDINATION: 'Coordenação Pedagógica',
  STAFF_DIRECTION: 'Direção Escolar',
};

export const toAuthUser = (user: AuthenticatedUser): AuthUser => {
  const guardian = PARENT_ACCOUNTS.find((account) => account.id === user.id);
  const staff = STAFF_ACCOUNTS.find((account) => account.id === user.id);
  return {
    id: user.id,
    name: user.name,
    email: user.email || '',
    phone: user.phone || '',
    role: user.role === 'GUARDIAN' ? 'parent' : 'staff',
    guardianRelation: guardian?.relation as AuthUser['guardianRelation'],
    childrenIds: user.linkedStudentIds,
    staffRole: user.role === 'GUARDIAN' ? undefined : staffRoles[user.role],
    functionalRegistry: user.functionalRegistry,
    schoolUnit: user.schoolName,
    avatar: staff?.avatar,
  };
};
