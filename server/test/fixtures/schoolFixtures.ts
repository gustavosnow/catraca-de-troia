import { createDatabase, type DatabaseOptions } from '../../db';
import { registerCredentials } from '../../auth/credentials';

/**
 * Dados de teste da suíte automatizada. Não fazem parte do sistema: o banco
 * criado por `createDatabase` nasce vazio e a carga real é feita por
 * `npm run db:seed`. Estes registros existem só para os testes de API.
 */
export const TEST_PASSWORD = 'Troia@2026';

const fixtureRows = `
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

/** Catraca cadastrada: a passagem assistida só aceita catraca existente e ativa. */
const fixtureTurnstiles = `
  INSERT OR IGNORE INTO access_devices (
    id, school_id, name, turnstile_id, turnstile_name, direction, operator_user_id,
    min_score, token_hash, active, created_at
  ) VALUES (
    'fixture-cat-01-portaria', 'school-1', 'Catraca de teste', 'cat-01',
    'Catraca 01 (Portão Principal)', 'ENTRY', 'staff-1', 0.4, 'fixture-token-hash', 1,
    '2026-10-01T10:00:00.000Z'
  );
`;

const fixtureNotices = `
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

const fixtureIdentities = [
  ['guardian-1', 'claudia.mendes@gmail.com'], ['guardian-1', '11987654321'],
  ['guardian-2', 'rodrigo.oliveira@gmail.com'], ['guardian-2', '11976541234'],
  ['guardian-3', 'silvia.ferreira@gmail.com'], ['guardian-4', 'carlos.costa@gmail.com'],
  ['guardian-5', 'marilene.cavalcanti@gmail.com'], ['guardian-empty', 'sem.vinculo@gmail.com'],
  ['staff-1', 'carlos.mendes@emef.educacao.sp.gov.br'], ['staff-1', 'mat-2026/0481'],
  ['staff-2', 'mariana.costa@emef.educacao.sp.gov.br'], ['staff-2', 'mat-2026/0129'],
  ['staff-3', 'valdemar.ramos@emef.educacao.sp.gov.br'], ['staff-3', 'mat-2026/0004'],
] as const;

export const seedTestFixtures = (database: ReturnType<typeof createDatabase>) => {
  database.exec(fixtureRows);
  database.exec(fixtureNotices);
  database.exec(fixtureTurnstiles);
  const byUser = new Map<string, string[]>();
  for (const [userId, identifier] of fixtureIdentities) {
    byUser.set(userId, [...(byUser.get(userId) ?? []), identifier]);
  }
  database.transaction(() => {
    for (const [userId, identifiers] of byUser) registerCredentials(database, userId, identifiers, TEST_PASSWORD);
  })();
  return database;
};

/** Banco de teste com as fixtures carregadas (em memória, salvo outro arquivo). */
export const createTestDatabase = (options: DatabaseOptions = {}) =>
  seedTestFixtures(createDatabase({ filename: ':memory:', ...options }));
