import path from 'node:path';
import { createVerifiedBackup } from './databaseBackup';

const source = path.resolve(process.env.DATABASE_PATH || '.data/catraca-de-troia.sqlite');
const destination = path.resolve(process.env.BACKUP_DIRECTORY || '.data/backups');

createVerifiedBackup(source, destination)
  .then((result) => {
    console.log(`Backup verificado criado em ${result.filename} (${result.sizeBytes} bytes).`);
  })
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : 'Falha ao criar backup.');
    process.exitCode = 1;
  });
