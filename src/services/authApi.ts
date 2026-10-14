import type { AuthenticatedUser, AuthSession, LoginRequest } from '../../shared/contracts/auth';
import { apiBaseUrl } from '../config/runtime';
import { ApiClientError } from './apiError';

const persistentTokenKey = 'catraca-troia.session';
const temporaryTokenKey = 'catraca-troia.session.temporary';

const readToken = () => sessionStorage.getItem(temporaryTokenKey)
  || localStorage.getItem(persistentTokenKey);

const clearToken = () => {
  sessionStorage.removeItem(temporaryTokenKey);
  localStorage.removeItem(persistentTokenKey);
};

const notifySessionEnded = () => window.dispatchEvent(new Event('catraca:session-ended'));

const parseResponse = async <T>(response: Response): Promise<T> => {
  const body = await response.json().catch(() => null) as {
    data?: T;
    error?: { code: string; message: string };
  } | null;
  if (!response.ok) {
    if (response.status === 401) {
      clearToken();
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
  const token = readToken();
  if (!token) throw new ApiClientError('UNAUTHORIZED', 'Entre para continuar.', 401);
  const headers = new Headers(init?.headers);
  headers.set('Authorization', `Bearer ${token}`);
  if (init?.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  try {
    return await parseResponse<T>(await fetch(`${apiBaseUrl}${pathname}`, { ...init, headers }));
  } catch (error) {
    if (error instanceof ApiClientError) throw error;
    throw new ApiClientError('API_UNAVAILABLE', 'A API local não está acessível.', 0);
  }
};

export const authenticatedRawRequest = async (pathname: string, init?: RequestInit) => {
  const token = readToken();
  if (!token) throw new ApiClientError('UNAUTHORIZED', 'Entre para continuar.', 401);
  const headers = new Headers(init?.headers);
  headers.set('Authorization', `Bearer ${token}`);
  let response: Response;
  try {
    response = await fetch(`${apiBaseUrl}${pathname}`, { ...init, headers });
  } catch {
    throw new ApiClientError('API_UNAVAILABLE', 'A API local não está acessível.', 0);
  }
  if (!response.ok) await parseResponse<never>(response);
  return response;
};

export const authApi = {
  hasStoredSession: () => Boolean(readToken()),

  login: async (input: LoginRequest) => {
    const previousToken = readToken();
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
    if (previousToken) {
      await fetch(`${apiBaseUrl}/api/v1/auth/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${previousToken}` },
      }).catch(() => undefined);
    }
    clearToken();
    (input.rememberMe ? localStorage : sessionStorage).setItem(
      input.rememberMe ? persistentTokenKey : temporaryTokenKey,
      session.token,
    );
    return session;
  },

  restore: () => authenticatedRequest<AuthenticatedUser>('/api/v1/auth/session'),

  logout: async () => {
    try {
      await authenticatedRequest<void>('/api/v1/auth/logout', { method: 'POST' });
    } finally {
      clearToken();
    }
  },

  clear: clearToken,
};
