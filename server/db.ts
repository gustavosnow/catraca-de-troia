import Database from 'better-sqlite3';
import { randomBytes, scryptSync } from 'node:crypto';
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

const seed = `
  INSERT OR IGNORE INTO schools (id, name) VALUES
    ('school-1', 'EMEF Profª. Cecília Meireles');

  INSERT OR IGNORE INTO users
    (id, school_id, name, role, email, phone, functional_registry) VALUES
    ('guardian-1', 'school-1', 'Claudia Mendes (Mãe)', 'GUARDIAN', 'claudia.mendes@gmail.com', '(11) 98765-4321', NULL),
    ('guardian-2', 'school-1', 'Rodrigo Oliveira (Pai)', 'GUARDIAN', 'rodrigo.oliveira@gmail.com', '(11) 97654-1234', NULL),
    ('guardian-3', 'school-1', 'Silvia Ferreira (Mãe)', 'GUARDIAN', 'silvia.ferreira@gmail.com', '(11) 98234-5566', NULL),
    ('guardian-4', 'school-1', 'Carlos Costa (Pai)', 'GUARDIAN', 'carlos.costa@gmail.com', '(11) 97111-2233', NULL),
    ('guardian-5', 'school-1', 'Marilene Cavalcanti (Mãe)', 'GUARDIAN', 'marilene.cavalcanti@gmail.com', '(11) 99123-8899', NULL),
    ('guardian-empty', 'school-1', 'Responsável sem vínculo', 'GUARDIAN', 'sem.vinculo@gmail.com', '(11) 90000-0000', NULL),
    ('staff-1', 'school-1', 'Carlos Mendes', 'STAFF_GATE', 'carlos.mendes@emef.educacao.sp.gov.br', '(11) 98111-4455', 'MAT-2026/0481'),
    ('staff-2', 'school-1', 'Profª. Mariana Costa', 'STAFF_COORDINATION', 'mariana.costa@emef.educacao.sp.gov.br', '(11) 98222-3344', 'MAT-2026/0129'),
    ('staff-3', 'school-1', 'Diretor Valdemar Ramos', 'STAFF_DIRECTION', 'valdemar.ramos@emef.educacao.sp.gov.br', '(11) 98333-7788', 'MAT-2026/0004');

  UPDATE users SET email = 'claudia.mendes@gmail.com', phone = '(11) 98765-4321' WHERE id = 'guardian-1';
  UPDATE users SET email = 'rodrigo.oliveira@gmail.com', phone = '(11) 97654-1234' WHERE id = 'guardian-2';
  UPDATE users SET email = 'silvia.ferreira@gmail.com', phone = '(11) 98234-5566' WHERE id = 'guardian-3';
  UPDATE users SET email = 'carlos.costa@gmail.com', phone = '(11) 97111-2233' WHERE id = 'guardian-4';
  UPDATE users SET email = 'marilene.cavalcanti@gmail.com', phone = '(11) 99123-8899' WHERE id = 'guardian-5';
  UPDATE users SET email = 'sem.vinculo@gmail.com', phone = '(11) 90000-0000' WHERE id = 'guardian-empty';
  UPDATE users SET email = 'carlos.mendes@emef.educacao.sp.gov.br', phone = '(11) 98111-4455', functional_registry = 'MAT-2026/0481' WHERE id = 'staff-1';
  UPDATE users SET email = 'mariana.costa@emef.educacao.sp.gov.br', phone = '(11) 98222-3344', functional_registry = 'MAT-2026/0129' WHERE id = 'staff-2';
  UPDATE users SET email = 'valdemar.ramos@emef.educacao.sp.gov.br', phone = '(11) 98333-7788', functional_registry = 'MAT-2026/0004' WHERE id = 'staff-3';

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

const communicationSeed = `
  INSERT OR IGNORE INTO school_notices (
    id, school_id, title, category, priority, author_label, role_label, summary,
    content, attachment_name, created_by, created_at, updated_at, version
  ) VALUES
    ('notice-seed-1', 'school-1', 'Campanha de Vacinação Infantil nas Escolas (PSE / SUS)',
      'GENERAL', 'URGENT', 'Diretoria Escolar & Secretaria de Saúde', 'Direção Escolar',
      'Atualização da caderneta de vacinação infantil para alunos do 1º ao 9º Ano.',
      'Em parceria com a Unidade Básica de Saúde, será realizada a verificação demonstrativa da caderneta de vacinação. Consulte o comunicado acadêmico antes de qualquer uso real.',
      'autorizacao_vacinacao_escolar.pdf', 'staff-3', '2026-10-14T12:30:00.000Z', '2026-10-14T12:30:00.000Z', 1),
    ('notice-seed-2', 'school-1', 'Reunião de Pais e Mestres do 3º Bimestre',
      'PEDAGOGICAL', 'IMPORTANT', 'Coordenação Pedagógica', 'Coordenação Pedagógica',
      'Entrega dos relatórios de desenvolvimento pedagógico e alinhamento das atividades com a família.',
      'Comunicado demonstrativo sobre a reunião de responsáveis e equipe pedagógica.',
      'cronograma_reuniao_3bim.pdf', 'staff-2', '2026-10-13T19:45:00.000Z', '2026-10-13T19:45:00.000Z', 1);
