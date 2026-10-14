import { createHash } from 'node:crypto';
import { NextFunction, Request, Response } from 'express';
import type { DemoActor, UserRole } from '../../shared/contracts/justifications';
import type { AppDatabase } from '../db';
import { unauthorized } from '../errors';

interface SessionRow {
  session_id: string;
  user_id: string;
  school_id: string;
  name: string;
  role: UserRole;
  expires_at: string;
}

export interface ActorRequest extends Request {
  actor: DemoActor;
  sessionTokenHash: string;
  sessionId: string;
}

export const hashSessionToken = (token: string) =>
  createHash('sha256').update(token).digest('hex');

export const createSessionAuth = (
  database: AppDatabase,
  now: () => string = () => new Date().toISOString(),
) => (request: Request, _response: Response, next: NextFunction) => {
  try {
    const authorization = request.header('Authorization');
    const match = authorization?.match(/^Bearer\s+([^\s]+)$/i);
    if (!match) throw unauthorized('Sessão necessária. Entre novamente.');

    const tokenHash = hashSessionToken(match[1]);
    const row = database.prepare(`
      SELECT s.id AS session_id, u.id AS user_id, u.school_id, u.name, u.role, s.expires_at
      FROM auth_sessions s
      JOIN users u ON u.id = s.user_id
      WHERE s.token_hash = ? AND s.revoked_at IS NULL
    `).get(tokenHash) as SessionRow | undefined;

    const currentTime = now();
    if (!row || row.expires_at <= currentTime) {
      if (row) database.prepare('UPDATE auth_sessions SET revoked_at = ? WHERE token_hash = ?').run(currentTime, tokenHash);
      throw unauthorized('Sessão inválida ou expirada. Entre novamente.');
    }

    database.prepare('UPDATE auth_sessions SET last_seen_at = ? WHERE token_hash = ?')
      .run(currentTime, tokenHash);
    const authenticatedRequest = request as ActorRequest;
    authenticatedRequest.actor = {
      id: row.user_id,
      schoolId: row.school_id,
      name: row.name,
      role: row.role,
    };
    authenticatedRequest.sessionTokenHash = tokenHash;
    authenticatedRequest.sessionId = row.session_id;
    next();
  } catch (error) {
    next(error);
  }
};
