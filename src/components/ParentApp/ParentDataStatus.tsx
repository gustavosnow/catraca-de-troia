import React from 'react';
import { AlertTriangle, CheckCircle2, CloudOff, RefreshCw } from 'lucide-react';

type DataState = 'loading' | 'persistent' | 'unavailable';

interface ParentDataStatusProps {
  isOnline: boolean;
  states: DataState[];
  updatedAt?: string;
  errors: Array<string | undefined>;
  onRefresh: () => void;
}

const formatUpdatedAt = (value?: string) => value
  ? new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    .format(new Date(value))
  : 'ainda não disponível';

export const ParentDataStatus: React.FC<ParentDataStatusProps> = ({
  isOnline,
  states,
  updatedAt,
  errors,
  onRefresh,
}) => {
  const isLoading = states.some((state) => state === 'loading');
  const hasFailure = states.some((state) => state === 'unavailable');
  const errorSummary = [...new Set(errors.filter(Boolean))].join(' ');

  const style = !isOnline
    ? 'border-amber-800 bg-amber-950/60 text-amber-100'
    : hasFailure
      ? 'border-amber-800 bg-amber-950/50 text-amber-100'
      : isLoading
        ? 'border-blue-800 bg-blue-950/50 text-blue-100'
        : 'border-emerald-900 bg-emerald-950/40 text-emerald-100';

  const Icon = !isOnline ? CloudOff : hasFailure ? AlertTriangle : isLoading ? RefreshCw : CheckCircle2;
  const message = !isOnline
    ? 'Sem conexão. Exibindo apenas os dados já carregados nesta sessão.'
    : hasFailure
      ? `Atualização parcial. ${errorSummary || 'Um dos serviços locais não respondeu.'}`
      : isLoading
        ? 'Atualizando os dados do portal…'
        : 'Dados consultados na API local demonstrativa.';

  return (
    <div className={`shrink-0 border-b px-4 py-2 text-[11px] ${style}`} role="status" aria-live="polite">
      <div className="flex items-start gap-2">
        <Icon className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${isLoading && isOnline ? 'animate-spin' : ''}`} />
        <div className="min-w-0 flex-1">
          <p>{message}</p>
          <p className="mt-0.5 opacity-80">
            Última atualização: {formatUpdatedAt(updatedAt)}. Dados pessoais não são gravados no cache offline da PWA.
          </p>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          disabled={!isOnline || isLoading}
          className="shrink-0 rounded-lg border border-current/30 px-2 py-1 font-bold disabled:cursor-not-allowed disabled:opacity-40"
          title={isOnline ? 'Atualizar agora' : 'Reconecte-se para atualizar'}
        >
          Atualizar
        </button>
      </div>
    </div>
  );
};
