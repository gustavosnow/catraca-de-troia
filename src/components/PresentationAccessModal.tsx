import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Check, Copy, ExternalLink, MonitorSmartphone, Share2, X } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

interface PresentationAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PresentationAccessModal: React.FC<PresentationAccessModalProps> = ({ isOpen, onClose }) => {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [copied, setCopied] = useState(false);
  const parentUrl = useMemo(() => `${window.location.origin}${window.location.pathname}#/responsaveis`, []);
  const secureAccess = window.location.protocol === 'https:' || ['localhost', '127.0.0.1'].includes(window.location.hostname);

  useEffect(() => {
    if (!isOpen) return;
    closeButtonRef.current?.focus();
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const copyLink = async () => {
    await navigator.clipboard.writeText(parentUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  const shareLink = async () => {
    if (!navigator.share) {
      await copyLink();
      return;
    }
    await navigator.share({
      title: 'Catraca de Troia — Portal dos Responsáveis',
      text: 'Abra a demonstração do portal dos responsáveis.',
      url: parentUrl,
    });
  };

  return <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/80 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="presentation-access-title" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <div className="my-auto w-full max-w-2xl rounded-3xl border border-slate-700 bg-[#0B192C] p-5 text-white shadow-2xl sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="rounded-xl border border-orange-500/30 bg-orange-500/15 p-2.5 text-orange-400"><MonitorSmartphone className="h-5 w-5" /></div>
          <div><h2 id="presentation-access-title" className="text-lg font-black">Apresentar o app sem APK</h2><p className="mt-1 text-xs text-slate-400">A mesma interface responsiva pode abrir pelo navegador e ser adicionada à tela inicial.</p></div>
        </div>
        <button ref={closeButtonRef} type="button" onClick={onClose} aria-label="Fechar acesso de apresentação" className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white"><X className="h-5 w-5" /></button>
      </div>

      <div className="mt-5 grid gap-5 sm:grid-cols-[190px_minmax(0,1fr)] sm:items-center">
        <div className="mx-auto rounded-2xl bg-white p-3"><QRCodeSVG value={parentUrl} size={166} level="M" includeMargin={false} aria-label="QR Code do portal dos responsáveis" /></div>
        <div className="min-w-0 space-y-3">
          <div><p className="text-[11px] font-bold uppercase tracking-wide text-orange-400">Endereço desta sessão</p><p className="mt-1 break-all rounded-xl border border-slate-700 bg-slate-950/60 p-3 font-mono text-xs text-slate-200">{parentUrl}</p></div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => void copyLink()} className="flex items-center gap-1.5 rounded-xl bg-orange-600 px-3 py-2 text-xs font-bold hover:bg-orange-500">{copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}{copied ? 'Copiado' : 'Copiar link'}</button>
            <button type="button" onClick={() => void shareLink()} className="flex items-center gap-1.5 rounded-xl border border-slate-700 px-3 py-2 text-xs font-bold text-slate-200 hover:bg-slate-800"><Share2 className="h-4 w-4" />Compartilhar</button>
            <a href={parentUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 rounded-xl border border-slate-700 px-3 py-2 text-xs font-bold text-slate-200 hover:bg-slate-800"><ExternalLink className="h-4 w-4" />Abrir teste</a>
          </div>
        </div>
      </div>

      <div className={`mt-5 rounded-2xl border p-4 text-xs ${secureAccess ? 'border-emerald-800 bg-emerald-950/40 text-emerald-100' : 'border-amber-700 bg-amber-950/40 text-amber-100'}`}>
        <p className="font-bold">{secureAccess ? 'Instalação pelo navegador disponível' : 'Acesso pelo navegador disponível; instalação depende de HTTPS'}</p>
        <p className="mt-1 leading-relaxed">{secureAccess
          ? 'No Android, use “Instalar” ou “Adicionar à tela inicial”. No iPhone, use Compartilhar → Adicionar à Tela de Início. Depois, o portal abre em janela própria, sem barra do navegador.'
          : 'Um endereço HTTP da rede local reproduz o layout móvel, mas os navegadores normalmente exigem HTTPS para instalar a PWA. Para a apresentação, use o túnel HTTPS temporário documentado no projeto.'}</p>
      </div>
      <p className="mt-3 text-[11px] text-slate-500">O endereço compartilhado expõe somente a demonstração enquanto o servidor e, quando usado, o túnel estiverem ativos. Não utilize dados reais.</p>
    </div>
  </div>;
};
