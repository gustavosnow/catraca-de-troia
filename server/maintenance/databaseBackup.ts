import Database from 'better-sqlite3';
import { copyFileSync, existsSync, mkdirSync, renameSync, statSync, unlinkSync } from 'node:fs';
import path from 'node:path';

const assertIntegrity = (filename: string) => {
  const database = new Database(filename, { readonly: true, fileMustExist: true });
  try {
    const result = database.pragma('integrity_check') as Array<{ integrity_check: string }>;
    if (result.length !== 1 || result[0].integrity_check !== 'ok') {
      throw new Error('A verificação de integridade do SQLite falhou.');
    }
  } finally {
    database.close();
  }
};

export const createVerifiedBackup = async (
  sourceFilename: string,
  destinationDirectory: string,
  now: Date = new Date(),
) => {
  if (!existsSync(sourceFilename)) throw new Error('Banco de origem não encontrado.');
  mkdirSync(destinationDirectory, { recursive: true });
  const timestamp = now.toISOString().replace(/[:.]/g, '-');
  const destination = path.join(destinationDirectory, `catraca-de-troia-${timestamp}.sqlite`);
  const temporary = `${destination}.partial`;
  if (existsSync(destination) || existsSync(temporary)) throw new Error('O destino do backup já existe.');

  const database = new Database(sourceFilename, { readonly: true, fileMustExist: true });
  try {
    await database.backup(temporary);
    assertIntegrity(temporary);
    renameSync(temporary, destination);
  } catch (error) {
    if (existsSync(temporary)) unlinkSync(temporary);
    throw error;
  } finally {
    database.close();
  }
  return { filename: destination, sizeBytes: statSync(destination).size };
};

export const restoreBackupToNewFile = (backupFilename: string, destinationFilename: string) => {
  if (!existsSync(backupFilename)) throw new Error('Arquivo de backup não encontrado.');
  if (existsSync(destinationFilename)) {
    throw new Error('A restauração não sobrescreve um arquivo existente.');
  }
  mkdirSync(path.dirname(destinationFilename), { recursive: true });
  assertIntegrity(backupFilename);
  copyFileSync(backupFilename, destinationFilename);
  try {
    assertIntegrity(destinationFilename);
  } catch (error) {
    unlinkSync(destinationFilename);
    throw error;
  }
  return destinationFilename;
};
