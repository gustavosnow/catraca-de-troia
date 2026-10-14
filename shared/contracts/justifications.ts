export const USER_ROLES = [
  'GUARDIAN',
  'STAFF_GATE',
  'STAFF_COORDINATION',
  'STAFF_DIRECTION',
] as const;

export type UserRole = (typeof USER_ROLES)[number];

export const JUSTIFICATION_REASONS = [
  'MEDICAL',
  'DENTAL',
  'FORCE_MAJEURE',
  'FAMILY_COMMITMENT',
  'OTHER',
] as const;

export type JustificationReason = (typeof JUSTIFICATION_REASONS)[number];

export const JUSTIFICATION_STATUSES = ['PENDING', 'APPROVED', 'REJECTED'] as const;
export type JustificationStatus = (typeof JUSTIFICATION_STATUSES)[number];
export type ReviewStatus = Extract<JustificationStatus, 'APPROVED' | 'REJECTED'>;

export interface DemoActor {
  id: string;
  schoolId: string;
  name: string;
  role: UserRole;
}

export interface LinkedStudent {
  id: string;
  name: string;
  enrollment: string;
}

export interface JustificationRecord {
  id: string;
  schoolId: string;
  student: LinkedStudent;
  submittedById: string;
  absenceStartDate: string;
  absenceEndDate?: string;
  reasonCategory: JustificationReason;
  description: string;
  attachmentName?: string;
  status: JustificationStatus;
  submittedAt: string;
  reviewedAt?: string;
  reviewedById?: string;
  version: number;
}

export interface CreateJustificationRequest {
  absenceStartDate: string;
  absenceEndDate?: string;
  reasonCategory: JustificationReason;
  description: string;
  attachmentName?: string;
}

export interface ReviewJustificationRequest {
  status: ReviewStatus;
  expectedVersion: number;
}

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
  };
}
