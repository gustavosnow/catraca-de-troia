import type { LinkedStudent } from './justifications';

export const LINK_REQUEST_STATUSES = ['PENDING', 'APPROVED', 'REJECTED'] as const;
export type LinkRequestStatus = (typeof LINK_REQUEST_STATUSES)[number];
export type LinkReviewStatus = Extract<LinkRequestStatus, 'APPROVED' | 'REJECTED'>;

export const GUARDIAN_RELATIONSHIPS = [
  'Mãe', 'Pai', 'Avó / Avô', 'Tutor(a) Legal', 'Responsável',
] as const;
export type GuardianRelationship = (typeof GUARDIAN_RELATIONSHIPS)[number];

export interface GuardianSummary {
  id: string;
  name: string;
}

export interface GuardianLinkRequestRecord {
  id: string;
  schoolId: string;
  guardian: GuardianSummary;
  student: LinkedStudent;
  relationship: GuardianRelationship;
  status: LinkRequestStatus;
  submittedAt: string;
  reviewedAt?: string;
  reviewedById?: string;
  reviewNote?: string;
  version: number;
}

export interface CreateGuardianLinkRequest {
  studentEnrollment: string;
  relationship: GuardianRelationship;
}

export interface ReviewGuardianLinkRequest {
  status: LinkReviewStatus;
  expectedVersion: number;
  reviewNote?: string;
}

export interface GuardianStudentLinkRecord {
  guardian: GuardianSummary;
  student: LinkedStudent;
  status: 'APPROVED' | 'REVOKED';
  approvedAt?: string;
  approvedById?: string;
  revokedAt?: string;
  revokedById?: string;
  revocationReason?: string;
  version: number;
}

export interface RevokeGuardianLinkRequest {
  expectedVersion: number;
  reason: string;
}
