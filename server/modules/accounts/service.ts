import { randomUUID } from 'node:crypto';
import type {
  AccountStatus,
  ManagedAccount,
  UpdateAccountStatusRequest,
} from '../../../shared/contracts/accountAdministration';
import type { UserRole } from '../../../shared/contracts/justifications';
import type { DemoActor } from '../../../shared/contracts/justifications';
import type { AppDatabase } from '../../db';
import { conflict, forbidden, notFound } from '../../errors';

interface AccountRow {
  id: string;
  name: string;
  role: UserRole;
  email: string | null;
  phone: string | null;
  functional_registry: string | null;
  account_status: AccountStatus;
  account_version: number;
  active_session_count: number;
  last_session_at: string | null;
}

const canManage = (actor: DemoActor) =>
  actor.role === 'STAFF_COORDINATION' || actor.role === 'STAFF_DIRECTION';

const mapAccount = (row: AccountRow): ManagedAccount => ({
  id: row.id,
  name: row.name,
  role: row.role,
  email: row.email ?? undefined,
  phone: row.phone ?? undefined,
  functionalRegistry: row.functional_registry ?? undefined,
  status: row.account_status,
  version: row.account_version,
  activeSessionCount: row.active_session_count,
  lastSessionAt: row.last_session_at ?? undefined,
});

export class AccountAdministrationService {
  constructor(
    private readonly database: AppDatabase,
    private readonly now: () => string = () => new Date().toISOString(),
  ) {}

  list(actor: DemoActor): ManagedAccount[] {
    if (!canManage(actor)) throw forbidden('Somente Coordenação ou Direção administra contas locais.');
    const now = this.now();
    return (this.database.prepare(`
      SELECT u.id, u.name, u.role, u.email, u.phone, u.functional_registry,
        u.account_status, u.account_version,
        COUNT(CASE WHEN s.revoked_at IS NULL AND s.expires_at > ? THEN 1 END) AS active_session_count,
        MAX(s.last_seen_at) AS last_session_at
      FROM users u
      LEFT JOIN auth_sessions s ON s.user_id = u.id
      WHERE u.school_id = ?
      GROUP BY u.id
      ORDER BY CASE WHEN u.role = 'GUARDIAN' THEN 1 ELSE 0 END, u.name
    `).all(now, actor.schoolId) as AccountRow[]).map(mapAccount);
  }

  updateStatus(actor: DemoActor, accountId: string, input: UpdateAccountStatusRequest): ManagedAccount {
    if (!canManage(actor)) throw forbidden('Somente Coordenação ou Direção administra contas locais.');
    if (accountId === actor.id) throw forbidden('Não é permitido alterar o estado da própria conta ativa.');
    const existing = this.database.prepare(`
      SELECT id, account_status, account_version FROM users WHERE id = ? AND school_id = ?
    `).get(accountId, actor.schoolId) as { id: string; account_status: AccountStatus; account_version: number } | undefined;
    if (!existing) throw notFound('Conta não encontrada.');
    if (existing.account_version !== input.expectedVersion) {
      throw conflict('VERSION_CONFLICT', 'A conta foi atualizada por outra sessão. Recarregue a lista.');
    }
    const occurredAt = this.now();
    this.database.transaction(() => {
      const result = this.database.prepare(`
        UPDATE users SET account_status = ?, account_version = account_version + 1
        WHERE id = ? AND school_id = ? AND account_version = ?
      `).run(input.status, accountId, actor.schoolId, input.expectedVersion);
      if (result.changes !== 1) throw conflict('VERSION_CONFLICT', 'A conta foi atualizada por outra sessão. Recarregue a lista.');
      if (input.status === 'BLOCKED') {
        this.database.prepare(`
          UPDATE auth_sessions SET revoked_at = ? WHERE user_id = ? AND revoked_at IS NULL
        `).run(occurredAt, accountId);
      }
      this.database.prepare(`
        INSERT INTO audit_log
          (id, school_id, actor_id, aggregate_type, aggregate_id, action, previous_state, new_state, occurred_at)
        VALUES (?, ?, ?, 'USER_ACCOUNT', ?, ?, ?, ?, ?)
      `).run(
        randomUUID(), actor.schoolId, actor.id, accountId,
        input.status === 'BLOCKED' ? 'ACCOUNT_BLOCKED' : 'ACCOUNT_UNBLOCKED',
        `${existing.account_status}: ${input.reason}`,
        input.status,
        occurredAt,
      );
    })();
    return this.list(actor).find((account) => account.id === accountId)!;
  }

  revokeSessions(actor: DemoActor, accountId: string, reason: string): number {
    if (!canManage(actor)) throw forbidden('Somente Coordenação ou Direção administra sessões locais.');
    if (accountId === actor.id) throw forbidden('Use “Encerrar sessão” para finalizar a própria sessão.');
    const account = this.database.prepare('SELECT id FROM users WHERE id = ? AND school_id = ?')
      .get(accountId, actor.schoolId);
    if (!account) throw notFound('Conta não encontrada.');
    const occurredAt = this.now();
    let revoked = 0;
    this.database.transaction(() => {
      const result = this.database.prepare(`
        UPDATE auth_sessions SET revoked_at = ?
        WHERE user_id = ? AND revoked_at IS NULL AND expires_at > ?
      `).run(occurredAt, accountId, occurredAt);
      revoked = result.changes;
      this.database.prepare(`
        INSERT INTO audit_log
          (id, school_id, actor_id, aggregate_type, aggregate_id, action, previous_state, new_state, occurred_at)
        VALUES (?, ?, ?, 'AUTH_SESSION', ?, 'SESSIONS_REVOKED_REMOTELY', ?, 'REVOKED', ?)
      `).run(randomUUID(), actor.schoolId, actor.id, accountId, `${revoked} sessão(ões): ${reason}`, occurredAt);
    })();
    return revoked;
  }
}
