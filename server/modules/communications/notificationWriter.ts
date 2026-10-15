import { randomUUID } from 'node:crypto';
import type { InAppNotificationType } from '../../../shared/contracts/communications';
import type { AppDatabase } from '../../db';

interface NotificationInput {
  schoolId: string;
  type: InAppNotificationType;
  title: string;
  message: string;
  sourceType: string;
  sourceId: string;
  createdAt: string;
  studentId?: string;
  contextLabel?: string;
}

const insertForRecipient = (
  database: AppDatabase,
  recipientUserId: string,
  input: NotificationInput,
) => {
  const notificationId = randomUUID();
  const inserted = database.prepare(`
    INSERT OR IGNORE INTO in_app_notifications (
      id, school_id, recipient_user_id, type, title, message, student_id,
      context_label, source_type, source_id, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    notificationId, input.schoolId, recipientUserId, input.type, input.title,
    input.message, input.studentId || null, input.contextLabel || null,
    input.sourceType, input.sourceId, input.createdAt,
  );
  if (inserted.changes === 1) {
    database.prepare(`
      INSERT INTO notification_delivery_queue (
        id, school_id, notification_id, recipient_user_id, channel, state,
        available_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, 'PUSH_DEMO', 'PENDING', ?, ?, ?)
    `).run(randomUUID(), input.schoolId, notificationId, recipientUserId, input.createdAt, input.createdAt, input.createdAt);
  }
  return inserted;
};

export const notifyUser = (
  database: AppDatabase,
  recipientUserId: string,
  input: NotificationInput,
) => insertForRecipient(database, recipientUserId, input).changes;

export const notifyStudentGuardians = (
  database: AppDatabase,
  studentId: string,
  input: NotificationInput,
) => {
  const guardians = database.prepare(`
    SELECT guardian_user_id FROM guardian_student_links
    WHERE student_id = ? AND status = 'APPROVED'
  `).all(studentId) as Array<{ guardian_user_id: string }>;
  return guardians.reduce(
    (total, guardian) => total + insertForRecipient(database, guardian.guardian_user_id, input).changes,
    0,
  );
};

export const notifySchoolGuardians = (
  database: AppDatabase,
  input: NotificationInput,
) => {
  const guardians = database.prepare(`
    SELECT id FROM users WHERE school_id = ? AND role = 'GUARDIAN'
  `).all(input.schoolId) as Array<{ id: string }>;
  return guardians.reduce(
    (total, guardian) => total + insertForRecipient(database, guardian.id, input).changes,
    0,
  );
};
