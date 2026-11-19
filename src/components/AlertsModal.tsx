import React from 'react';
import { AlertTriangle, ShieldAlert } from 'lucide-react';
import type { SecurityAlert } from '../types';
import { DEMO_ACCESS_LABEL } from '../services/accessHistory';
import { AllClearIllustration } from './brand/Illustrations';
import { EmptyState, Modal } from './ui';

interface AlertsModalProps {
  alerts: SecurityAlert[];
  isOpen: boolean;
  onClose: () => void;
}

const timeOf = (iso: string) =>
  new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

/** Leituras negadas pelo protótipo facial hoje, lidas do servidor da escola. */
export const AlertsModal: React.FC<AlertsModalProps> = ({ alerts, isOpen, onClose }) => (
  <Modal
    isOpen={isOpen}
    onClose={onClose}
    labelledById="alerts-modal-title"
    icon={ShieldAlert}
    title="Pontos de atenção"
    description="Leituras negadas hoje pelo reconhecimento facial. Nenhuma imagem é guardada."
    footer={<button type="button" className="btn btn-secondary" onClick={onClose}>Fechar</button>}
  >
    {alerts.length === 0 ? (
      <EmptyState compact illustration={<AllClearIllustration className="mb-3 h-20" />} title="Nada pendente" description="Nenhuma leitura negada hoje." />
    ) : (
      <ul className="divide-y divide-line">
        {alerts.map((alert) => (
          <li key={alert.id} className="flex gap-3 py-4">
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-warning-soft text-warning">
              <AlertTriangle aria-hidden="true" className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-ink">{alert.title}</p>
              <p className="mt-0.5 text-[13px] text-muted">
                {alert.turnstileName} · {alert.direction === 'entry' ? 'entrada' : 'saída'}{alert.demo && ` · ${DEMO_ACCESS_LABEL}`}
              </p>
            </div>
            <span className="tabular shrink-0 text-xs text-muted">{timeOf(alert.occurredAt)}</span>
          </li>
        ))}
      </ul>
    )}
    <p className="mt-4 text-xs text-muted">
      Leitura negada não registra passagem nem notifica responsáveis. Se o estudante tiver direito de
      passar, use a passagem assistida.
    </p>
  </Modal>
);
