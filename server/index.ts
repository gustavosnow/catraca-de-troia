import { createApp } from './app';
import { createDatabase } from './db';
import {
  AccessEventSyncService,
  HttpAccessEventSyncTransport,
} from './modules/accessEvents/syncService';
import { cleanupOrphanAttachments } from './modules/attachments/service';

const port = Number(process.env.API_PORT ?? 3001);
const host = process.env.API_HOST ?? '127.0.0.1';
const database = createDatabase({ filename: process.env.DATABASE_PATH });
const syncRemoteUrl = process.env.SYNC_REMOTE_URL;
const syncSharedSecret = process.env.SYNC_SHARED_SECRET;
const syncService = syncRemoteUrl && syncSharedSecret
  ? new AccessEventSyncService(
      database,
      new HttpAccessEventSyncTransport(syncRemoteUrl, syncSharedSecret),
    )
  : undefined;
const app = createApp(database, { syncSharedSecret, syncService });

let syncTimer: NodeJS.Timeout | undefined;
const cleanupAttachments = () => {
  const now = new Date();
  const cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const removed = cleanupOrphanAttachments(database, cutoff, now.toISOString());
  if (removed > 0) console.log(`${removed} anexo(s) órfão(s) removido(s).`);
};
cleanupAttachments();
const attachmentCleanupTimer = setInterval(cleanupAttachments, 60 * 60 * 1000);
if (syncService) {
  const synchronize = () => void syncService.processDue().catch((error) => {
    console.error('Falha inesperada ao processar fila de sincronização.', error);
  });
  synchronize();
  syncTimer = setInterval(synchronize, 2_000);
}

const server = app.listen(port, host, () => {
  console.log(`API local em http://${host}:${port}`);
  console.log('Autenticação por sessão ativa; contas e credenciais atuais são apenas demonstrativas.');
  console.log(syncService
    ? `Sincronização de eventos ativa para ${syncRemoteUrl}.`
    : 'Eventos permanecem na fila local: SYNC_REMOTE_URL/SYNC_SHARED_SECRET não configurados.');
});

const shutdown = () => {
  if (syncTimer) clearInterval(syncTimer);
  clearInterval(attachmentCleanupTimer);
  server.close(() => {
    database.close();
    process.exit(0);
  });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
