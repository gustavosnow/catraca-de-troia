import { Router } from 'express';
import type { ProcessNotificationDeliveriesRequest } from '../../../shared/contracts/notificationDelivery';
import type { ActorRequest } from '../../auth/sessionAuth';
import { invalidRequest } from '../../errors';
import { NotificationDeliveryService } from './service';

export const createNotificationDeliveryRouter = (service: NotificationDeliveryService) => {
  const router = Router();
  router.get('/notification-deliveries', (request, response) => {
    response.json({ data: service.snapshot((request as ActorRequest).actor) });
  });
  router.post('/notification-deliveries/process', (request, response) => {
    const value = request.body as Partial<ProcessNotificationDeliveriesRequest> | null;
    if (!value || (value.outcome !== 'DELIVER' && value.outcome !== 'FAIL_RETRY')) {
      throw invalidRequest('Informe o resultado da entrega demonstrativa.');
    }
    response.json({ data: service.process((request as ActorRequest).actor, value.outcome) });
  });
  router.post('/notification-deliveries/retry', (request, response) => {
    response.json({ data: service.retry((request as ActorRequest).actor) });
  });
  return router;
};
