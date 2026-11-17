import React from 'react';
import { AlertTriangle, CloudOff, Database, RefreshCw } from 'lucide-react';
import type { AccessEventSyncStatus } from '../../../shared/contracts/accessEventSync';
import { Callout } from '../ui';

interface SyncQueueCardProps {
  status: AccessEventSyncStatus | null;
  state: 'loading' | 'available' | 'unavailable';
  error?: string;
  canRetry: boolean;
  isRetrying: boolean;
  onRetry: () => void;
}

/** Fila local do servidor escolar: figuras + barra segmentada fina. */
export const SyncQueueCard: React.FC<SyncQueueCardProps> = ({ status, state, error, canRetry, isRetrying, onRetry }) => {
  const segments = status
    ? [
        { key: 'synced', label: 'Sincronizados', value: status.synced, color: 'bg-positive' },
        { key: 'processing', label: 'Processando', value: status.processing, color: 'bg-info' },
        { key: 'pending', label: 'Pendentes', value: status.pending, color: 'bg-brand' },
        { key: 'conflicts', label: 'Conflitos', value: status.conflicts, color: 'bg-negative' },
      ]
    : [];
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);

  return (
    <section className="card p-5" aria-labelledby="sync-queue-title">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 id="sync-queue-title" className="card-title">Fila local</h2>
          <p className="card-subtitle">Continuidade do servidor escolar</p>
        </div>
        <Database aria-hidden="true" className="h-[18px] w-[18px] text-muted" />
      </div>

      {state === 'loading' && !status ? (
        <div className="mt-5 space-y-3" aria-hidden="true">
          <div className="skeleton h-1.5 w-full" />
          <div className="skeleton h-10 w-full" />
        </div>
      ) : state === 'unavailable' && !status ? (
        <Callout tone="negative" className="mt-4" role="alert">{error || 'Não foi possível consultar a fila local.'}</Callout>
      ) : status && (
        <>
          <div className="mt-5 flex h-1.5 w-full gap-[2px] overflow-hidden rounded-full bg-surface-2" role="img" aria-label={`Distribuição da fila: ${segments.map((segment) => `${segment.value} ${segment.label.toLowerCase()}`).join(', ')}`}>
            {total > 0 && segments.filter((segment) => segment.value > 0).map((segment) => (
              <span key={segment.key} className={segment.color} style={{ width: `${(segment.value / total) * 100}%` }} />
            ))}
          </div>
          <dl className="mt-4 grid grid-cols-3 gap-2">
            {[
              ['Pendentes', status.pending + status.processing],
              ['Sincronizados', status.synced],
              ['Conflitos', status.conflicts],
            ].map(([label, value]) => (
              <div key={label}>
                <dd className="tabular text-lg font-bold text-ink">{value}</dd>
                <dt className="text-xs text-muted">{label}</dt>
              </div>
            ))}
          </dl>

          <div className="mt-4 border-t border-line pt-4 text-xs text-muted">
            <p className="flex items-start gap-2">
              <CloudOff aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              {status.configured
                ? 'Destino remoto configurado: o envio é retomado quando houver conectividade.'
                : 'Destino remoto não configurado. Os eventos ficam preservados no SQLite local.'}
            </p>
            <p className="mt-1.5 pl-[22px]">
              Última sincronização: {status.lastSyncedAt ? new Date(status.lastSyncedAt).toLocaleString('pt-BR') : 'nenhuma nesta base'}
            </p>
          </div>

          {status.conflicts > 0 && (
            <div className="mt-4 rounded-[10px] border border-negative-line bg-negative-soft p-3">
              <p className="flex items-start gap-2 text-xs text-[#8f2329]">
                <AlertTriangle aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                Conteúdo divergente foi isolado e não sobrescreveu o destino.
              </p>
              {canRetry ? (
                <button type="button" onClick={onRetry} disabled={isRetrying} className="btn btn-sm btn-danger-outline mt-2.5 w-full">
                  <RefreshCw aria-hidden="true" />
                  {isRetrying ? 'Reenfileirando…' : 'Reenfileirar conflitos'}
                </button>
              ) : (
                <p className="mt-2 text-[11px] text-[#8f2329]">Coordenação ou Direção deve revisar e reenfileirar.</p>
              )}
            </div>
          )}
        </>
      )}
    </section>
  );
};
