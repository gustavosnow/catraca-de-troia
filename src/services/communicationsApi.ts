import type {
  CreateSchoolNoticeRequest,
  InAppNotificationRecord,
  NoticeCategory,
  NoticePriority,
  SchoolNoticeRecord,
  UpdateSchoolNoticeRequest,
} from '../../shared/contracts/communications';
import type { ParentNotification, SchoolNotice } from '../types';
import { authenticatedRequest } from './authApi';

const categoryToApi: Record<SchoolNotice['category'], NoticeCategory> = {
  Geral: 'GENERAL',
  Pedagógico: 'PEDAGOGICAL',
  Segurança: 'SECURITY',
  Eventos: 'EVENTS',
  Plantão: 'ON_CALL',
};
const categoryFromApi: Record<NoticeCategory, SchoolNotice['category']> = {
  GENERAL: 'Geral',
  PEDAGOGICAL: 'Pedagógico',
  SECURITY: 'Segurança',
  EVENTS: 'Eventos',
  ON_CALL: 'Plantão',
};
const priorityToApi: Record<SchoolNotice['priority'], NoticePriority> = {
  urgent: 'URGENT', important: 'IMPORTANT', info: 'INFO',
};
const priorityFromApi: Record<NoticePriority, SchoolNotice['priority']> = {
  URGENT: 'urgent', IMPORTANT: 'important', INFO: 'info',
};

const mapNotice = (record: SchoolNoticeRecord): SchoolNotice => {
  const createdAt = new Date(record.createdAt);
  return {
    id: record.id,
    title: record.title,
    category: categoryFromApi[record.category],
    author: record.authorLabel,
    role: record.roleLabel,
    date: createdAt.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }),
    time: createdAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    summary: record.summary,
    fullContent: record.content,
    priority: priorityFromApi[record.priority],
    isUnread: record.isUnread,
    attachmentName: record.attachmentName,
    version: record.version,
  };
};

const toRequest = (notice: Omit<SchoolNotice, 'id'>): Omit<CreateSchoolNoticeRequest, 'notifyGuardians'> => ({
  title: notice.title,
  category: categoryToApi[notice.category],
  priority: priorityToApi[notice.priority],
  authorLabel: notice.author,
  roleLabel: notice.role,
  summary: notice.summary,
  content: notice.fullContent,
  attachmentName: notice.attachmentName,
});

const mapNotification = (record: InAppNotificationRecord): ParentNotification => ({
  id: record.id,
  title: record.title,
  message: record.message,
  timestamp: new Date(record.occurredAt).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
  }),
  type: record.type.toLowerCase() as ParentNotification['type'],
  studentName: record.studentName || 'Geral',
  turnstile: record.contextLabel,
  isRead: Boolean(record.readAt),
});

export const communicationsApi = {
  listNotices: async () =>
    (await authenticatedRequest<SchoolNoticeRecord[]>('/api/v1/notices')).map(mapNotice),

  createNotice: async (notice: Omit<SchoolNotice, 'id'>, notifyGuardians: boolean) =>
    mapNotice(await authenticatedRequest<SchoolNoticeRecord>('/api/v1/notices', {
      method: 'POST',
      body: JSON.stringify({ ...toRequest(notice), notifyGuardians } satisfies CreateSchoolNoticeRequest),
    })),

  updateNotice: async (notice: SchoolNotice) => {
    const request: UpdateSchoolNoticeRequest = {
      ...toRequest(notice),
      expectedVersion: notice.version || 1,
    };
    return mapNotice(await authenticatedRequest<SchoolNoticeRecord>(`/api/v1/notices/${notice.id}`, {
      method: 'PUT',
      body: JSON.stringify(request),
    }));
  },

  deleteNotice: (id: string) =>
    authenticatedRequest<void>(`/api/v1/notices/${id}`, { method: 'DELETE' }),

  markNoticeRead: (id: string) =>
    authenticatedRequest<void>(`/api/v1/notices/${id}/read`, { method: 'POST' }),

  broadcastNotice: (id: string) =>
    authenticatedRequest<{ recipients: number }>(`/api/v1/notices/${id}/broadcast`, {
      method: 'POST',
      headers: { 'Idempotency-Key': globalThis.crypto?.randomUUID?.() || `broadcast-${Date.now()}` },
    }),

  listNotifications: async () =>
    (await authenticatedRequest<InAppNotificationRecord[]>('/api/v1/notifications')).map(mapNotification),

  markAllNotificationsRead: () =>
    authenticatedRequest<{ updated: number }>('/api/v1/notifications/read-all', { method: 'POST' }),
};

