export const ATTACHMENT_CONTENT_TYPES = ['application/pdf', 'image/jpeg', 'image/png'] as const;
export type AttachmentContentType = (typeof ATTACHMENT_CONTENT_TYPES)[number];
export const MAX_ATTACHMENT_BYTES = 2 * 1024 * 1024;

export interface AttachmentRecord {
  id: string;
  fileName: string;
  contentType: AttachmentContentType;
  sizeBytes: number;
  sha256: string;
  validationStatus: 'BASIC_VALIDATION_ONLY';
  createdAt: string;
}
