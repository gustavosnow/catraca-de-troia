import type { AccessDenialRecord, AccessDeviceRecord } from '../../shared/contracts/accessDevices';
import { authenticatedRequest } from './authApi';

/** Consultas do protótipo de reconhecimento facial (MC-036), restritas a perfis escolares. */
export const accessDevicesApi = {
  listDevices: () => authenticatedRequest<AccessDeviceRecord[]>('/api/v1/access-devices'),
  listDenials: (limit = 20) =>
    authenticatedRequest<AccessDenialRecord[]>(`/api/v1/access-denials?limit=${limit}`),
};
