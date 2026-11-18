import React, { useEffect, useState } from 'react';
import { Smartphone, X } from 'lucide-react';
import { isNativeApp } from '../../config/runtime';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/** Sugestão opcional de adicionar o portal à tela inicial — nunca obrigatória. */
export const InstallAppBanner: React.FC = () => {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
  const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const isCompactViewport = window.matchMedia('(max-width: 639px)').matches;

  useEffect(() => {
    const capturePrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };
    const clearPrompt = () => setInstallPrompt(null);
    window.addEventListener('beforeinstallprompt', capturePrompt);
    window.addEventListener('appinstalled', clearPrompt);
    return () => {
      window.removeEventListener('beforeinstallprompt', capturePrompt);
      window.removeEventListener('appinstalled', clearPrompt);
    };
  }, []);

  if (isNativeApp || isStandalone || dismissed || (!installPrompt && !isIos && !isCompactViewport)) return null;

  const install = async () => {
    if (!installPrompt) {
      setShowHelp(true);
      return;
    }
    await installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  };

  return (
    <aside className="card relative flex items-start gap-3 p-4 pr-12 sm:items-center sm:gap-4 sm:p-5" aria-label="Adicionar à tela inicial">
      <span className="inline-flex h-10 w-10 shrink-0 items-center max-[359px]:hidden justify-center rounded-[10px] bg-brand-soft text-action">
        <Smartphone aria-hidden="true" className="h-5 w-5" />
      </span>
      {/* No celular o texto ocupa a largura toda e a ação desce para baixo dele; o X fica no canto. */}
      <div className="min-w-0 flex-1 sm:flex sm:items-center sm:gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-ink">A escola a um toque de distância.</p>
          <p className="mt-0.5 text-[13px] leading-relaxed text-muted">
            {showHelp
              ? isIos
                ? 'No Safari, toque em Compartilhar e depois em “Adicionar à Tela de Início”.'
                : 'No menu do navegador, escolha “Adicionar à tela inicial”.'
              : 'Adicione o portal à tela inicial. A instalação é opcional.'}
          </p>
        </div>
        {!showHelp && (
          <button type="button" className="btn btn-soft btn-sm mt-3 shrink-0 sm:mt-0" onClick={() => void install()}>
            {installPrompt ? 'Instalar' : 'Saiba como'}
          </button>
        )}
      </div>
      <button type="button" className="icon-btn absolute right-2 top-2 sm:top-1/2 sm:-translate-y-1/2" onClick={() => setDismissed(true)} aria-label="Dispensar aviso de instalação">
        <X />
      </button>
    </aside>
  );
};
