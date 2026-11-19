import { Router } from 'express';
import type { LoginRequest, RegisterGuardianRequest } from '../../../shared/contracts/auth';
import { GUARDIAN_RELATIONSHIPS } from '../../../shared/contracts/linkRequests';
import { MAX_PASSWORD_LENGTH, MIN_PASSWORD_LENGTH } from '../../auth/credentials';
import type { ActorRequest } from '../../auth/sessionAuth';
import { createSessionAuth } from '../../auth/sessionAuth';
import type { AppDatabase } from '../../db';
import { invalidRequest } from '../../errors';
import { AuthService } from './service';
import { FixedWindowRateLimiter } from '../../security/rateLimiter';

const parseLogin = (body: unknown): LoginRequest => {
  const value = body as Partial<LoginRequest> | null;
  if (!value || typeof value.identifier !== 'string' || value.identifier.trim().length < 3 || value.identifier.length > 254) {
    throw invalidRequest('Informe um identificador válido.');
  }
  if (typeof value.password !== 'string' || value.password.length < MIN_PASSWORD_LENGTH || value.password.length > MAX_PASSWORD_LENGTH) {
    throw invalidRequest(`A senha deve ter entre ${MIN_PASSWORD_LENGTH} e ${MAX_PASSWORD_LENGTH} caracteres.`);
  }
  return {
    identifier: value.identifier,
    password: value.password,
    rememberMe: value.rememberMe === true,
  };
};

const parseRegistration = (body: unknown): RegisterGuardianRequest => {
  const value = body as Partial<Record<keyof RegisterGuardianRequest, unknown>> | null;
  const text = (field: unknown) => (typeof field === 'string' ? field.trim() : '');
  const name = text(value?.name);
  const email = text(value?.email);
  const phone = text(value?.phone);
  const cpf = text(value?.cpf);
  const enrollment = text(value?.studentEnrollment);
  const relationship = text(value?.relationship);
  const password = typeof value?.password === 'string' ? value.password : '';
  if (name.length < 5 || name.length > 120 || !name.includes(' ')) throw invalidRequest('Informe nome e sobrenome.');
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw invalidRequest('Informe um e-mail válido.');
  const phoneDigits = phone.replace(/\D/g, '');
  if (phoneDigits.length < 10 || phoneDigits.length > 11) throw invalidRequest('Informe um celular com DDD.');
  if (cpf && cpf.replace(/\D/g, '').length !== 11) throw invalidRequest('O CPF deve ter 11 dígitos.');
  if (password.length < MIN_PASSWORD_LENGTH || password.length > MAX_PASSWORD_LENGTH) {
    throw invalidRequest(`A senha deve ter entre ${MIN_PASSWORD_LENGTH} e ${MAX_PASSWORD_LENGTH} caracteres.`);
  }
  if (enrollment.length < 4 || enrollment.length > 30) throw invalidRequest('Informe a matrícula do estudante.');
  if (!(GUARDIAN_RELATIONSHIPS as readonly string[]).includes(relationship)) throw invalidRequest('Parentesco inválido.');
  return { name, email, phone, cpf: cpf || undefined, password, studentEnrollment: enrollment, relationship };
};

export const createAuthRouter = (
  database: AppDatabase,
  service: AuthService,
  now?: () => string,
) => {
  const router = Router();
  const authenticate = createSessionAuth(database, now);
  const loginLimiter = new FixedWindowRateLimiter(5, 15 * 60 * 1000);

  router.use((_request, response, next) => {
    response.set('Cache-Control', 'no-store');
    next();
  });

  router.post('/auth/login', (request, response) => {
    const identifier = typeof request.body?.identifier === 'string'
      ? request.body.identifier.trim().toLocaleLowerCase('pt-BR')
      : 'invalid';
    const limiterKey = `${request.ip}:${identifier}`;
    loginLimiter.check(limiterKey);
    const session = service.login(parseLogin(request.body));
    loginLimiter.reset(limiterKey);
    response.json({ data: session });
  });
  // Cadastro público de responsável, com limite por endereço de origem.
  const registrationLimiter = new FixedWindowRateLimiter(5, 60 * 60 * 1000);
  router.post('/auth/register', (request, response) => {
    registrationLimiter.check(`register:${request.ip}`);
    response.status(201).json({ data: service.registerGuardian(parseRegistration(request.body)) });
  });
  router.get('/auth/session', authenticate, (request, response) => {
    response.json({ data: service.currentUser((request as ActorRequest).actor.id) });
  });
  router.post('/auth/logout', authenticate, (request, response) => {
    service.logout(request as ActorRequest);
    response.status(204).end();
  });

  return router;
};
