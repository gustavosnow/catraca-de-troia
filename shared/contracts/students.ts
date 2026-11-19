import type { LinkedStudent } from './justifications';

/** Ficha escolar do estudante, mantida pela escola (MC-039). */
export const STUDENT_SHIFTS = ['MORNING', 'AFTERNOON', 'FULL_TIME'] as const;
export type StudentShift = (typeof STUDENT_SHIFTS)[number];

export const STUDENT_STAGES = ['EARLY_YEARS', 'FINAL_YEARS'] as const;
export type StudentStage = (typeof STUDENT_STAGES)[number];

export const EXIT_AUTHORIZATIONS = ['GUARDIAN_ONLY', 'SCHOOL_TRANSPORT', 'UNACCOMPANIED'] as const;
export type ExitAuthorization = (typeof EXIT_AUTHORIZATIONS)[number];

export const STUDENT_STATUSES = ['ACTIVE', 'SUSPENDED', 'ON_LEAVE'] as const;
export type StudentStatus = (typeof STUDENT_STATUSES)[number];

/** Responsável com vínculo aprovado pela escola. */
export interface StudentGuardianRecord {
  id: string;
  name: string;
  relationship?: string;
  phone?: string;
}

export interface StudentRecord extends LinkedStudent {
  className?: string;
  shift?: StudentShift;
  stage?: StudentStage;
  homeroomTeacher?: string;
  birthDate?: string;
  exitAuthorization?: ExitAuthorization;
  emergencyContact?: string;
  status: StudentStatus;
  /**
   * Painel escolar: todos os responsáveis aprovados. Portal do responsável:
   * somente o próprio vínculo, sem dados de outros responsáveis.
   */
  guardians: StudentGuardianRecord[];
}
