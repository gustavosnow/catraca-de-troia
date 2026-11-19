/**
 * Carga inicial da escola com os dados reais da apresentação (MC-039).
 *
 *   SEED_PASSWORD='...' npm run db:seed
 *   SEED_PASSWORD='...' npm run db:seed -- --reset
 *   npm run db:seed -- --catracas
 *
 * Sem --reset, recusa um banco que já tenha pessoas cadastradas. Com --reset,
 * cria antes um backup verificado em .data/backups, recria o banco vazio e
 * preserva as câmeras já cadastradas (catraca, sentido, limiar e fonte de vídeo).
 * Em um banco novo, cadastra entrada e saída das duas catracas de demonstração.
 * Use --catracas para incluir câmeras faltantes sem recarregar o banco.
 * A senha inicial vem de SEED_PASSWORD e não fica no código.
 */
import { existsSync, rmSync } from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { randomUUID } from 'node:crypto';
import { createDatabase } from '../db';
import { MIN_PASSWORD_LENGTH, registerCredentials } from '../auth/credentials';
import { createVerifiedBackup } from './databaseBackup';
import { ensureDemoTurnstiles } from './demoTurnstiles';
import { GUARDIANS, SCHOOL, STAFF, STUDENTS } from './schoolData';

interface DeviceRow {
  id: string;
  name: string;
  turnstile_id: string;
  turnstile_name: string;
  direction: 'ENTRY' | 'EXIT';
  min_score: number;
  token_hash: string;
  active: number;
  created_at: string;
  camera_source: string | null;
}

const { values } = parseArgs({ options: {
  reset: { type: 'boolean', default: false },
  catracas: { type: 'boolean', default: false },
} });
const fail = (message: string): never => {
  console.error(message);
  process.exit(1);
};

const filename = path.resolve(process.env.DATABASE_PATH || '.data/catraca-de-troia.sqlite');

const main = async () => {
  if (values.catracas) {
    if (values.reset) fail('Use --catracas sem --reset para preservar a base.');
    if (!existsSync(filename)) fail('Banco ainda não criado. Rode npm run db:demo.');
    const database = createDatabase({ filename });
    try {
      const created = ensureDemoTurnstiles(database);
      console.log(created.length ? `Câmeras acrescentadas: ${created.join(', ')}.` : 'As duas catracas já estão cadastradas.');
    } finally {
      database.close();
    }
    return;
  }

  const password = process.env.SEED_PASSWORD ?? '';
  if (password.length < MIN_PASSWORD_LENGTH) {
    fail(`Defina SEED_PASSWORD com pelo menos ${MIN_PASSWORD_LENGTH} caracteres (senha inicial das contas).`);
  }

  let devices: DeviceRow[] = [];
  if (existsSync(filename)) {
    const current = createDatabase({ filename });
    const people = (current.prepare('SELECT COUNT(*) AS total FROM users').get() as { total: number }).total;
    devices = current.prepare('SELECT * FROM access_devices').all() as DeviceRow[];
    current.close();
    if (people > 0 && !values.reset) {
      fail('O banco já tem pessoas cadastradas. Use --reset para fazer backup e recriar com os dados da escola.');
    }
    if (values.reset) {
      const backup = await createVerifiedBackup(filename, path.resolve('.data/backups'));
      console.log(`Backup verificado: ${backup.filename}`);
      for (const suffix of ['', '-wal', '-shm']) rmSync(`${filename}${suffix}`, { force: true });
    }
  }

  const database = createDatabase({ filename });
  const now = new Date().toISOString();
  const coordinator = STAFF.find((member) => member.role === 'STAFF_COORDINATION')!;
  const gate = STAFF.find((member) => member.role === 'STAFF_GATE')!;

  const createdDevices = database.transaction(() => {
    database.prepare('INSERT INTO schools (id, name) VALUES (?, ?)').run(SCHOOL.id, SCHOOL.name);

    const insertUser = database.prepare(`
      INSERT INTO users (id, school_id, name, role, email, phone, functional_registry)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    for (const member of STAFF) {
      insertUser.run(member.id, SCHOOL.id, member.name, member.role, member.email, member.phone, member.functionalRegistry);
      registerCredentials(database, member.id, [member.email, member.functionalRegistry], password);
    }
    for (const guardian of GUARDIANS) {
      insertUser.run(guardian.id, SCHOOL.id, guardian.name, 'GUARDIAN', guardian.email, guardian.phone, null);
      registerCredentials(database, guardian.id, [guardian.email, guardian.phone], password);
    }

    const insertStudent = database.prepare(`
      INSERT INTO students (
        id, school_id, name, enrollment, class_name, shift, stage, homeroom_teacher,
        birth_date, exit_authorization, emergency_contact, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE')
    `);
    const insertLink = database.prepare(`
      INSERT INTO guardian_student_links
        (guardian_user_id, student_id, status, approved_at, approved_by, relationship, version)
      VALUES (?, ?, 'APPROVED', ?, ?, ?, 1)
    `);
    for (const student of STUDENTS) {
      const guardian = GUARDIANS.find((item) => item.id === student.guardianId)!;
      insertStudent.run(
        student.id, SCHOOL.id, student.name, student.enrollment, student.className, student.shift,
        student.stage, student.homeroomTeacher, student.birthDate, student.exitAuthorization, guardian.phone,
      );
      insertLink.run(guardian.id, student.id, now, coordinator.id, guardian.relationship);
    }

    // Câmeras já cadastradas continuam valendo (mesmo token), agora na escola nova.
    const insertDevice = database.prepare(`
      INSERT INTO access_devices (
        id, school_id, name, turnstile_id, turnstile_name, direction, operator_user_id,
        min_score, token_hash, active, created_at, camera_source
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const device of devices) {
      insertDevice.run(
        device.id, SCHOOL.id, device.direction === 'ENTRY' ? 'Câmera de entrada' : 'Câmera de saída',
        device.turnstile_id, device.turnstile_name, device.direction, gate.id, device.min_score,
        device.token_hash, device.active, device.created_at, device.camera_source,
      );
    }

    database.prepare(`
      INSERT INTO audit_log
        (id, school_id, actor_id, aggregate_type, aggregate_id, action, previous_state, new_state, occurred_at)
      VALUES (?, ?, ?, 'SCHOOL', ?, 'INITIAL_LOAD', NULL, ?, ?)
    `).run(randomUUID(), SCHOOL.id, coordinator.id, SCHOOL.id,
      `${STAFF.length} equipe, ${GUARDIANS.length} responsáveis, ${STUDENTS.length} estudantes`, now);
    return devices.length === 0 ? ensureDemoTurnstiles(database) : [];
  })();

  database.close();

  console.log(`Escola: ${SCHOOL.name}`);
  console.log(`Equipe: ${STAFF.map((member) => `${member.name} <${member.email}>`).join(', ')}`);
  console.log(`Responsáveis: ${GUARDIANS.length} | Estudantes: ${STUDENTS.length} | Câmeras preservadas: ${devices.length}`);
  if (createdDevices.length > 0) {
    console.log(`Câmeras cadastradas: ${createdDevices.join(', ')} (defina a fonte de vídeo em Ferramentas).`);
  }
  console.log('Todas as contas usam a senha inicial definida em SEED_PASSWORD.');
};

main().catch((error: unknown) => fail(error instanceof Error ? error.message : 'Falha na carga inicial.'));
