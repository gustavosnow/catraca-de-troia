import { Request, Router } from 'express';
import type { ActorRequest } from '../../auth/sessionAuth';
import { StudentService } from './service';

const actorFrom = (request: Request) => (request as ActorRequest).actor;

/** Rotas de estudantes; exigem sessão (montadas depois de createSessionAuth). */
export const createStudentRouter = (service: StudentService) => {
  const router = Router();

  /** Painel escolar: lista completa da unidade. Responsável recebe 403. */
  router.get('/students', (request, response) => {
    response.json({ data: service.listForSchool(actorFrom(request)) });
  });

  /** Estudantes acessíveis pela sessão atual. */
  router.get('/me/students', (request, response) => {
    response.json({ data: service.listForActor(actorFrom(request)) });
  });

  return router;
};
