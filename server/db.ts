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

  CREATE TABLE IF NOT EXISTS access_events (
    id TEXT PRIMARY KEY,
    school_id TEXT NOT NULL REFERENCES schools(id),
    student_id TEXT NOT NULL REFERENCES students(id),
    direction TEXT NOT NULL CHECK (direction IN ('ENTRY', 'EXIT')),
    occurred_at TEXT NOT NULL,
    turnstile_id TEXT NOT NULL,
    turnstile_name TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('AUTHORIZED', 'MANUAL_RELEASE')),
    method TEXT NOT NULL CHECK (method IN ('FACIAL', 'MANUAL')),
    created_by TEXT NOT NULL REFERENCES users(id),
    source TEXT NOT NULL CHECK (source IN ('DEMO_SIMULATION')),
    whatsapp_status TEXT NOT NULL CHECK (whatsapp_status IN ('DELIVERED', 'PENDING')),
    push_status TEXT NOT NULL CHECK (push_status IN ('DELIVERED', 'PENDING')),
    reason TEXT,
    idempotency_key TEXT NOT NULL,
    request_hash TEXT NOT NULL,
    UNIQUE (created_by, idempotency_key)
  );

  CREATE INDEX IF NOT EXISTS idx_access_events_school_time
    ON access_events(school_id, occurred_at DESC);
  CREATE INDEX IF NOT EXISTS idx_access_events_student_time
    ON access_events(student_id, occurred_at DESC);

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
    ('guardian-3', 'school-1', 'Silvia Ferreira (Mãe)', 'GUARDIAN'),
    ('guardian-4', 'school-1', 'Carlos Costa (Pai)', 'GUARDIAN'),
    ('guardian-5', 'school-1', 'Marilene Cavalcanti (Mãe)', 'GUARDIAN'),
    ('guardian-empty', 'school-1', 'Responsável sem vínculo', 'GUARDIAN'),
    ('staff-1', 'school-1', 'Carlos Mendes', 'STAFF_GATE'),
    ('staff-2', 'school-1', 'Profª. Mariana Costa', 'STAFF_COORDINATION'),
    ('staff-3', 'school-1', 'Diretor Valdemar Ramos', 'STAFF_DIRECTION');

  INSERT OR IGNORE INTO students (id, school_id, name, enrollment) VALUES
    ('std-1', 'school-1', 'Ana Clara de Souza Mendes', '2024-0891'),
    ('std-13', 'school-1', 'Arthur Mendes de Souza', '2024-0318'),
    ('std-2', 'school-1', 'Gabriel Henrique Oliveira', '2024-0914'),
    ('std-14', 'school-1', 'Sophia Oliveira', '2024-1102'),
    ('std-3', 'school-1', 'Beatriz Lima Cavalcanti', '2024-0745'),
    ('std-4', 'school-1', 'Lucas Ferreira Santos', '2024-1022'),
    ('std-5', 'school-1', 'Mariana Duarte Costa', '2024-0633'),
    ('std-6', 'school-1', 'Matheus Vinícius Pereira', '2024-1108'),
    ('std-7', 'school-1', 'Isabela Rocha Alcantara', '2024-0551'),
    ('std-8', 'school-1', 'Thiago Nogueira Ramos', '2024-0419'),
    ('std-9', 'school-1', 'Camila Fernandes Ribeiro', '2024-0320'),
    ('std-10', 'school-1', 'Felipe Cardoso Martins', '2024-1290'),
    ('std-11', 'school-1', 'Larissa Vieira de Camargo', '2024-1311'),
    ('std-12', 'school-1', 'Enzo Gabriel Soares', '2024-0182');

  INSERT OR IGNORE INTO guardian_student_links
    (guardian_user_id, student_id, status, approved_at, approved_by) VALUES
    ('guardian-1', 'std-1', 'APPROVED', '2026-10-13T12:00:00.000Z', 'staff-2'),
    ('guardian-1', 'std-13', 'APPROVED', '2026-10-13T12:00:00.000Z', 'staff-2'),
    ('guardian-2', 'std-2', 'APPROVED', '2026-10-13T12:00:00.000Z', 'staff-2'),
    ('guardian-2', 'std-14', 'APPROVED', '2026-10-13T12:00:00.000Z', 'staff-2'),
    ('guardian-3', 'std-4', 'APPROVED', '2026-10-13T12:00:00.000Z', 'staff-2'),
    ('guardian-4', 'std-5', 'APPROVED', '2026-10-13T12:00:00.000Z', 'staff-2'),
    ('guardian-5', 'std-3', 'APPROVED', '2026-10-13T12:00:00.000Z', 'staff-2');
`;

const demoWorkflowSeed = `
  INSERT OR IGNORE INTO justifications (
    id, school_id, student_id, submitted_by, absence_start_date, reason_category,
    description, attachment_name, status, submitted_at, reviewed_at, reviewed_by,
    version, idempotency_key, request_hash
  ) VALUES (
    'abs-1', 'school-1', 'std-1', 'guardian-1', '2026-08-24', 'MEDICAL',
    'Consulta pediátrica de rotina na UBS do bairro com atestado médico demonstrativo.',
    'atestado_pediatria_2408.pdf', 'APPROVED', '2026-08-24T14:20:00.000Z',
    '2026-08-25T12:00:00.000Z', 'staff-2', 2, 'seed-abs-1', 'seed'
  );

  INSERT OR IGNORE INTO access_events (
    id, school_id, student_id, direction, occurred_at, turnstile_id, turnstile_name,
    status, method, created_by, source, whatsapp_status, push_status, reason,
    idempotency_key, request_hash
  ) VALUES
    ('event-seed-1', 'school-1', 'std-1', 'ENTRY', '2026-10-14T10:10:00.000Z',
      'cat-01', 'Catraca 01 (Portão Principal)', 'AUTHORIZED', 'FACIAL', 'staff-1',
      'DEMO_SIMULATION', 'DELIVERED', 'DELIVERED', NULL, 'seed-event-1', 'seed'),
    ('event-seed-2', 'school-1', 'std-13', 'ENTRY', '2026-10-14T10:15:00.000Z',
      'cat-02', 'Catraca 02 (Fundamental I)', 'AUTHORIZED', 'FACIAL', 'staff-1',
      'DEMO_SIMULATION', 'DELIVERED', 'DELIVERED', NULL, 'seed-event-2', 'seed'),
    ('event-seed-3', 'school-1', 'std-2', 'ENTRY', '2026-10-14T10:20:00.000Z',
      'cat-01', 'Catraca 01 (Portão Principal)', 'AUTHORIZED', 'FACIAL', 'staff-1',
      'DEMO_SIMULATION', 'DELIVERED', 'DELIVERED', NULL, 'seed-event-3', 'seed');
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
  const accessEventColumns = database.prepare('PRAGMA table_info(access_events)').all() as Array<{ name: string }>;
  if (!accessEventColumns.some((column) => column.name === 'reason')) {
    database.exec('ALTER TABLE access_events ADD COLUMN reason TEXT');
  }
  if (options.seedDemoData ?? true) database.exec(seed);
  if ((options.seedDemoData ?? true) && options.filename === undefined) {
    database.exec(demoWorkflowSeed);
  }
  return database;
};

export type AppDatabase = ReturnType<typeof createDatabase>;
