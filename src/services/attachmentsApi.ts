import {
  ATTACHMENT_CONTENT_TYPES,
  AttachmentContentType,
  AttachmentRecord,
  MAX_ATTACHMENT_BYTES,
} from '../../shared/contracts/attachments';
import { authenticatedRawRequest, authenticatedRequest } from './authApi';

export const attachmentsApi = {
  upload: async (file: File) => {
    if (!ATTACHMENT_CONTENT_TYPES.includes(file.type as AttachmentContentType)) {
      throw new Error('Use um arquivo PDF, JPG ou PNG.');
    }
    if (file.size === 0 || file.size > MAX_ATTACHMENT_BYTES) {
      throw new Error('O anexo deve ter no máximo 2 MB.');
    }
    return authenticatedRequest<AttachmentRecord>('/api/v1/attachments', {
      method: 'POST',
      headers: {
        'Content-Type': file.type,
        'X-File-Name': encodeURIComponent(file.name),
      },
      body: await file.arrayBuffer(),
    });
  },

  download: async (id: string, fileName: string) => {
    const response = await authenticatedRawRequest(`/api/v1/attachments/${id}`);
    const url = URL.createObjectURL(await response.blob());
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  },

  discard: (id: string) => authenticatedRawRequest(`/api/v1/attachments/${id}`, { method: 'DELETE' }),
};
