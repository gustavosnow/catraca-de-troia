import { randomBytes, randomUUID, scryptSync, timingSafeEqual } from 'node:crypto';
import type {
  AuthenticatedUser, AuthSession, LoginRequest, RegisterGuardianRequest,
} from '../../../shared/contracts/auth';
import type { GuardianRelationship } from '../../../shared/contracts/linkRequests';
import type { UserRole } from '../../../shared/contracts/justifications';
import type { ActorRequest } from '../../auth/sessionAuth';
import { hashSessionToken } from '../../auth/sessionAuth';
import { normalizeIdentifier, registerCredentials } from '../../auth/credentials';
import { LinkRequestService } from '../linkRequests/service';
import type { AppDatabase } from '../../db';
import { conflict, notFound, unauthorized } from '../../errors';

interface CredentialRow {
  user_id: string;
  password_salt: string;
  password_hash: string;
}

interface UserRow {
  id: string;
  school_id: string;
  school_name: string;
  name: string;
  role: UserRole;
  email: string | null;
  phone: string | null;
  functional_registry: string | null;
  account_status: 'ACTIVE' | 'BLOCKED';
}


const mapUser = (database: AppDatabase, row: UserRow): AuthenticatedUser => ({
  id: row.id,
  schoolId: row.school_id,
  schoolName: row.school_name,
  name: row.name,
  role: row.role,
  email: row.email ?? undefined,
  phone: row.phone ?? undefined,
  functionalRegistry: row.functional_registry ?? undefined,
  linkedStudentIds: row.role === 'GUARDIAN'
    ? (database.prepare(`
        SELECT student_id FROM guardian_student_links
        WHERE guardian_user_id = ? AND status = 'APPROVED'
        ORDER BY student_id
      `).all(row.id) as Array<{ student_id: string }>).map((link) => link.student_id)
    : [],
});

export class AuthService {
  constructor(
    private readonly database: AppDatabase,
    private readonly now: () => string = () => new Date().toISOString(),
  ) {}

  login(input: LoginRequest): AuthSession {
    const credential = this.database.prepare(`
      SELECT user_id, password_salt, password_hash
      FROM auth_identities WHERE normalized_identifier = ?
    `).get(normalizeIdentifier(input.identifier)) as CredentialRow | undefined;

    const suppliedHash = scryptSync(
      input.password,
      credential?.password_salt ?? 'invalid-login-salt',
      64,
    );
    const expectedHash = Buffer.from(credential?.password_hash ?? '00'.repeat(64), 'hex');
    if (!credential || expectedHash.length !== suppliedHash.length || !timingSafeEqual(expectedHash, suppliedHash)) {
      throw unauthorized('Identificador ou senha inválidos.');
    }

    const user = this.findUser(credential.user_id);
    const createdAt = this.now();
    const durationMs = input.rememberMe ? 30 * 24 * 60 * 60 * 1000 : 12 * 60 * 60 * 1000;
    const expiresAt = new Date(new Date(createdAt).getTime() + durationMs).toISOString();
    const token = randomBytes(32).toString('base64url');
    const sessionId = randomUUID();
    this.database.transaction(() => {
      this.database.prepare(`
        DELETE FROM auth_sessions WHERE expires_at <= ? OR revoked_at IS NOT NULL
      `).run(createdAt);
      this.database.prepare(`
        INSERT INTO auth_sessions
          (id, user_id, token_hash, created_at, expires_at, last_seen_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(sessionId, user.id, hashSessionToken(token), createdAt, expiresAt, createdAt);
      this.database.prepare(`
        INSERT INTO audit_log
          (id, school_id, actor_id, aggregate_type, aggregate_id, action, previous_state, new_state, occurred_at)
        VALUES (?, ?, ?, 'AUTH_SESSION', ?, 'SESSION_CREATED', NULL, 'ACTIVE', ?)
      `).run(randomUUID(), user.schoolId, user.id, sessionId, createdAt);
    })();

    return { token, expiresAt, user };
  }

  /**
   * Cadastro de responsável: cria a conta e a solicitação de vínculo em uma
   * transação, e devolve a sessão. A conta não vê nenhum estudante até a escola
   * aprovar o vínculo. Contas da equipe escolar não são criadas por aqui.
   */
  registerGuardian(input: RegisterGuardianRequest): AuthSession {
    const student = this.database.prepare(`
      SELECT school_id FROM students WHERE enrollment = ?
    `).get(input.studentEnrollment.trim()) as { school_id: string } | undefined;
    if (!student) throw notFound('Matrícula não localizada. Confira o número com a secretaria da escola.');

    const userId = randomUUID();
    const createdAt = this.now();
    this.database.transaction(() => {
      this.database.prepare(`
        INSERT INTO users (id, school_id, name, role, email, phone, functional_registry)
        VALUES (?, ?, ?, 'GUARDIAN', ?, ?, NULL)
      `).run(userId, student.school_id, input.name.trim(), input.email.trim().toLowerCase(), input.phone.trim());
      try {
        registerCredentials(this.database, userId, [input.email, input.phone, input.cpf ?? ''], input.password);
      } catch {
        throw conflict('ACCOUNT_EXISTS', 'Já existe uma conta com este e-mail, telefone ou CPF. Entre com ela ou procure a escola.');
      }
      this.database.prepare(`
        INSERT INTO audit_log
          (id, school_id, actor_id, aggregate_type, aggregate_id, action, previous_state, new_state, occurred_at)
        VALUES (?, ?, ?, 'USER_ACCOUNT', ?, 'GUARDIAN_REGISTERED', NULL, 'ACTIVE', ?)
      `).run(randomUUID(), student.school_id, userId, userId, createdAt);
      new LinkRequestService(this.database, this.now).create(
        { id: userId, schoolId: student.school_id, name: input.name.trim(), role: 'GUARDIAN' },
        { studentEnrollment: input.studentEnrollment, relationship: input.relationship as GuardianRelationship },
        `registration:${userId}`,
      );
    })();

    return this.login({ identifier: input.email, password: input.password });
  }

  currentUser(actorId: string): AuthenticatedUser {
    return this.findUser(actorId);
  }

  logout(request: ActorRequest) {
    const occurredAt = this.now();
    this.database.transaction(() => {
      this.database.prepare(`
        UPDATE auth_sessions SET revoked_at = ?
        WHERE token_hash = ? AND revoked_at IS NULL
      `).run(occurredAt, request.sessionTokenHash);
      this.database.prepare(`
        INSERT INTO audit_log
          (id, school_id, actor_id, aggregate_type, aggregate_id, action, previous_state, new_state, occurred_at)
        VALUES (?, ?, ?, 'AUTH_SESSION', ?, 'SESSION_REVOKED', 'ACTIVE', 'REVOKED', ?)
      `).run(randomUUID(), request.actor.schoolId, request.actor.id, request.sessionId, occurredAt);
    })();
  }

  private findUser(userId: string) {
    const row = this.database.prepare(`
      SELECT u.id, u.school_id, schools.name AS school_name, u.name, u.role,
        u.email, u.phone, u.functional_registry, u.account_status
      FROM users u JOIN schools ON schools.id = u.school_id
      WHERE u.id = ?
    `).get(userId) as UserRow | undefined;
    if (!row) throw unauthorized('Usuário da sessão não está mais disponível.');
    if (row.account_status !== 'ACTIVE') throw unauthorized('Esta conta local está bloqueada. Procure a gestão escolar.');
    return mapUser(this.database, row);
  }
}
