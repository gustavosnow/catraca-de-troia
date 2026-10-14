import { createApp } from './app';
import { createDatabase } from './db';

const port = Number(process.env.API_PORT ?? 3001);
const host = process.env.API_HOST ?? '127.0.0.1';
const demoAuthEnabled = process.env.DEMO_AUTH === 'true';
const database = createDatabase();
const app = createApp(database, { demoAuthEnabled });

const server = app.listen(port, host, () => {
  console.log(`API local em http://${host}:${port}`);
  console.log(
    demoAuthEnabled
      ? 'DEMO_AUTH ativo: use X-Demo-User-Id; não exponha este modo em produção.'
      : 'DEMO_AUTH inativo: rotas protegidas permanecem indisponíveis.',
  );
});

const shutdown = () => {
  server.close(() => {
    database.close();
    process.exit(0);
  });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
