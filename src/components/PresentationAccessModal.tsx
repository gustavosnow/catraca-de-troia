import React, { useEffect, useMemo, useState } from 'react';
import { Check, Copy, ExternalLink, LoaderCircle, Pencil, QrCode, Share2, Wifi } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Callout, Field, Modal } from './ui';
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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      labelledById="presentation-access-title"
      icon={QrCode}
      title="Apresentar portal por QR Code"
      description="Aponte a câmera do celular e abra o portal no navegador. Não é preciso instalar APK ou PWA."
      size="lg"
      footer={<button type="button" className="btn btn-secondary" onClick={onClose}>Fechar</button>}
    >
      <div className="space-y-4">
        {isResolving && (
          <Callout tone="info" icon={LoaderCircle} role="status">Preparando o acesso direto pela rede local…</Callout>
        )}
        {!isResolving && access.url && !customAddress && (
          <Callout tone="positive" icon={Wifi} role="status" title="Acesso direto pronto.">
            O QR abre a entrada do portal dos responsáveis no navegador do celular.
          </Callout>
        )}
        {resolutionError && (
          <Callout tone="warning" role="status">{resolutionError} Informe abaixo um endereço HTTPS ou o IP deste computador na rede Wi-Fi.</Callout>
        )}

        {showCustomAddress ? (
          <Field label="Outro endereço alcançável pelo celular" htmlFor="presentation-address" error={customAddress && access.error ? access.error : undefined}>
            <input
              id="presentation-address"
              type="url"
              className="input"
              value={customAddress}
              onChange={(event) => { setCustomAddress(event.target.value); setCopied(false); setActionError(''); }}
              placeholder="https://endereco-da-apresentacao"
            />
          </Field>
        ) : !isResolving && (
          <button type="button" className="btn-link" onClick={() => setShowCustomAddress(true)}>
            <Pencil aria-hidden="true" />
            Usar outro endereço
          </button>
        )}

        {access.url && (
          <div className="grid gap-6 rounded-xl border border-line p-5 sm:grid-cols-[180px_minmax(0,1fr)] sm:items-center">
            <div className="mx-auto rounded-xl border border-line bg-white p-2">
              <QRCodeSVG value={access.url} size={160} level="M" marginSize={2} fgColor="#1b2a41" aria-label="QR Code para abrir o portal no navegador" />
            </div>
            <div className="min-w-0 space-y-3">
              <p className="text-xs font-medium text-muted">Endereço do portal</p>
              <p className="break-all rounded-lg bg-surface px-3 py-2.5 font-mono text-xs text-ink">{access.url}</p>
              <div className="flex flex-wrap gap-2">
                <button type="button" className="btn btn-primary btn-sm" onClick={() => void copyLink()}>
                  {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
                  {copied ? 'Copiado' : 'Copiar link'}
                </button>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => void shareLink()}>
                  <Share2 aria-hidden="true" />
                  Compartilhar
                </button>
                <a href={access.url} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm">
                  <ExternalLink aria-hidden="true" />
                  Abrir teste
                </a>
              </div>
            </div>
          </div>
        )}

        {access.url && (
          <p className="text-[13px] leading-relaxed text-ink-2">
            {access.localNetwork
              ? 'Celular e computador devem estar na mesma rede Wi-Fi, e a rede deve permitir comunicação entre aparelhos.'
              : 'O portal funciona diretamente no navegador; adicionar à tela inicial é opcional.'}
          </p>
        )}
        <p className="text-xs leading-relaxed text-muted">
          O QR Code não carrega sessão nem senha: o login continua na tela seguinte. O computador e a API precisam permanecer ligados.
        </p>
        {actionError && <Callout tone="warning" role="status">{actionError}</Callout>}
      </div>
    </Modal>
  );
};
