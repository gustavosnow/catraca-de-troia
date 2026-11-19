import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

/**
 * Definição atual de access_events. Também é usada para reconstruir bases
 * antigas, cujo CHECK de `source` aceitava apenas DEMO_SIMULATION (MC-036).
 */
const accessEventsColumns = `
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
    source TEXT NOT NULL CHECK (source IN ('DEMO_SIMULATION', 'FACE_PROTOTYPE', 'ASSISTED_PASSAGE')),
    whatsapp_status TEXT NOT NULL CHECK (whatsapp_status IN ('DELIVERED', 'PENDING')),
    push_status TEXT NOT NULL CHECK (push_status IN ('DELIVERED', 'PENDING')),
    reason TEXT,
    idempotency_key TEXT NOT NULL,
    request_hash TEXT NOT NULL,
    origin_node_id TEXT,
    origin_event_id TEXT,
    sync_payload_hash TEXT,
    device_id TEXT,
    match_score REAL,
    inference_ms REAL,
    UNIQUE (created_by, idempotency_key)`;

const accessEventsColumnNames = [
  'id', 'school_id', 'student_id', 'direction', 'occurred_at', 'turnstile_id',
  'turnstile_name', 'status', 'method', 'created_by', 'source', 'whatsapp_status',
  'push_status', 'reason', 'idempotency_key', 'request_hash', 'origin_node_id',
  'origin_event_id', 'sync_payload_hash', 'device_id', 'match_score', 'inference_ms',
];

/** Reconstrói access_events preservando todas as linhas, quando o CHECK é antigo. */
const migrateAccessEventsSourceCheck = (database: Database.Database) => {
  const table = database.prepare(`
    SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'access_events'
  `).get() as { sql: string } | undefined;
  // Reconstrói quando o CHECK de origem não conhece a origem mais recente.
  if (!table || table.sql.includes('ASSISTED_PASSAGE')) return;

  const columns = accessEventsColumnNames.join(', ');
  database.pragma('foreign_keys = OFF');
  try {
    database.transaction(() => {
      database.exec(`
        CREATE TABLE access_events_mc035 (${accessEventsColumns}
        );
        INSERT INTO access_events_mc035 (${columns})
          SELECT ${columns} FROM access_events;
        DROP TABLE access_events;
        ALTER TABLE access_events_mc035 RENAME TO access_events;
        CREATE INDEX IF NOT EXISTS idx_access_events_school_time
          ON access_events(school_id, occurred_at DESC);
        CREATE INDEX IF NOT EXISTS idx_access_events_student_time
          ON access_events(student_id, occurred_at DESC);
      `);
      const violations = database.pragma('foreign_key_check(access_events)') as unknown[];
      if (violations.length > 0) {
        throw new Error('Migração de access_events encontrou referências inválidas.');
      }
    })();
  } finally {
    database.pragma('foreign_keys = ON');
  }
};

