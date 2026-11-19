import { isNativeApp } from '../config/runtime';

const sessionKey = 'catraca-troia.session.tab';
const legacyPersistentKey = 'catraca-troia.session';
const legacyTemporaryKey = 'catraca-troia.session.temporary';

interface TabSession {
  token: string;
  id: string;
}

type TabMessage = { type: 'probe' | 'occupied'; sessionId: string; candidateId: string };

const identifier = () => Array.from(crypto.getRandomValues(new Uint32Array(4))).join('-');

const readStoredSession = (): TabSession | null => {
  try {
    const saved = JSON.parse(sessionStorage.getItem(sessionKey) ?? 'null') as TabSession | null;
    return typeof saved?.token === 'string' && typeof saved.id === 'string' ? saved : null;
  } catch {
    return null;
  }
};

let session = isNativeApp ? null : readStoredSession();
const channel = !isNativeApp && typeof BroadcastChannel !== 'undefined'
  ? new BroadcastChannel('catraca-troia.tab-sessions')
  : null;

if (!isNativeApp) {
  // A chave persistente antiga compartilhava a mesma conta em todas as abas.
  localStorage.removeItem(legacyPersistentKey);
  sessionStorage.removeItem(legacyTemporaryKey);
}

export const readSessionToken = () => isNativeApp
  ? sessionStorage.getItem(legacyTemporaryKey) ?? localStorage.getItem(legacyPersistentKey)
  : session?.token ?? null;

export const clearSessionToken = () => {
  if (isNativeApp) {
    sessionStorage.removeItem(legacyTemporaryKey);
    localStorage.removeItem(legacyPersistentKey);
  } else {
    session = null;
    sessionStorage.removeItem(sessionKey);
  }
};

export const saveSessionToken = (token: string, remember = false) => {
  if (isNativeApp) {
    clearSessionToken();
    (remember ? localStorage : sessionStorage).setItem(remember ? legacyPersistentKey : legacyTemporaryKey, token);
  } else {
    session = { token, id: identifier() };
    sessionStorage.setItem(sessionKey, JSON.stringify(session));
  }
};

// O navegador pode copiar sessionStorage ao duplicar uma aba. As abas trocam
// somente identificadores, para que a cópia peça login sem revogar a original.
export const tabSessionReady = new Promise<void>((resolve) => {
  if (!channel) return resolve();
  const candidateId = identifier();
  const sessionId = session?.id;
  let pending = Boolean(sessionId);
  const finish = () => {
    pending = false;
    resolve();
  };
  const timer = pending ? window.setTimeout(finish, 200) : undefined;

  const onMessage = ({ data }: MessageEvent<TabMessage>) => {
    if (!session || data?.sessionId !== session.id) return;
    if (data.type === 'probe' && (!pending || candidateId < data.candidateId)) {
      channel.postMessage({ ...data, type: 'occupied' });
    }
    if (data.type === 'occupied' && pending && data.candidateId === candidateId) {
      window.clearTimeout(timer);
      clearSessionToken();
      finish();
    }
  };

  channel.addEventListener('message', onMessage);
  import.meta.hot?.dispose(() => channel.close());
  if (sessionId) channel.postMessage({ type: 'probe', sessionId, candidateId } satisfies TabMessage);
  else finish();
});
