export type NotificationDeliveryState = 'PENDING' | 'DELIVERED' | 'FAILED';

export interface NotificationDeliveryRecord {
  id: string;
  recipientName: string;
  title: string;
  channel: 'PUSH_DEMO';
  state: NotificationDeliveryState;
  attemptCount: number;
  createdAt: string;
  lastAttemptAt?: string;
  deliveredAt?: string;
  nextAttemptAt?: string;
  lastError?: string;
}

export interface NotificationDeliverySnapshot {
  counts: Record<NotificationDeliveryState, number>;
  records: NotificationDeliveryRecord[];
  channelConfigured: false;
}

export interface ProcessNotificationDeliveriesRequest {
  outcome: 'DELIVER' | 'FAIL_RETRY';
}
