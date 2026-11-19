import React from 'react';
import { AlertTriangle, CheckCircle2, CloudOff, RefreshCw } from 'lucide-react';
import { cx } from '../ui';

type DataState = 'loading' | 'persistent' | 'unavailable';

interface ParentDataStatusProps {
  isOnline: boolean;
  states: DataState[];
  updatedAt?: string;
  errors: Array<string | undefined>;
  onRefresh: () => void;
}

const formatUpdatedAt = (value?: string) => value
  ? new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(new Date(value))
  : '—';

/** Linha discreta quando está tudo bem; aviso destacado quando há falha ou falta de conexão. */
export const ParentDataStatus: React.FC<ParentDataStatusProps> = ({ isOnline, states, updatedAt, errors, onRefresh }) => {
  const isLoading = states.some((state) => state === 'loading');
  const hasFailure = states.some((state) => state === 'unavailable');
  const errorSummary = [...new Set(errors.filter(Boolean))].join(' ');
  const degraded = !isOnline || hasFailure;

  const Icon = !isOnline ? CloudOff : hasFailure ? AlertTriangle : isLoading ? RefreshCw : CheckCircle2;
  const message = !isOnline
    ? 'Sem conexão. Exibindo apenas os dados já carregados nesta sessão.'
    : hasFailure
      ? `Atualização parcial. ${errorSummary || 'Um dos serviços locais não respondeu.'}`
      : isLoading
        ? 'Atualizando os dados do portal…'
        : `Dados do servidor da escola · atualizados às ${formatUpdatedAt(updatedAt)}`;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cx(
        'flex flex-wrap items-center gap-x-3 gap-y-2 text-[13px]',
        degraded ? 'rounded-[10px] border border-warning-line bg-warning-soft px-4 py-3 text-[#6f4508]' : 'text-muted',
      )}
    >
      <Icon aria-hidden="true" className={cx('h-4 w-4 shrink-0', isLoading && !degraded && 'animate-spin', !degraded && !isLoading && 'text-positive')} />
      <p className="min-w-0 flex-1">
        {message}
        {degraded && <span className="mt-0.5 block text-xs opacity-80">Dados pessoais não são gravados no cache offline do navegador.</span>}
      </p>
      <button
        type="button"
        className="btn-link"
        onClick={onRefresh}
        disabled={!isOnline || isLoading}
        title={isOnline ? 'Atualizar agora' : 'Reconecte-se para atualizar'}
      >
        <RefreshCw aria-hidden="true" />
        Atualizar
      </button>
    </div>
  );
};
