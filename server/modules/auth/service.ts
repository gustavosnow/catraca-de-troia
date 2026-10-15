import { randomBytes, randomUUID, scryptSync, timingSafeEqual } from 'node:crypto';
import type { AuthenticatedUser, AuthSession, LoginRequest } from '../../../shared/contracts/auth';
import type { UserRole } from '../../../shared/contracts/justifications';
import type { ActorRequest } from '../../auth/sessionAuth';
import { hashSessionToken } from '../../auth/sessionAuth';
import type { AppDatabase } from '../../db';
import { unauthorized } from '../../errors';

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

const normalizeIdentifier = (value: string) => {
  const trimmed = value.trim().toLocaleLowerCase('pt-BR');
  const digits = trimmed.replace(/\D/g, '');
  return digits.length >= 10 ? digits : trimmed;
};

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
