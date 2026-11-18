import React, { useMemo, useState } from 'react';
import { Ban, CheckCircle2, KeyRound, Lock, RefreshCw, Search, ShieldCheck } from 'lucide-react';
import type { ManagedAccount } from '../../shared/contracts/accountAdministration';
import { EmptySearchIllustration } from './brand/Illustrations';
import { Avatar, Callout, Chip, EmptyState, Field, Modal, PageHeader, SkeletonRows } from './ui';

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

const ROLE_LABELS: Record<string, string> = {
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
  const [role, setRole] = useState('todos');
  const [pending, setPending] = useState<PendingAction | null>(null);
  const [reason, setReason] = useState('');
  const [actionError, setActionError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);

  const filtered = useMemo(() => {
    const term = query.trim().toLocaleLowerCase('pt-BR');
    return accounts.filter((account) =>
      (role === 'todos' || account.role === role)
      && (!term || [account.name, account.email, account.functionalRegistry, ROLE_LABELS[account.role]]
        .some((value) => value?.toLocaleLowerCase('pt-BR').includes(term))));
  }, [accounts, query, role]);

  const open = (next: PendingAction) => {
    setPending(next);
    setReason('');
    setActionError(undefined);
  };

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

  const blocking = pending?.type === 'status' && pending.account.status === 'ACTIVE';
  const modalTitle = pending?.type === 'sessions'
    ? 'Encerrar sessões'
    : blocking ? 'Bloquear conta' : 'Desbloquear conta';

  return (
    <>
      <PageHeader
        eyebrow="Administração"
        title="Contas e permissões"
        description="Identidades fictícias deste ambiente acadêmico e suas sessões ativas."
        actions={
          <button type="button" className="btn btn-secondary" onClick={onRefresh} disabled={state === 'loading'}>
            <RefreshCw aria-hidden="true" className={state === 'loading' ? 'animate-spin' : undefined} />
            Atualizar
          </button>
        }
      />

      <section className="card overflow-hidden" aria-labelledby="accounts-title">
        <div className="card-header">
          <div>
            <h2 id="accounts-title" className="card-title">
              Contas locais <span className="font-normal text-muted">/ {accounts.length}</span>
            </h2>
            <p className="card-subtitle">Bloqueios e encerramentos exigem motivo e ficam na auditoria.</p>
          </div>
        </div>

        <div className="grid gap-3 px-6 pb-5 md:grid-cols-[minmax(0,1fr)_200px]">
          <div className="relative">
            <label htmlFor="accounts-search" className="sr-only">Buscar contas</label>
            <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
            <input id="accounts-search" type="search" className="input pl-9" placeholder="Nome, e-mail ou matrícula funcional" value={query} onChange={(event) => setQuery(event.target.value)} />
          </div>
          <div>
            <label htmlFor="accounts-role" className="sr-only">Perfil</label>
            <select id="accounts-role" className="select" value={role} onChange={(event) => setRole(event.target.value)}>
              <option value="todos">Todos os perfis</option>
              {Object.entries(ROLE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </div>
        </div>

        {state === 'unavailable' && (
          <div className="px-6 pb-4"><Callout tone="negative" role="alert">{error || 'Contas indisponíveis.'}</Callout></div>
        )}

        {state === 'loading' && accounts.length === 0 ? (
          <SkeletonRows rows={5} />
        ) : filtered.length === 0 ? (
          <EmptyState illustration={<EmptySearchIllustration className="mb-4 h-20" />} title="Nenhuma conta encontrada" description="Ajuste a busca ou o perfil selecionado." />
        ) : (
          <div className="table-scroll">
            <table className="data-table min-w-[860px]">
              <caption className="sr-only">Contas locais</caption>
              <thead>
                <tr>
                  <th scope="col" className="pl-6">Conta</th>
                  <th scope="col">Perfil</th>
                  <th scope="col">Sessões</th>
                  <th scope="col">Situação</th>
                  <th scope="col" className="pr-6 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((account) => {
                  const own = account.id === currentUserId;
                  return (
                    <tr key={account.id}>
                      <td className="pl-6">
                        <div className="flex items-center gap-3">
                          <Avatar name={account.name} />
                          <div className="min-w-0">
                            <p className="cell-primary flex items-center gap-2">
                              {account.name}
                              {own && <span className="chip chip-info h-5 px-1.5 text-[11px]">Você</span>}
                            </p>
                            <p className="cell-secondary truncate">{account.email || account.phone || account.functionalRegistry || 'Sem identificador exibido'}</p>
                          </div>
                        </div>
                      </td>
                      <td>{ROLE_LABELS[account.role] ?? account.role}</td>
                      <td className="num">
                        <p className="font-medium">{account.activeSessionCount} {account.activeSessionCount === 1 ? 'ativa' : 'ativas'}</p>
                        {account.lastSessionAt && <p className="cell-secondary">Último uso {new Date(account.lastSessionAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</p>}
                      </td>
                      <td>
                        {account.status === 'ACTIVE'
                          ? <Chip tone="positive" icon={CheckCircle2}>Ativa</Chip>
                          : <Chip tone="negative" icon={Lock}>Bloqueada</Chip>}
                      </td>
                      <td className="pr-6">
                        <div className="flex justify-end gap-2">
                          <button type="button" className="btn btn-sm btn-secondary" disabled={own || account.activeSessionCount === 0} onClick={() => open({ type: 'sessions', account })} title={own ? 'Não é possível encerrar a própria sessão por aqui' : undefined}>
                            <KeyRound aria-hidden="true" />
                            Encerrar sessões
                          </button>
                          <button type="button" className={`btn btn-sm ${account.status === 'ACTIVE' ? 'btn-danger-outline' : 'btn-secondary'}`} disabled={own} onClick={() => open({ type: 'status', account })}>
                            {account.status === 'ACTIVE' ? <Ban aria-hidden="true" /> : <CheckCircle2 aria-hidden="true" />}
                            {account.status === 'ACTIVE' ? 'Bloquear' : 'Desbloquear'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <div className="table-footer">
          <span className="inline-flex items-center gap-1.5"><ShieldCheck aria-hidden="true" className="h-3.5 w-3.5" /> Permissões aplicadas pelo backend, por perfil e vínculo validado</span>
        </div>
      </section>

      <Modal
        isOpen={Boolean(pending)}
        onClose={() => !submitting && setPending(null)}
        labelledById="account-action-title"
        icon={pending?.type === 'sessions' ? KeyRound : blocking ? Ban : CheckCircle2}
        title={modalTitle}
        description={pending?.account.name}
        closeDisabled={submitting}
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setPending(null)} disabled={submitting}>Cancelar</button>
            <button type="button" className={`btn ${blocking ? 'btn-danger' : 'btn-primary'}`} onClick={() => void submit()} disabled={submitting}>
              {submitting ? 'Salvando…' : modalTitle}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          {pending?.type === 'sessions' && <Callout tone="warning">Todas as sessões ativas desta conta serão encerradas. A pessoa precisará entrar novamente.</Callout>}
          {blocking && <Callout tone="negative">A conta deixará de acessar o sistema até ser desbloqueada.</Callout>}
          <Field label="Motivo obrigatório" htmlFor="account-action-reason" hint="Ao menos 5 caracteres. Registrado na trilha de auditoria." error={actionError}>
            <textarea id="account-action-reason" className="textarea" rows={3} maxLength={500} value={reason} onChange={(event) => setReason(event.target.value)} aria-invalid={Boolean(actionError)} />
          </Field>
        </div>
      </Modal>
    </>
  );
};
