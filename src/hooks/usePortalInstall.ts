import { useSyncExternalStore } from 'react';
import { isNativeApp } from '../config/runtime';

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const standalone = window.matchMedia('(display-mode: standalone)');
const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent)
  || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const isStandalone = () => standalone.matches
  || (navigator as Navigator & { standalone?: boolean }).standalone === true;

let prompt: InstallPromptEvent | null = null;
let installed = false;
const changes = new EventTarget();
const notify = () => changes.dispatchEvent(new Event('change'));

// O navegador pode oferecer a instalação antes de o responsável entrar no portal.
if (!isNativeApp) {
  const capturePrompt = (event: Event) => {
    event.preventDefault();
    prompt = event as InstallPromptEvent;
    installed = false;
    notify();
  };
  const markInstalled = () => {
    prompt = null;
    installed = true;
    notify();
  };
  window.addEventListener('beforeinstallprompt', capturePrompt);
  window.addEventListener('appinstalled', markInstalled);
  standalone.addEventListener('change', notify);
  import.meta.hot?.dispose(() => {
    window.removeEventListener('beforeinstallprompt', capturePrompt);
    window.removeEventListener('appinstalled', markInstalled);
    standalone.removeEventListener('change', notify);
  });
}

const subscribe = (listener: () => void) => {
  changes.addEventListener('change', listener);
  return () => changes.removeEventListener('change', listener);
};

const getInstallMode = () => {
  if (isNativeApp || installed || isStandalone()) return 'hidden';
  return prompt ? 'prompt' : 'manual';
};

const launchPrompt = async () => {
  const currentPrompt = prompt;
  if (!currentPrompt) return false;
  prompt = null;
  notify();
  try {
    await currentPrompt.prompt();
    await currentPrompt.userChoice;
    return true;
  } catch {
    return false;
  }
};

export const usePortalInstall = (isCompactViewport: boolean) => {
  const mode = useSyncExternalStore(subscribe, getInstallMode);
  return {
    available: mode === 'prompt' || (mode === 'manual' && (isIos || isCompactViewport)),
    manualInstructions: isIos
      ? 'No Safari, toque em Compartilhar e depois em “Adicionar à Tela de Início”.'
      : 'Abra o menu do navegador e escolha “Adicionar à tela inicial” ou “Instalar app”, se a opção estiver disponível.',
    launchPrompt,
  };
};