const schema = `
  CREATE TABLE IF NOT EXISTS schools (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    school_id TEXT NOT NULL REFERENCES schools(id),
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('GUARDIAN', 'STAFF_GATE', 'STAFF_COORDINATION', 'STAFF_DIRECTION')),
    email TEXT,
    phone TEXT,
    functional_registry TEXT,
    account_status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (account_status IN ('ACTIVE', 'BLOCKED')),
    account_version INTEGER NOT NULL DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS auth_identities (
    normalized_identifier TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    password_salt TEXT NOT NULL,
    password_hash TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_auth_identities_user ON auth_identities(user_id);

  CREATE TABLE IF NOT EXISTS auth_sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    token_hash TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    last_seen_at TEXT NOT NULL,
    revoked_at TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_auth_sessions_user ON auth_sessions(user_id, expires_at DESC);

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
    revoked_at TEXT,
    revoked_by TEXT REFERENCES users(id),
    revocation_reason TEXT,
    version INTEGER NOT NULL DEFAULT 1,
    PRIMARY KEY (guardian_user_id, student_id)
  );

  CREATE TABLE IF NOT EXISTS guardian_link_requests (
    id TEXT PRIMARY KEY,
    school_id TEXT NOT NULL REFERENCES schools(id),
    guardian_user_id TEXT NOT NULL REFERENCES users(id),
    student_id TEXT NOT NULL REFERENCES students(id),
    relationship TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    submitted_at TEXT NOT NULL,
    reviewed_at TEXT,
    reviewed_by TEXT REFERENCES users(id),
    review_note TEXT,
    version INTEGER NOT NULL DEFAULT 1,
    idempotency_key TEXT NOT NULL,
    request_hash TEXT NOT NULL,
    UNIQUE (guardian_user_id, idempotency_key)
  );

  CREATE INDEX IF NOT EXISTS idx_guardian_link_requests_school_status
    ON guardian_link_requests(school_id, status, submitted_at DESC);
  CREATE INDEX IF NOT EXISTS idx_guardian_link_requests_guardian
    ON guardian_link_requests(guardian_user_id, submitted_at DESC);

  CREATE TABLE IF NOT EXISTS attachments (
    id TEXT PRIMARY KEY,
    school_id TEXT NOT NULL REFERENCES schools(id),
    uploaded_by TEXT NOT NULL REFERENCES users(id),
    purpose TEXT NOT NULL CHECK (purpose IN ('JUSTIFICATION')),
    file_name TEXT NOT NULL,
    content_type TEXT NOT NULL CHECK (content_type IN ('application/pdf', 'image/jpeg', 'image/png')),
    size_bytes INTEGER NOT NULL,
    sha256 TEXT NOT NULL,
    validation_status TEXT NOT NULL CHECK (validation_status IN ('BASIC_VALIDATION_ONLY')),
    content BLOB NOT NULL,
    aggregate_type TEXT,
    aggregate_id TEXT,
    created_at TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_attachments_owner
    ON attachments(uploaded_by, created_at DESC);

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
    attachment_id TEXT REFERENCES attachments(id),
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
${accessEventsColumns}
  );

  CREATE TABLE IF NOT EXISTS access_devices (
    id TEXT PRIMARY KEY,
    school_id TEXT NOT NULL REFERENCES schools(id),
    name TEXT NOT NULL,
    turnstile_id TEXT NOT NULL,
    turnstile_name TEXT NOT NULL,
    direction TEXT NOT NULL CHECK (direction IN ('ENTRY', 'EXIT')),
    operator_user_id TEXT NOT NULL REFERENCES users(id),
    min_score REAL NOT NULL CHECK (min_score > 0 AND min_score < 1),
    token_hash TEXT NOT NULL UNIQUE,
    active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
    created_at TEXT NOT NULL,
    last_seen_at TEXT,
    camera_source TEXT
  );

  CREATE TABLE IF NOT EXISTS access_denials (
    id TEXT PRIMARY KEY,
    school_id TEXT NOT NULL REFERENCES schools(id),
    device_id TEXT NOT NULL REFERENCES access_devices(id),
    capture_id TEXT NOT NULL,
    turnstile_id TEXT NOT NULL,
    turnstile_name TEXT NOT NULL,
    direction TEXT NOT NULL CHECK (direction IN ('ENTRY', 'EXIT')),
    reason TEXT NOT NULL CHECK (reason IN ('UNKNOWN_FACE', 'LOW_SCORE', 'STUDENT_NOT_REGISTERED')),
    student_id TEXT REFERENCES students(id),
    match_score REAL NOT NULL,
    inference_ms REAL NOT NULL,
    occurred_at TEXT NOT NULL,
    UNIQUE (device_id, capture_id)
  );

  CREATE INDEX IF NOT EXISTS idx_access_denials_school_time
    ON access_denials(school_id, occurred_at DESC);

  CREATE TABLE IF NOT EXISTS access_event_sync_queue (
    event_id TEXT PRIMARY KEY REFERENCES access_events(id) ON DELETE CASCADE,
    school_id TEXT NOT NULL REFERENCES schools(id),
    state TEXT NOT NULL CHECK (state IN ('PENDING', 'PROCESSING', 'SYNCED', 'CONFLICT')),
    attempt_count INTEGER NOT NULL DEFAULT 0,
    available_at TEXT NOT NULL,
    lease_expires_at TEXT,
    last_attempt_at TEXT,
    synced_at TEXT,
    remote_event_id TEXT,
    last_error_code TEXT,
    last_error_message TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_access_event_sync_due
    ON access_event_sync_queue(state, available_at);
  CREATE INDEX IF NOT EXISTS idx_access_event_sync_school
    ON access_event_sync_queue(school_id, state, updated_at DESC);

  CREATE TABLE IF NOT EXISTS school_notices (
    id TEXT PRIMARY KEY,
    school_id TEXT NOT NULL REFERENCES schools(id),
    title TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('GENERAL', 'PEDAGOGICAL', 'SECURITY', 'EVENTS', 'ON_CALL')),
    priority TEXT NOT NULL CHECK (priority IN ('URGENT', 'IMPORTANT', 'INFO')),
    author_label TEXT NOT NULL,
    role_label TEXT NOT NULL,
    summary TEXT NOT NULL,
    content TEXT NOT NULL,
    attachment_name TEXT,
    created_by TEXT NOT NULL REFERENCES users(id),
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    deleted_at TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_school_notices_school_time
    ON school_notices(school_id, created_at DESC);

  CREATE TABLE IF NOT EXISTS school_notice_reads (
    notice_id TEXT NOT NULL REFERENCES school_notices(id) ON DELETE CASCADE,
    guardian_user_id TEXT NOT NULL REFERENCES users(id),
    read_at TEXT NOT NULL,
    PRIMARY KEY (notice_id, guardian_user_id)
  );

  CREATE TABLE IF NOT EXISTS notification_dispatches (
    id TEXT PRIMARY KEY,
    school_id TEXT NOT NULL REFERENCES schools(id),
    notice_id TEXT NOT NULL REFERENCES school_notices(id),
    requested_by TEXT NOT NULL REFERENCES users(id),
    idempotency_key TEXT NOT NULL,
    created_at TEXT NOT NULL,
    UNIQUE (requested_by, idempotency_key)
  );

  CREATE TABLE IF NOT EXISTS in_app_notifications (
    id TEXT PRIMARY KEY,
    school_id TEXT NOT NULL REFERENCES schools(id),
    recipient_user_id TEXT NOT NULL REFERENCES users(id),
    type TEXT NOT NULL CHECK (type IN ('ENTRY', 'EXIT', 'NOTICE', 'ABSENCE', 'SECURITY')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    student_id TEXT REFERENCES students(id),
    context_label TEXT,
    source_type TEXT NOT NULL,
    source_id TEXT NOT NULL,
    created_at TEXT NOT NULL,
    read_at TEXT,
    UNIQUE (recipient_user_id, source_type, source_id)
  );

  CREATE INDEX IF NOT EXISTS idx_in_app_notifications_recipient
    ON in_app_notifications(recipient_user_id, created_at DESC);

  CREATE TABLE IF NOT EXISTS notification_delivery_queue (
    id TEXT PRIMARY KEY,
    school_id TEXT NOT NULL REFERENCES schools(id),
    notification_id TEXT NOT NULL UNIQUE REFERENCES in_app_notifications(id) ON DELETE CASCADE,
    recipient_user_id TEXT NOT NULL REFERENCES users(id),
    channel TEXT NOT NULL CHECK (channel IN ('PUSH_DEMO')),
    state TEXT NOT NULL CHECK (state IN ('PENDING', 'DELIVERED', 'FAILED')),
    attempt_count INTEGER NOT NULL DEFAULT 0,
    available_at TEXT NOT NULL,
    last_attempt_at TEXT,
    delivered_at TEXT,
    last_error TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_notification_delivery_due
    ON notification_delivery_queue(school_id, state, available_at);

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

export interface DatabaseOptions {
  filename?: string;
}

export const createDatabase = (options: DatabaseOptions = {}) => {
  const filename = options.filename ?? path.resolve('.data/catraca-de-troia.sqlite');
  if (filename !== ':memory:') mkdirSync(path.dirname(filename), { recursive: true });

  const database = new Database(filename);
  database.pragma('foreign_keys = ON');
  if (filename !== ':memory:') database.pragma('journal_mode = WAL');
  database.exec(schema);
  const userColumns = database.prepare('PRAGMA table_info(users)').all() as Array<{ name: string }>;
  const userMigrations = [
    ['email', 'TEXT'],
    ['phone', 'TEXT'],
    ['functional_registry', 'TEXT'],
    ['account_status', "TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (account_status IN ('ACTIVE', 'BLOCKED'))"],
    ['account_version', 'INTEGER NOT NULL DEFAULT 1'],
  ] as const;
  for (const [column, definition] of userMigrations) {
    if (!userColumns.some((candidate) => candidate.name === column)) {
      database.exec(`ALTER TABLE users ADD COLUMN ${column} ${definition}`);
    }
  }
  const accessEventColumns = database.prepare('PRAGMA table_info(access_events)').all() as Array<{ name: string }>;
  if (!accessEventColumns.some((column) => column.name === 'reason')) {
    database.exec('ALTER TABLE access_events ADD COLUMN reason TEXT');
  }
  if (!accessEventColumns.some((column) => column.name === 'origin_node_id')) {
    database.exec('ALTER TABLE access_events ADD COLUMN origin_node_id TEXT');
  }
  if (!accessEventColumns.some((column) => column.name === 'origin_event_id')) {
    database.exec('ALTER TABLE access_events ADD COLUMN origin_event_id TEXT');
  }
  if (!accessEventColumns.some((column) => column.name === 'sync_payload_hash')) {
    database.exec('ALTER TABLE access_events ADD COLUMN sync_payload_hash TEXT');
  }
  for (const [column, definition] of [
    ['device_id', 'TEXT'],
    ['match_score', 'REAL'],
    ['inference_ms', 'REAL'],
  ] as const) {
    if (!accessEventColumns.some((candidate) => candidate.name === column)) {
      database.exec(`ALTER TABLE access_events ADD COLUMN ${column} ${definition}`);
    }
  }
  migrateAccessEventsSourceCheck(database);
  const justificationColumns = database.prepare('PRAGMA table_info(justifications)').all() as Array<{ name: string }>;
  if (!justificationColumns.some((column) => column.name === 'attachment_id')) {
    database.exec('ALTER TABLE justifications ADD COLUMN attachment_id TEXT REFERENCES attachments(id)');
  }
  const deviceColumns = database.prepare('PRAGMA table_info(access_devices)').all() as Array<{ name: string }>;
  if (!deviceColumns.some((column) => column.name === 'camera_source')) {
    database.exec('ALTER TABLE access_devices ADD COLUMN camera_source TEXT');
  }
  const linkColumns = database.prepare('PRAGMA table_info(guardian_student_links)').all() as Array<{ name: string }>;
  const linkMigrations = [
    ['revoked_at', 'TEXT'],
    ['revoked_by', 'TEXT REFERENCES users(id)'],
    ['revocation_reason', 'TEXT'],
    ['version', 'INTEGER NOT NULL DEFAULT 1'],
  ] as const;
  for (const [column, definition] of linkMigrations) {
    if (!linkColumns.some((candidate) => candidate.name === column)) {
      database.exec(`ALTER TABLE guardian_student_links ADD COLUMN ${column} ${definition}`);
    }
  }
  // Parentesco informado na solicitação aprovada (exibido na ficha do estudante).
  if (!linkColumns.some((candidate) => candidate.name === 'relationship')) {
    database.exec('ALTER TABLE guardian_student_links ADD COLUMN relationship TEXT');
  }
  // Ficha escolar do estudante: dados mantidos pela escola, lidos pelo painel e pelo portal.
  const studentColumns = database.prepare('PRAGMA table_info(students)').all() as Array<{ name: string }>;
  const studentMigrations = [
    ['class_name', 'TEXT'],
    ['shift', "TEXT CHECK (shift IN ('MORNING', 'AFTERNOON', 'FULL_TIME'))"],
    ['stage', "TEXT CHECK (stage IN ('EARLY_YEARS', 'FINAL_YEARS'))"],
    ['homeroom_teacher', 'TEXT'],
    ['birth_date', 'TEXT'],
    ['exit_authorization', "TEXT CHECK (exit_authorization IN ('GUARDIAN_ONLY', 'SCHOOL_TRANSPORT', 'UNACCOMPANIED'))"],
    ['emergency_contact', 'TEXT'],
    ['status', "TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'SUSPENDED', 'ON_LEAVE'))"],
  ] as const;
  for (const [column, definition] of studentMigrations) {
    if (!studentColumns.some((candidate) => candidate.name === column)) {
      database.exec(`ALTER TABLE students ADD COLUMN ${column} ${definition}`);
    }
  }
  database.exec(`
    UPDATE access_events
    SET origin_node_id = COALESCE(origin_node_id, 'legacy-local'),
        origin_event_id = COALESCE(origin_event_id, id),
        sync_payload_hash = COALESCE(sync_payload_hash, request_hash)
    WHERE origin_node_id IS NULL OR origin_event_id IS NULL OR sync_payload_hash IS NULL;
    CREATE UNIQUE INDEX IF NOT EXISTS idx_access_events_origin
      ON access_events(origin_node_id, origin_event_id);
  `);
  return database;
};

export type AppDatabase = ReturnType<typeof createDatabase>;