`;

export interface DatabaseOptions {
  filename?: string;
  seedDemoData?: boolean;
}

const demoIdentities = [
  ['guardian-1', 'claudia.mendes@gmail.com'], ['guardian-1', '11987654321'],
  ['guardian-2', 'rodrigo.oliveira@gmail.com'], ['guardian-2', '11976541234'],
  ['guardian-3', 'silvia.ferreira@gmail.com'], ['guardian-4', 'carlos.costa@gmail.com'],
  ['guardian-5', 'marilene.cavalcanti@gmail.com'], ['guardian-empty', 'sem.vinculo@gmail.com'],
  ['staff-1', 'carlos.mendes@emef.educacao.sp.gov.br'], ['staff-1', 'mat-2026/0481'],
  ['staff-2', 'mariana.costa@emef.educacao.sp.gov.br'], ['staff-2', 'mat-2026/0129'],
  ['staff-3', 'valdemar.ramos@emef.educacao.sp.gov.br'], ['staff-3', 'mat-2026/0004'],
] as const;

const seedDemoCredentials = (database: Database.Database) => {
  const insert = database.prepare(`
    INSERT OR IGNORE INTO auth_identities
      (normalized_identifier, user_id, password_salt, password_hash)
    VALUES (?, ?, ?, ?)
  `);
  const transaction = database.transaction(() => {
    for (const [userId, identifier] of demoIdentities) {
      if (database.prepare('SELECT 1 FROM auth_identities WHERE normalized_identifier = ?').get(identifier)) continue;
      const salt = randomBytes(16).toString('hex');
      const passwordHash = scryptSync('Troia@2026', salt, 64).toString('hex');
      insert.run(identifier, userId, salt, passwordHash);
    }
  });
  transaction();
};

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
  const justificationColumns = database.prepare('PRAGMA table_info(justifications)').all() as Array<{ name: string }>;
  if (!justificationColumns.some((column) => column.name === 'attachment_id')) {
    database.exec('ALTER TABLE justifications ADD COLUMN attachment_id TEXT REFERENCES attachments(id)');
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
  database.exec(`
    UPDATE access_events
    SET origin_node_id = COALESCE(origin_node_id, 'legacy-local'),
        origin_event_id = COALESCE(origin_event_id, id),
        sync_payload_hash = COALESCE(sync_payload_hash, request_hash)
    WHERE origin_node_id IS NULL OR origin_event_id IS NULL OR sync_payload_hash IS NULL;
    CREATE UNIQUE INDEX IF NOT EXISTS idx_access_events_origin
      ON access_events(origin_node_id, origin_event_id);
  `);
  if (options.seedDemoData ?? true) {
    database.exec(seed);
    seedDemoCredentials(database);
    database.exec(communicationSeed);
  }
  if ((options.seedDemoData ?? true) && options.filename === undefined) {
    database.exec(demoWorkflowSeed);
  }
  database.exec(`
    UPDATE access_events
    SET origin_node_id = COALESCE(origin_node_id, 'legacy-local'),
        origin_event_id = COALESCE(origin_event_id, id),
        sync_payload_hash = COALESCE(sync_payload_hash, request_hash)
    WHERE origin_node_id IS NULL OR origin_event_id IS NULL OR sync_payload_hash IS NULL
  `);
  return database;
};

export type AppDatabase = ReturnType<typeof createDatabase>;
