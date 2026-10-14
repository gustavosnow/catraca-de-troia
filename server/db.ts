import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

const schema = `
  CREATE TABLE IF NOT EXISTS schools (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    school_id TEXT NOT NULL REFERENCES schools(id),
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('GUARDIAN', 'STAFF_GATE', 'STAFF_COORDINATION', 'STAFF_DIRECTION'))
  );

  CREATE TABLE IF NOT EXISTS students (
    id TEXT PRIMARY KEY,
    school_id TEXT NOT NULL REFERENCES schools(id),
    name TEXT NOT NULL,
    enrollment TEXT NOT NULL UNIQUE
  );

  CREATE TABLE IF NOT EXISTS guardian_student_links (
    guardian_user_id TEXT NOT NULL REFERENCES users(id),
    student_id TEXT NOT NULL REFERENCES students(id),
    status TEXT NOT NULL CHECK (status IN ('APPROVED', 'PENDING', 'REVOKED')),
    approved_at TEXT,
    approved_by TEXT REFERENCES users(id),
    PRIMARY KEY (guardian_user_id, student_id)
  );

  CREATE TABLE IF NOT EXISTS justifications (
    id TEXT PRIMARY KEY,
    school_id TEXT NOT NULL REFERENCES schools(id),
    student_id TEXT NOT NULL REFERENCES students(id),
    submitted_by TEXT NOT NULL REFERENCES users(id),
    absence_start_date TEXT NOT NULL,
    absence_end_date TEXT,
    reason_category TEXT NOT NULL CHECK (reason_category IN ('MEDICAL', 'DENTAL', 'FORCE_MAJEURE', 'FAMILY_COMMITMENT', 'OTHER')),
    description TEXT NOT NULL,
    attachment_name TEXT,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    submitted_at TEXT NOT NULL,
    reviewed_at TEXT,
    reviewed_by TEXT REFERENCES users(id),
    version INTEGER NOT NULL DEFAULT 1,
    idempotency_key TEXT NOT NULL,
    request_hash TEXT NOT NULL,
    UNIQUE (submitted_by, idempotency_key)
  );

  CREATE INDEX IF NOT EXISTS idx_justifications_school_status
    ON justifications(school_id, status, submitted_at DESC);
  CREATE INDEX IF NOT EXISTS idx_justifications_student
    ON justifications(student_id, submitted_at DESC);

  CREATE TABLE IF NOT EXISTS audit_log (
    id TEXT PRIMARY KEY,
    school_id TEXT NOT NULL REFERENCES schools(id),
    actor_id TEXT NOT NULL REFERENCES users(id),
    aggregate_type TEXT NOT NULL,
    aggregate_id TEXT NOT NULL,
    action TEXT NOT NULL,
    previous_state TEXT,
    new_state TEXT NOT NULL,
    occurred_at TEXT NOT NULL
  );
`;

const seed = `
  INSERT OR IGNORE INTO schools (id, name) VALUES
    ('school-1', 'EMEF Profª. Cecília Meireles');

  INSERT OR IGNORE INTO users (id, school_id, name, role) VALUES
    ('guardian-1', 'school-1', 'Claudia Mendes (Mãe)', 'GUARDIAN'),
    ('guardian-2', 'school-1', 'Rodrigo Oliveira (Pai)', 'GUARDIAN'),
    ('guardian-empty', 'school-1', 'Responsável sem vínculo', 'GUARDIAN'),
    ('staff-1', 'school-1', 'Carlos Mendes', 'STAFF_GATE'),
    ('staff-2', 'school-1', 'Profª. Mariana Costa', 'STAFF_COORDINATION'),
    ('staff-3', 'school-1', 'Diretor Valdemar Ramos', 'STAFF_DIRECTION');

  INSERT OR IGNORE INTO students (id, school_id, name, enrollment) VALUES
    ('std-1', 'school-1', 'Ana Clara de Souza Mendes', '2024-0891'),
    ('std-13', 'school-1', 'Arthur Mendes de Souza', '2024-0318'),
    ('std-2', 'school-1', 'Gabriel Henrique Oliveira', '2024-0914');

  INSERT OR IGNORE INTO guardian_student_links
    (guardian_user_id, student_id, status, approved_at, approved_by) VALUES
    ('guardian-1', 'std-1', 'APPROVED', '2026-10-13T12:00:00.000Z', 'staff-2'),
    ('guardian-1', 'std-13', 'APPROVED', '2026-10-13T12:00:00.000Z', 'staff-2'),
    ('guardian-2', 'std-2', 'APPROVED', '2026-10-13T12:00:00.000Z', 'staff-2');
`;

export interface DatabaseOptions {
  filename?: string;
  seedDemoData?: boolean;
}

export const createDatabase = (options: DatabaseOptions = {}) => {
  const filename = options.filename ?? path.resolve('.data/catraca-de-troia.sqlite');
  if (filename !== ':memory:') mkdirSync(path.dirname(filename), { recursive: true });

  const database = new Database(filename);
  database.pragma('foreign_keys = ON');
  if (filename !== ':memory:') database.pragma('journal_mode = WAL');
  database.exec(schema);
  if (options.seedDemoData ?? true) database.exec(seed);
  return database;
};

export type AppDatabase = ReturnType<typeof createDatabase>;
