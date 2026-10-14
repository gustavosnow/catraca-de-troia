import { createApp } from './app';
import { createDatabase } from './db';

const port = Number(process.env.API_PORT ?? 3001);
const host = process.env.API_HOST ?? '127.0.0.1';
const database = createDatabase();
const app = createApp(database);

const server = app.listen(port, host, () => {
  console.log(`API local em http://${host}:${port}`);
  console.log('Autenticação por sessão ativa; contas e credenciais atuais são apenas demonstrativas.');
});

const shutdown = () => {
  server.close(() => {
    database.close();
    process.exit(0);
  });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
