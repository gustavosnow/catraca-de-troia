import React from 'react';
import { AlertTriangle, Check, CheckCircle2, ShieldAlert } from 'lucide-react';
import type { SecurityAlert } from '../types';
import { AllClearIllustration } from './brand/Illustrations';
import { Chip, EmptyState, Modal } from './ui';

interface AlertsModalProps {
  alerts: SecurityAlert[];
  isOpen: boolean;
  onClose: () => void;
  onResolveAlert: (alertId: string) => void;
}

export const AlertsModal: React.FC<AlertsModalProps> = ({ alerts, isOpen, onClose, onResolveAlert }) => {
  const open = alerts.filter((alert) => !alert.resolved);
  const resolved = alerts.filter((alert) => alert.resolved);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      labelledById="alerts-modal-title"
      title="Pontos de atenção"
      description="Ocorrências simuladas da sessão para treinar a rotina da portaria."
      icon={ShieldAlert}
      footer={<button type="button" className="btn btn-secondary" onClick={onClose}>Fechar</button>}
    >
      {alerts.length === 0 ? (
        <EmptyState compact illustration={<AllClearIllustration className="mb-3 h-20" />} title="Nada pendente" description="Nenhuma ocorrência aberta nesta sessão." />
      ) : (
        <ul className="divide-y divide-line">
          {[...open, ...resolved].map((alert) => (
            <li key={alert.id} className="flex gap-3 py-4 first:pt-0 last:pb-0">
              <span className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${alert.resolved ? 'bg-surface-2 text-muted' : 'bg-warning-soft text-warning'}`}>
                {alert.resolved ? <CheckCircle2 aria-hidden="true" className="h-4 w-4" /> : <AlertTriangle aria-hidden="true" className="h-4 w-4" />}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className={`text-sm font-semibold ${alert.resolved ? 'text-muted line-through decoration-line-strong' : 'text-ink'}`}>{alert.title}</p>
                  {alert.resolved && <Chip tone="positive" icon={Check}>Verificado</Chip>}
                </div>
                <p className="mt-1 text-[13px] leading-relaxed text-muted">{alert.description}</p>
                <p className="tabular mt-2 text-xs text-subtle">{alert.time.slice(0, 5)} · {alert.turnstile}</p>
              </div>
              {!alert.resolved && (
                <button type="button" className="btn btn-secondary btn-sm shrink-0 self-start" onClick={() => onResolveAlert(alert.id)}>
                  <Check aria-hidden="true" />
                  Marcar verificado
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
};
