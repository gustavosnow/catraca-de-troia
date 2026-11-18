import React from 'react';
import { AlertTriangle, CheckCircle2, Clock3, RefreshCw, RotateCcw, Send, WifiOff } from 'lucide-react';
import type { NotificationDeliverySnapshot } from '../../shared/contracts/notificationDelivery';
import { Callout, Chip, EmptyState } from './ui';

interface NotificationDeliveryPanelProps {
  snapshot?: NotificationDeliverySnapshot;
  state: 'loading' | 'persistent' | 'unavailable';
  error?: string;
  busy: boolean;
  onRefresh: () => void;
  onProcess: (outcome: 'DELIVER' | 'FAIL_RETRY') => void;
  onRetry: () => void;
}

export const NotificationDeliveryPanel: React.FC<NotificationDeliveryPanelProps> = ({
  snapshot,
  state,
  error,
  busy,
  onRefresh,
  onProcess,
  onRetry,
}) => {
  const pending = snapshot?.counts.PENDING ?? 0;
  const delivered = snapshot?.counts.DELIVERED ?? 0;
  const failed = snapshot?.counts.FAILED ?? 0;

  return (
    <section className="card overflow-hidden" aria-labelledby="delivery-title">
      <div className="card-header flex-col">
        <div>
          <h2 id="delivery-title" className="card-title">Fila de entrega de notificações</h2>
          <p className="card-subtitle">Estados e retentativas persistem no SQLite. O canal PUSH_DEMO não envia mensagens reais.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn btn-sm btn-ghost" onClick={onRefresh} disabled={busy}>
            <RefreshCw aria-hidden="true" className={state === 'loading' ? 'animate-spin' : undefined} />
            Atualizar
          </button>
          <button type="button" className="btn btn-sm btn-secondary" onClick={onRetry} disabled={busy || !failed}>
            <RotateCcw aria-hidden="true" />
            Reenfileirar falhas
          </button>
          <button type="button" className="btn btn-sm btn-secondary" onClick={() => onProcess('FAIL_RETRY')} disabled={busy || !pending}>
            <WifiOff aria-hidden="true" />
            Simular indisponibilidade
          </button>
          <button type="button" className="btn btn-sm btn-primary" onClick={() => onProcess('DELIVER')} disabled={busy || (!pending && !failed)}>
            <Send aria-hidden="true" />
            Processar fila
          </button>
        </div>
      </div>

      {state === 'unavailable' && (
        <div className="px-6 pb-4"><Callout tone="negative" role="alert">{error || 'Fila indisponível.'}</Callout></div>
      )}

      <dl className="grid grid-cols-3 border-y border-line">
        {[
          ['Pendentes', pending, Clock3],
          ['Entregues na simulação', delivered, CheckCircle2],
          ['Aguardando retentativa', failed, AlertTriangle],
        ].map(([label, value, Icon]) => {
          const IconComponent = Icon as typeof Clock3;
          return (
            <div key={label as string} className="border-r border-line px-6 py-4 last:border-r-0">
              <dt className="flex items-center gap-1.5 text-xs text-muted">
                <IconComponent aria-hidden="true" className="h-3.5 w-3.5" />
                {label as string}
              </dt>
              <dd className="tabular mt-1 text-2xl font-bold text-ink">{value as number}</dd>
            </div>
          );
        })}
      </dl>

      {!snapshot?.records.length ? (
        <EmptyState compact icon={Send} title="Fila vazia" description="Novos eventos, justificativas, vínculos e comunicados alimentam a fila." />
      ) : (
        <div className="table-scroll max-h-[360px] overflow-y-auto">
          <table className="data-table min-w-[680px]">
            <caption className="sr-only">Entregas de notificação</caption>
            <thead>
              <tr>
                <th scope="col" className="pl-6">Notificação</th>
                <th scope="col">Destinatário</th>
                <th scope="col">Tentativas</th>
                <th scope="col" className="pr-6">Situação</th>
              </tr>
            </thead>
            <tbody>
              {snapshot.records.map((record) => (
                <tr key={record.id}>
                  <td className="pl-6">
                    <p className="cell-primary">{record.title}</p>
                    {record.lastError && <p className="cell-secondary text-negative">{record.lastError}</p>}
                  </td>
                  <td>{record.recipientName}</td>
                  <td className="num">{record.attemptCount}</td>
                  <td className="pr-6">
                    {record.state === 'DELIVERED'
                      ? <Chip tone="positive" icon={CheckCircle2}>Entregue (simulação)</Chip>
                      : record.state === 'FAILED'
                        ? <Chip tone="negative" icon={AlertTriangle}>Falha</Chip>
                        : <Chip tone="warning" icon={Clock3}>Pendente</Chip>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};
