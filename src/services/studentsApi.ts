import type { StudentRecord } from '../../shared/contracts/students';
import type { Student } from '../types';
import { authenticatedRequest } from './authApi';

const SHIFTS: Record<NonNullable<StudentRecord['shift']>, Student['shift']> = {
  MORNING: 'Manhã',
  AFTERNOON: 'Tarde',
  FULL_TIME: 'Integral',
};
const STAGES: Record<NonNullable<StudentRecord['stage']>, NonNullable<Student['stage']>> = {
  EARLY_YEARS: 'Fundamental I',
  FINAL_YEARS: 'Fundamental II',
};
const EXIT_RULES: Record<NonNullable<StudentRecord['exitAuthorization']>, NonNullable<Student['exitAuthorization']>> = {
  GUARDIAN_ONLY: 'Apenas com Responsável',
  SCHOOL_TRANSPORT: 'Transporte Escolar',
  UNACCOMPANIED: 'Saída Desacompanhada Autorizada',
};
const STATUSES: Record<StudentRecord['status'], Student['status']> = {
  ACTIVE: 'Ativo',
  SUSPENDED: 'Suspenso',
  ON_LEAVE: 'Afastado',
};

/** Idade em anos completos a partir da data de nascimento (AAAA-MM-DD). */
const ageFrom = (birthDate?: string, today = new Date()) => {
  if (!birthDate) return undefined;
  const [year, month, day] = birthDate.split('-').map(Number);
  if (!year || !month || !day) return undefined;
  let age = today.getFullYear() - year;
  if (today.getMonth() + 1 < month || (today.getMonth() + 1 === month && today.getDate() < day)) age -= 1;
  return age;
};

export const toStudent = (record: StudentRecord): Student => {
  const guardian = record.guardians[0];
  return {
    id: record.id,
    matricula: record.enrollment,
    name: record.name,
    turma: record.className ?? 'Turma não informada',
    shift: record.shift ? SHIFTS[record.shift] : 'Manhã',
    guardianName: guardian?.name ?? '',
    guardianPhone: guardian?.phone ?? '',
    guardianRelation: guardian?.relationship ?? '',
    emergencyContact: record.emergencyContact ?? '',
    status: STATUSES[record.status],
    age: ageFrom(record.birthDate),
    stage: record.stage ? STAGES[record.stage] : undefined,
    exitAuthorization: record.exitAuthorization ? EXIT_RULES[record.exitAuthorization] : undefined,
    homeroomTeacher: record.homeroomTeacher,
  };
};

export const studentsApi = {
  /** Painel escolar: todos os estudantes da unidade (somente equipe). */
  listForSchool: async () =>
    (await authenticatedRequest<StudentRecord[]>('/api/v1/students')).map(toStudent),
  /** Portal: estudantes com vínculo aprovado do responsável da sessão. */
  listMine: async () =>
    (await authenticatedRequest<StudentRecord[]>('/api/v1/me/students')).map(toStudent),
};
