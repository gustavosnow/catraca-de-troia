import type {
  AuthenticatedUser, AuthSession, LoginRequest, RegisterGuardianRequest,
} from '../../shared/contracts/auth';
import { apiBaseUrl } from '../config/runtime';
import { ApiClientError } from './apiError';
import { clearSessionToken, readSessionToken, saveSessionToken, tabSessionReady } from './tabSession';

const notifySessionEnded = () => window.dispatchEvent(new Event('catraca:session-ended'));

const ensureCurrentSession = (token: string) => {
  if (readSessionToken() !== token) throw new ApiClientError('SESSION_CHANGED', 'A sessão desta aba foi alterada.', 401);
};

const parseResponse = async <T>(response: Response, token?: string): Promise<T> => {
  const body = await response.json().catch(() => null) as {
    data?: T;
    error?: { code: string; message: string };
  } | null;
  if (token) ensureCurrentSession(token);
  if (!response.ok) {
    if (response.status === 401 && token) {
      clearSessionToken();
      notifySessionEnded();
    }
    throw new ApiClientError(
      body?.error?.code || 'REQUEST_FAILED',
      body?.error?.message || 'Não foi possível concluir a operação.',
      response.status,
    );
  }
  return body?.data as T;
};

export const authenticatedRequest = async <T>(pathname: string, init?: RequestInit): Promise<T> => {
  await tabSessionReady;
  const token = readSessionToken();
  if (!token) throw new ApiClientError('UNAUTHORIZED', 'Entre para continuar.', 401);
  const headers = new Headers(init?.headers);
  headers.set('Authorization', `Bearer ${token}`);
  if (init?.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  try {
    return await parseResponse<T>(await fetch(`${apiBaseUrl}${pathname}`, { ...init, headers }), token);
  } catch (error) {
    if (error instanceof ApiClientError) throw error;
    throw new ApiClientError('API_UNAVAILABLE', 'A API local não está acessível.', 0);
  }
};

export const authenticatedRawRequest = async (pathname: string, init?: RequestInit) => {
  await tabSessionReady;
  const token = readSessionToken();
  if (!token) throw new ApiClientError('UNAUTHORIZED', 'Entre para continuar.', 401);
  const headers = new Headers(init?.headers);
  headers.set('Authorization', `Bearer ${token}`);
  let response: Response;
  try {
    response = await fetch(`${apiBaseUrl}${pathname}`, { ...init, headers });
  } catch {
    throw new ApiClientError('API_UNAVAILABLE', 'A API local não está acessível.', 0);
  }
  if (!response.ok) await parseResponse<never>(response, token);
  ensureCurrentSession(token);
  return response;
};

const revokeToken = (token: string) => fetch(`${apiBaseUrl}/api/v1/auth/logout`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}` },
}).catch(() => undefined);

const startSession = (session: AuthSession, remember = false) => {
  const previous = readSessionToken();
  saveSessionToken(session.token, remember);
  if (previous) void revokeToken(previous);
  return session;
};

export const authApi = {
  hasStoredSession: () => Boolean(readSessionToken()),

  login: async (input: LoginRequest, expectedRole: 'parent' | 'staff') => {
    await tabSessionReady;
    let response: Response;
    try {
      response = await fetch(`${apiBaseUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
    } catch {
      throw new ApiClientError('API_UNAVAILABLE', 'A API de autenticação não está acessível.', 0);
    }
    const session = await parseResponse<AuthSession>(response);
    if ((session.user.role === 'GUARDIAN') !== (expectedRole === 'parent')) {
      void revokeToken(session.token);
      throw new Error(expectedRole === 'parent'
        ? 'Esta credencial pertence à equipe escolar.'
        : 'Esta credencial pertence a um responsável.');
    }
    return startSession(session, input.rememberMe);
  },

  /** Cadastro do responsável: cria a conta e o pedido de vínculo, e já inicia a sessão. */
  registerGuardian: async (input: RegisterGuardianRequest) => {
    await tabSessionReady;
    let response: Response;
    try {
      response = await fetch(`${apiBaseUrl}/api/v1/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
    } catch {
      throw new ApiClientError('API_UNAVAILABLE', 'A API de autenticação não está acessível.', 0);
    }
    return startSession(await parseResponse<AuthSession>(response));
  },

  restore: () => authenticatedRequest<AuthenticatedUser>('/api/v1/auth/session'),

  logout: async () => {
    await tabSessionReady;
    const token = readSessionToken();
    clearSessionToken();
    if (token) await revokeToken(token);
  },

  clear: clearSessionToken,
};
