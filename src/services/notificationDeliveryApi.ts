import type {
  NotificationDeliverySnapshot,
  ProcessNotificationDeliveriesRequest,
} from '../../shared/contracts/notificationDelivery';
import { authenticatedRequest } from './authApi';

export const notificationDeliveryApi = {
  snapshot: () => authenticatedRequest<NotificationDeliverySnapshot>('/api/v1/notification-deliveries'),
  process: (input: ProcessNotificationDeliveriesRequest) =>
    authenticatedRequest<{ processed: number }>('/api/v1/notification-deliveries/process', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  retry: () => authenticatedRequest<{ updated: number }>('/api/v1/notification-deliveries/retry', { method: 'POST' }),
};
