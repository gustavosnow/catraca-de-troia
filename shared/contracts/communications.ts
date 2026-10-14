export const NOTICE_CATEGORIES = ['GENERAL', 'PEDAGOGICAL', 'SECURITY', 'EVENTS', 'ON_CALL'] as const;
export type NoticeCategory = (typeof NOTICE_CATEGORIES)[number];

export const NOTICE_PRIORITIES = ['URGENT', 'IMPORTANT', 'INFO'] as const;
export type NoticePriority = (typeof NOTICE_PRIORITIES)[number];

export interface SchoolNoticeRecord {
  id: string;
  schoolId: string;
  title: string;
  category: NoticeCategory;
  priority: NoticePriority;
  authorLabel: string;
  roleLabel: string;
  summary: string;
  content: string;
  attachmentName?: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  version: number;
  isUnread: boolean;
}

export interface CreateSchoolNoticeRequest {
  title: string;
  category: NoticeCategory;
  priority: NoticePriority;
  authorLabel: string;
  roleLabel: string;
  summary: string;
  content: string;
  attachmentName?: string;
  notifyGuardians: boolean;
}

export interface UpdateSchoolNoticeRequest extends Omit<CreateSchoolNoticeRequest, 'notifyGuardians'> {
  expectedVersion: number;
}

export const IN_APP_NOTIFICATION_TYPES = ['ENTRY', 'EXIT', 'NOTICE', 'ABSENCE', 'SECURITY'] as const;
export type InAppNotificationType = (typeof IN_APP_NOTIFICATION_TYPES)[number];

export interface InAppNotificationRecord {
  id: string;
  title: string;
  message: string;
  occurredAt: string;
  type: InAppNotificationType;
  studentName?: string;
  contextLabel?: string;
  readAt?: string;
}

