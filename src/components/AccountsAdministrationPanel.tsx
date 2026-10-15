import React, { useMemo, useState } from 'react';
import { Ban, CheckCircle2, KeyRound, RefreshCw, Search, ShieldCheck, X } from 'lucide-react';
import type { ManagedAccount } from '../../shared/contracts/accountAdministration';

interface AccountsAdministrationPanelProps {
  accounts: ManagedAccount[];
  currentUserId: string;
  state: 'loading' | 'persistent' | 'unavailable';
  error?: string;
  onRefresh: () => void;
  onUpdateStatus: (account: ManagedAccount, reason: string) => Promise<void>;
  onRevokeSessions: (account: ManagedAccount, reason: string) => Promise<void>;
}

type PendingAction = { type: 'status' | 'sessions'; account: ManagedAccount };

const roleLabels: Record<string, string> = {
  GUARDIAN: 'Responsável',
  STAFF_GATE: 'Portaria',
  STAFF_COORDINATION: 'Coordenação',
  STAFF_DIRECTION: 'Direção',
};

export const AccountsAdministrationPanel: React.FC<AccountsAdministrationPanelProps> = ({
  accounts,
  currentUserId,
  state,
  error,
  onRefresh,
  onUpdateStatus,
  onRevokeSessions,
}) => {
  const [query, setQuery] = useState('');
  const [pending, setPending] = useState<PendingAction | null>(null);
  const [reason, setReason] = useState('');
  const [actionError, setActionError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);
  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('pt-BR');
    if (!normalized) return accounts;
    return accounts.filter((account) => [account.name, account.email, account.functionalRegistry, roleLabels[account.role]]
      .some((value) => value?.toLocaleLowerCase('pt-BR').includes(normalized)));
  }, [accounts, query]);

  const submit = async () => {
    if (!pending || reason.trim().length < 5) {
      setActionError('Descreva o motivo em pelo menos 5 caracteres.');
      return;
    }
    setSubmitting(true);
    setActionError(undefined);
    try {
      if (pending.type === 'status') await onUpdateStatus(pending.account, reason.trim());
      else await onRevokeSessions(pending.account, reason.trim());
      setPending(null);
      setReason('');
    } catch (caught) {
      setActionError(caught instanceof Error ? caught.message : 'Não foi possível concluir a ação.');
    } finally {
      setSubmitting(false);
    }
  };

  return <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-5 w-5 text-blue-700" />
        <div>
          <h2 className="text-sm font-bold text-slate-900">Contas e sessões locais</h2>
          <p className="text-[11px] text-slate-500">Administração das identidades fictícias deste ambiente acadêmico.</p>
        </div>
      </div>
      <button type="button" onClick={onRefresh} disabled={state === 'loading'} className="flex items-center justify-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 disabled:opacity-60">
        <RefreshCw className={`h-3.5 w-3.5 ${state === 'loading' ? 'animate-spin' : ''}`} /> Atualizar
      </button>
    </div>
    <label className="relative mt-3 block">
      <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
      <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por nome, e-mail, matrícula ou perfil" className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-xs outline-none focus:border-blue-500" />
    </label>
    {state === 'unavailable' && <p role="alert" className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">{error || 'Contas indisponíveis.'}</p>}
    {state === 'loading' && accounts.length === 0 && <p className="mt-3 text-xs text-slate-500">Carregando contas…</p>}
    <div className="mt-3 space-y-2">
      {filtered.map((account) => {
        const ownAccount = account.id === currentUserId;
        return <article key={account.id} className="grid gap-3 rounded-xl border border-slate-200 p-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate text-xs font-bold text-slate-900">{account.name}</h3>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">{roleLabels[account.role]}</span>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${account.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>{account.status === 'ACTIVE' ? 'Ativa' : 'Bloqueada'}</span>
              {ownAccount && <span className="text-[10px] font-semibold text-blue-700">Sessão atual</span>}
            </div>
            <p className="mt-1 truncate text-[11px] text-slate-500">{account.email || account.phone || account.functionalRegistry || 'Sem identificador exibido'}</p>
            <p className="mt-1 text-[11px] text-slate-500">{account.activeSessionCount} sessão(ões) ativa(s){account.lastSessionAt ? ` • último uso ${new Date(account.lastSessionAt).toLocaleString('pt-BR')}` : ''}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" disabled={ownAccount} onClick={() => { setPending({ type: 'sessions', account }); setReason(''); setActionError(undefined); }} className="flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] font-bold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40">
              <KeyRound className="h-3.5 w-3.5" /> Encerrar sessões
            </button>
            <button type="button" disabled={ownAccount} onClick={() => { setPending({ type: 'status', account }); setReason(''); setActionError(undefined); }} className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-bold disabled:cursor-not-allowed disabled:opacity-40 ${account.status === 'ACTIVE' ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'}`}>
              {account.status === 'ACTIVE' ? <Ban className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
              {account.status === 'ACTIVE' ? 'Bloquear' : 'Desbloquear'}
            </button>
          </div>
        </article>;
      })}
      {state !== 'loading' && filtered.length === 0 && <p className="rounded-xl bg-slate-50 p-3 text-xs text-slate-500">Nenhuma conta corresponde à busca.</p>}
    </div>

    {pending && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4" role="dialog" aria-modal="true" aria-labelledby="account-action-title">
      <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div><h3 id="account-action-title" className="font-bold text-slate-900">{pending.type === 'sessions' ? 'Encerrar sessões remotas' : pending.account.status === 'ACTIVE' ? 'Bloquear conta local' : 'Desbloquear conta local'}</h3><p className="mt-1 text-xs text-slate-500">{pending.account.name}</p></div>
          <button type="button" onClick={() => setPending(null)} aria-label="Fechar" className="rounded-lg p-1 text-slate-500 hover:bg-slate-100"><X className="h-4 w-4" /></button>
        </div>
        <label className="mt-4 block text-xs font-bold text-slate-700">Motivo obrigatório
          <textarea value={reason} onChange={(event) => setReason(event.target.value)} rows={3} maxLength={500} className="mt-1 w-full rounded-xl border border-slate-200 p-3 text-xs outline-none focus:border-blue-500" placeholder="Registre o motivo para a trilha de auditoria." />
        </label>
        {actionError && <p role="alert" className="mt-2 text-xs text-rose-700">{actionError}</p>}
        <div className="mt-4 flex justify-end gap-2"><button type="button" onClick={() => setPending(null)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700">Cancelar</button><button type="button" onClick={() => void submit()} disabled={submitting} className="rounded-lg bg-blue-700 px-3 py-2 text-xs font-bold text-white disabled:opacity-60">{submitting ? 'Salvando…' : 'Confirmar ação'}</button></div>
      </div>
    </div>}
  </section>;
};
