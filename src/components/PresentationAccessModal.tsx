import React, { useEffect, useMemo, useState } from 'react';
import { Check, Copy, ExternalLink, LoaderCircle, MonitorSmartphone, Pencil, Share2, Wifi, X } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useAccessibleDialog } from '../hooks/useAccessibleDialog';
import { getPresentationAccess } from '../utils/presentationAccess';

interface PresentationAccessModalProps { isOpen: boolean; onClose: () => void }

export const PresentationAccessModal: React.FC<PresentationAccessModalProps> = ({ isOpen, onClose }) => {
  const [automaticAddress, setAutomaticAddress] = useState('');
  const [customAddress, setCustomAddress] = useState('');
  const [showCustomAddress, setShowCustomAddress] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [resolutionError, setResolutionError] = useState('');
  const [copied, setCopied] = useState(false);
  const [actionError, setActionError] = useState('');
  const address = customAddress.trim() || automaticAddress;
  const access = useMemo(() => address ? getPresentationAccess(address) : {}, [address]);
  const dialogRef = useAccessibleDialog({ isOpen, onClose });

  useEffect(() => {
    if (!isOpen) return;
    const controller = new AbortController();
    const resolveAddress = async () => {
      setIsResolving(true);
      setResolutionError('');
      setAutomaticAddress('');
      setCustomAddress('');
      setShowCustomAddress(false);
      setCopied(false);
      setActionError('');

      const currentAddress = `${window.location.origin}${window.location.pathname}`;
      if (getPresentationAccess(currentAddress).url) {
        setAutomaticAddress(currentAddress);
        setIsResolving(false);
        return;
      }

      try {
        const response = await fetch('/api/presentation-access', {
          cache: 'no-store',
          signal: controller.signal,
        });
        if (!response.ok) throw new Error('Serviço de apresentação indisponível.');
        const payload = await response.json() as { data?: { origins?: string[] } };
        const candidate = payload.data?.origins?.find((origin) => getPresentationAccess(origin).url);
        if (!candidate) throw new Error('Nenhum endereço de rede local foi encontrado.');
        setAutomaticAddress(candidate);
      } catch (error) {
        if (controller.signal.aborted) return;
        setResolutionError(error instanceof Error ? error.message : 'Não foi possível preparar o acesso direto.');
        setShowCustomAddress(true);
      } finally {
        if (!controller.signal.aborted) setIsResolving(false);
      }
    };
    void resolveAddress();
    return () => controller.abort();
  }, [isOpen]);

  if (!isOpen) return null;

  const copyLink = async () => {
    if (!access.url) return;
    setActionError('');
    try {
      await navigator.clipboard.writeText(access.url);
      setCopied(true);
    } catch {
      setActionError('Não foi possível copiar automaticamente. Selecione e copie o endereço exibido abaixo.');
    }
  };
  const shareLink = async () => {
    if (!access.url) return;
    try {
      if (navigator.share) await navigator.share({ title: 'Catraca de Troia — Portal dos Responsáveis', url: access.url });
      else await copyLink();
    } catch (error) {
      if (!(error instanceof DOMException && error.name === 'AbortError')) setActionError('Não foi possível compartilhar. Copie o endereço ou use o QR Code.');
    }
  };

  return <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/80 p-4 backdrop-blur-sm" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
    <section ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="presentation-access-title" tabIndex={-1} className="my-auto w-full max-w-2xl rounded-3xl border border-slate-700 bg-[#0B192C] p-5 text-white shadow-2xl sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <MonitorSmartphone className="mt-1 h-6 w-6 shrink-0 text-orange-400" />
          <div><h2 id="presentation-access-title" className="text-lg font-black">Apresentar portal por QR Code</h2><p className="mt-1 text-sm text-slate-300">Aponte a câmera do celular e abra o portal no navegador. Não é necessário baixar APK, instalar PWA ou alterar configurações de segurança.</p></div>
        </div>
        <button type="button" onClick={onClose} aria-label="Fechar acesso de apresentação" className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white"><X className="h-5 w-5" /></button>
      </div>
      {isResolving && <div className="mt-5 flex items-center gap-2 rounded-xl border border-blue-800 bg-blue-950/50 p-3 text-sm text-blue-100" role="status">
        <LoaderCircle className="h-4 w-4 animate-spin" /> Preparando o acesso direto pela rede local…
      </div>}
      {!isResolving && access.url && !customAddress && <div className="mt-5 flex items-start gap-2 rounded-xl border border-emerald-800 bg-emerald-950/40 p-3 text-sm text-emerald-100" role="status">
        <Wifi className="mt-0.5 h-4 w-4 shrink-0" />
        <div><strong>Acesso direto pronto.</strong><p className="mt-0.5 text-xs text-emerald-200/80">O QR abre a entrada do portal dos responsáveis neste navegador.</p></div>
      </div>}
      {resolutionError && <p role="status" className="mt-4 rounded-xl border border-amber-800 bg-amber-950/40 p-3 text-sm text-amber-200">{resolutionError} Informe abaixo um endereço HTTPS ou o IP deste computador na rede Wi-Fi.</p>}
      {showCustomAddress && <div className="mt-4">
        <label className="block text-xs font-bold text-orange-300" htmlFor="presentation-address">Outro endereço alcançável pelo celular</label>
        <input id="presentation-address" type="url" value={customAddress} onChange={event => { setCustomAddress(event.target.value); setCopied(false); setActionError(''); }} placeholder="https://endereco-da-apresentacao" className="mt-2 w-full rounded-xl border border-slate-600 bg-slate-950 p-3 text-sm text-white" />
      </div>}
      {!isResolving && !showCustomAddress && <button type="button" onClick={() => setShowCustomAddress(true)} className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-slate-300 hover:text-white"><Pencil className="h-3.5 w-3.5" />Usar outro endereço</button>}
      {showCustomAddress && customAddress && access.error && <p role="status" className="mt-3 text-sm text-amber-200">{access.error}</p>}
      {access.url && <div className="mt-5 grid gap-5 sm:grid-cols-[190px_minmax(0,1fr)] sm:items-center">
        <div className="mx-auto rounded-2xl bg-white p-3"><QRCodeSVG value={access.url} size={166} level="M" marginSize={4} aria-label="QR Code para abrir o portal no navegador" /></div>
        <div className="min-w-0 space-y-3">
          <p className="break-all rounded-xl border border-slate-700 bg-slate-950/60 p-3 font-mono text-xs text-slate-200">{access.url}</p>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => void copyLink()} className="flex items-center gap-1.5 rounded-xl bg-orange-600 px-3 py-2 text-xs font-bold">{copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}{copied ? 'Copiado' : 'Copiar link'}</button>
            <button type="button" onClick={() => void shareLink()} className="flex items-center gap-1.5 rounded-xl border border-slate-700 px-3 py-2 text-xs font-bold"><Share2 className="h-4 w-4" />Compartilhar</button>
            <a href={access.url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 rounded-xl border border-slate-700 px-3 py-2 text-xs font-bold"><ExternalLink className="h-4 w-4" />Abrir teste</a>
          </div>
        </div>
      </div>}
      {access.url && <p className="mt-4 text-xs leading-relaxed text-slate-300">{access.localNetwork ? 'Celular e computador devem estar na mesma rede Wi-Fi, e a rede deve permitir comunicação entre aparelhos. Instalação PWA não é necessária.' : 'O portal funciona diretamente no navegador; instalar a PWA ou adicionar à tela inicial é opcional.'}</p>}
      <p className="mt-3 text-xs text-slate-400">O QR Code abre diretamente a entrada do portal, mas não leva sessão ou senha. A autenticação demonstrativa continua na tela seguinte. O computador e a API precisam permanecer ligados.</p>
      {actionError && <p role="status" className="mt-3 text-xs text-amber-200">{actionError}</p>}
    </section>
  </div>;
};
