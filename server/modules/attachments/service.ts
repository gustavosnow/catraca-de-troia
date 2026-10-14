import { createHash, randomUUID } from 'node:crypto';
import type {
  AttachmentContentType,
  AttachmentRecord,
} from '../../../shared/contracts/attachments';
import { MAX_ATTACHMENT_BYTES } from '../../../shared/contracts/attachments';
import type { DemoActor } from '../../../shared/contracts/justifications';
import type { AppDatabase } from '../../db';
import { forbidden, invalidRequest, notFound } from '../../errors';

interface AttachmentRow {
  id: string;
  school_id: string;
  uploaded_by: string;
  file_name: string;
  content_type: AttachmentContentType;
  size_bytes: number;
  sha256: string;
  validation_status: 'BASIC_VALIDATION_ONLY';
  content: Buffer;
  aggregate_id: string | null;
  created_at: string;
}

const mapAttachment = (row: AttachmentRow): AttachmentRecord => ({
  id: row.id,
  fileName: row.file_name,
  contentType: row.content_type,
  sizeBytes: row.size_bytes,
  sha256: row.sha256,
  validationStatus: row.validation_status,
  createdAt: row.created_at,
});

const hasExpectedSignature = (contentType: AttachmentContentType, content: Buffer) => {
  if (contentType === 'application/pdf') return content.subarray(0, 5).toString('ascii') === '%PDF-';
  if (contentType === 'image/png') {
    return content.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  }
  return content.length >= 3 && content[0] === 0xff && content[1] === 0xd8 && content[2] === 0xff;
};

export class AttachmentService {
  constructor(
    private readonly database: AppDatabase,
    private readonly now: () => string = () => new Date().toISOString(),
  ) {}

  upload(
    actor: DemoActor,
    fileName: string,
    contentType: AttachmentContentType,
    content: Buffer,
  ): AttachmentRecord {
    if (actor.role !== 'GUARDIAN') throw forbidden('Somente responsáveis enviam anexos de justificativas.');
    const safeName = fileName.trim();
    if (!safeName || safeName.length > 180 || /[\\/\u0000-\u001f]/.test(safeName)) {
      throw invalidRequest('Nome de arquivo inválido.');
    }
    if (content.length === 0 || content.length > MAX_ATTACHMENT_BYTES) {
      throw invalidRequest('O anexo deve ter entre 1 byte e 2 MB.');
    }
    if (!hasExpectedSignature(contentType, content)) {
      throw invalidRequest('O conteúdo do arquivo não corresponde ao tipo informado.');
    }

    const id = randomUUID();
    const createdAt = this.now();
    const sha256 = createHash('sha256').update(content).digest('hex');
    this.database.transaction(() => {
      this.database.prepare(`
        INSERT INTO attachments (
          id, school_id, uploaded_by, purpose, file_name, content_type, size_bytes,
          sha256, validation_status, content, created_at
        ) VALUES (?, ?, ?, 'JUSTIFICATION', ?, ?, ?, ?, 'BASIC_VALIDATION_ONLY', ?, ?)
      `).run(id, actor.schoolId, actor.id, safeName, contentType, content.length, sha256, content, createdAt);
      this.database.prepare(`
        INSERT INTO audit_log (
          id, school_id, actor_id, aggregate_type, aggregate_id, action,
          previous_state, new_state, occurred_at
        ) VALUES (?, ?, ?, 'ATTACHMENT', ?, 'UPLOADED', NULL, ?, ?)
      `).run(randomUUID(), actor.schoolId, actor.id, id, JSON.stringify({
        fileName: safeName,
        contentType,
        sizeBytes: content.length,
        validationStatus: 'BASIC_VALIDATION_ONLY',
      }), createdAt);
    })();
    return mapAttachment(this.find(id, actor.schoolId));
  }

  download(actor: DemoActor, id: string): { metadata: AttachmentRecord; content: Buffer } {
    const row = this.find(id, actor.schoolId);
    if (actor.role === 'GUARDIAN') {
      if (row.uploaded_by !== actor.id) throw notFound('Anexo não encontrado.');
    } else if (!['STAFF_COORDINATION', 'STAFF_DIRECTION'].includes(actor.role) || !row.aggregate_id) {
      throw forbidden('O perfil não possui permissão para baixar este anexo.');
    }
    return { metadata: mapAttachment(row), content: row.content };
  }

  discard(actor: DemoActor, id: string) {
    if (actor.role !== 'GUARDIAN') throw forbidden();
    const row = this.find(id, actor.schoolId);
    if (row.uploaded_by !== actor.id || row.aggregate_id) throw notFound('Anexo não encontrado.');
    const occurredAt = this.now();
    this.database.transaction(() => {
      this.database.prepare('DELETE FROM attachments WHERE id = ? AND aggregate_id IS NULL').run(id);
      this.database.prepare(`
        INSERT INTO audit_log (
          id, school_id, actor_id, aggregate_type, aggregate_id, action,
          previous_state, new_state, occurred_at
        ) VALUES (?, ?, ?, 'ATTACHMENT', ?, 'DISCARDED', ?, '{}', ?)
      `).run(randomUUID(), actor.schoolId, actor.id, id, JSON.stringify({ fileName: row.file_name }), occurredAt);
    })();
  }

  private find(id: string, schoolId: string): AttachmentRow {
    const row = this.database.prepare(`
      SELECT * FROM attachments WHERE id = ? AND school_id = ?
    `).get(id, schoolId) as AttachmentRow | undefined;
    if (!row) throw notFound('Anexo não encontrado.');
    return row;
  }
}
