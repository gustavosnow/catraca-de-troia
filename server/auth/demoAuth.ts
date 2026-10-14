import { NextFunction, Request, Response } from 'express';
import { DemoActor, UserRole } from '../../shared/contracts/justifications';
import { AppDatabase } from '../db';
import { ApiError, unauthorized } from '../errors';

interface ActorRow {
  id: string;
  school_id: string;
  name: string;
  role: UserRole;
}

export interface ActorRequest extends Request {
  actor: DemoActor;
}

export const createDemoAuth = (database: AppDatabase, enabled: boolean) =>
  (request: Request, _response: Response, next: NextFunction) => {
    try {
      if (!enabled) {
        throw new ApiError(
          503,
          'DEMO_AUTH_DISABLED',
          'A API ainda não possui autenticação real. Defina DEMO_AUTH=true somente em desenvolvimento.',
        );
      }

      const actorId = request.header('X-Demo-User-Id');
      if (!actorId) throw unauthorized('Informe X-Demo-User-Id para a sessão demonstrativa.');

      const row = database.prepare(`
        SELECT id, school_id, name, role FROM users WHERE id = ?
      `).get(actorId) as ActorRow | undefined;
      if (!row) throw unauthorized('Usuário demonstrativo desconhecido.');

      (request as ActorRequest).actor = {
        id: row.id,
        schoolId: row.school_id,
        name: row.name,
        role: row.role,
      };
      next();
    } catch (error) {
      next(error);
    }
  };
