import React, { useEffect, useState } from 'react';
import { Download, Share2, X } from 'lucide-react';
import { isNativeApp } from '../../config/runtime';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const InstallAppBanner: React.FC = () => {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);
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
    if (!installPrompt) return;
    await installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  };

  return (
    <div className="bg-blue-950 border-b border-blue-800 px-4 py-2 text-blue-50">
      <div className="max-w-7xl mx-auto flex items-center gap-3 text-xs">
        {installPrompt ? <Download className="w-4 h-4 shrink-0 text-orange-400" /> : <Share2 className="w-4 h-4 shrink-0 text-orange-400" />}
        <p className="flex-1">
          {installPrompt
            ? 'Instale o app dos responsáveis neste aparelho para abrir em tela própria.'
            : isIos
              ? 'No Safari, toque em Compartilhar e depois em “Adicionar à Tela de Início”.'
              : 'Você já está no layout do app. No menu do navegador, procure “Adicionar à tela inicial”.'}
        </p>
        {installPrompt && (
          <button onClick={install} className="rounded-lg bg-orange-600 px-3 py-1.5 font-bold text-white hover:bg-orange-500">
            Instalar
          </button>
        )}
        <button onClick={() => setDismissed(true)} aria-label="Dispensar aviso de instalação" className="p-1 text-blue-200 hover:text-white">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
