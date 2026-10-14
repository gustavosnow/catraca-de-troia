import assert from 'node:assert/strict';
import Database from 'better-sqlite3';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { createDatabase } from '../db';
import { createVerifiedBackup, restoreBackupToNewFile } from '../maintenance/databaseBackup';

test('backup SQLite é verificado e restaurado em novo arquivo sem sobrescrita', async () => {
  const directory = mkdtempSync(path.join(tmpdir(), 'catraca-backup-'));
  try {
    const source = path.join(directory, 'source.sqlite');
    const backupDirectory = path.join(directory, 'backups');
    const restored = path.join(directory, 'restored', 'database.sqlite');
    const database = createDatabase({ filename: source });
    database.prepare("INSERT INTO schools (id, name) VALUES ('school-backup', 'Escola do backup')").run();
    database.close();

    const backup = await createVerifiedBackup(
      source,
      backupDirectory,
      new Date('2026-10-14T21:00:00.000Z'),
    );

    const changed = new Database(source);
    changed.prepare("DELETE FROM schools WHERE id = 'school-backup'").run();
    changed.close();

    restoreBackupToNewFile(backup.filename, restored);
    const restoredDatabase = new Database(restored, { readonly: true });
    assert.equal(
      (restoredDatabase.prepare("SELECT COUNT(*) AS count FROM schools WHERE id = 'school-backup'").get() as { count: number }).count,
      1,
    );
    restoredDatabase.close();
    assert.throws(() => restoreBackupToNewFile(backup.filename, restored), /não sobrescreve/);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
