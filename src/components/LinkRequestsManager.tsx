import React, { useState } from 'react';
import { ArrowUpRight, Check, CheckCircle2, Clock3, Link2, ShieldCheck, ShieldX, X } from 'lucide-react';
import type {
  GuardianLinkRequestRecord,
  GuardianStudentLinkRecord,
  LinkReviewStatus,
} from '../../shared/contracts/linkRequests';
import { EmptyInboxIllustration } from './brand/Illustrations';
import { Avatar, Callout, Chip, DefinitionList, EmptyState, Field, Modal, PageHeader, SkeletonRows } from './ui';

interface LinkRequestsManagerProps {
  requests: GuardianLinkRequestRecord[];
  links: GuardianStudentLinkRecord[];
  state: 'loading' | 'persistent' | 'unavailable';
  error?: string;
  canReview: boolean;
  onReview: (request: GuardianLinkRequestRecord, status: LinkReviewStatus, note?: string) => Promise<void>;
  onRevoke: (link: GuardianStudentLinkRecord, reason: string) => Promise<void>;
}

type PendingAction =
  | { type: 'review'; request: GuardianLinkRequestRecord }
  | { type: 'revoke'; link: GuardianStudentLinkRecord };

const formatDateTime = (value?: string) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return `${date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '')} · ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
};

export const LinkRequestsManager: React.FC<LinkRequestsManagerProps> = ({
  requests,
  links,
  state,
  error,
  canReview,
  onReview,
  onRevoke,
}) => {
  const [tab, setTab] = useState<'requests' | 'links'>('requests');
  const [action, setAction] = useState<PendingAction>();
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState<'APPROVED' | 'REJECTED' | 'REVOKE'>();
  const [operationError, setOperationError] = useState<string>();

  const pending = requests.filter((request) => request.status === 'PENDING');
  const approved = links.filter((link) => link.status === 'APPROVED');

  const open = (next: PendingAction) => {
    setAction(next);
    setNote('');
    setOperationError(undefined);
  };

  const close = () => {
    if (busy) return;
    setAction(undefined);
  };

  const submitReview = async (status: LinkReviewStatus) => {
    if (action?.type !== 'review') return;
    setBusy(status);
    setOperationError(undefined);
    try {
      await onReview(action.request, status, status === 'REJECTED' ? note.trim() || undefined : undefined);
      setAction(undefined);
    } catch (caught) {
      setOperationError(caught instanceof Error ? caught.message : 'Não foi possível analisar a solicitação.');
    } finally {
      setBusy(undefined);
    }
  };

  const submitRevoke = async () => {
    if (action?.type !== 'revoke') return;
    const reason = note.trim();
    if (reason.length < 5) {
      setOperationError('Informe um motivo com pelo menos 5 caracteres.');
      return;
    }
    setBusy('REVOKE');
    setOperationError(undefined);
    try {
      await onRevoke(action.link, reason);
      setAction(undefined);
    } catch (caught) {
      setOperationError(caught instanceof Error ? caught.message : 'Não foi possível revogar o vínculo.');
    } finally {
      setBusy(undefined);
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Administração"
        title="Vínculos familiares"
        description="Autorizações que liberam os dados de um estudante para a conta de um responsável."
        actions={<Chip tone="brand" icon={ShieldCheck}>Acesso administrativo</Chip>}
      />

      <div role="tablist" aria-label="Vínculos" className="tabs mb-6">
        <button type="button" role="tab" aria-selected={tab === 'requests'} className="tab inline-flex items-center gap-2" onClick={() => setTab('requests')}>
          Solicitações <span className={`count-badge ${tab === 'requests' ? 'count-badge-brand' : ''}`}>{pending.length}</span>
        </button>
        <button type="button" role="tab" aria-selected={tab === 'links'} className="tab inline-flex items-center gap-2" onClick={() => setTab('links')}>
          Vínculos ativos <span className={`count-badge ${tab === 'links' ? 'count-badge-brand' : ''}`}>{approved.length}</span>
        </button>
      </div>

      {(state === 'unavailable' && error) && (
        <Callout tone="warning" role="status" className="mb-4">{error}</Callout>
      )}

      {tab === 'requests' ? (
        <section className="card overflow-hidden" aria-labelledby="link-requests-title">
          <div className="card-header">
            <div>
              <h2 id="link-requests-title" className="card-title">Solicitações de vínculo familiar</h2>
              <p className="card-subtitle">A liberação exige conferência institucional pela escola.</p>
            </div>
          </div>
          {state === 'loading' && requests.length === 0 ? (
            <SkeletonRows rows={2} />
          ) : pending.length === 0 ? (
            <EmptyState illustration={<EmptyInboxIllustration className="mb-4 h-20" />} title="Nenhuma solicitação pendente" description="Novas solicitações feitas pelo portal aparecem aqui." />
          ) : (
            <div className="table-scroll">
              <table className="data-table min-w-[820px]">
                <caption className="sr-only">Solicitações de vínculo pendentes</caption>
                <thead>
                  <tr>
                    <th scope="col" className="pl-6">Solicitante</th>
                    <th scope="col">Estudante</th>
                    <th scope="col">Parentesco</th>
                    <th scope="col">Recebida em</th>
                    <th scope="col">Situação</th>
                    <th scope="col" className="pr-6 text-right">Análise</th>
                  </tr>
                </thead>
                <tbody>
                  {pending.map((request) => (
                    <tr key={request.id}>
                      <td className="pl-6 cell-primary">{request.guardian.name}</td>
                      <td>
                        <div className="flex items-center gap-3">
                          <Avatar name={request.student.name} size="sm" />
                          <div>
                            <p className="font-medium">{request.student.name}</p>
                            <p className="cell-secondary num">{request.student.enrollment}</p>
                          </div>
                        </div>
                      </td>
                      <td>{request.relationship}</td>
                      <td className="num whitespace-nowrap">{formatDateTime(request.submittedAt)}</td>
                      <td><Chip tone="warning" icon={Clock3}>Pendente</Chip></td>
                      <td className="pr-6 text-right">
                        {canReview ? (
                          <button type="button" className="btn-link" onClick={() => open({ type: 'review', request })}>
                            <ArrowUpRight aria-hidden="true" />
                            Analisar
                          </button>
                        ) : <span className="text-xs text-muted">Coordenação/Direção</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ) : (
        <section className="card overflow-hidden" aria-labelledby="active-links-title">
          <div className="card-header">
            <div>
              <h2 id="active-links-title" className="card-title">Vínculos ativos</h2>
              <p className="card-subtitle">A revogação bloqueia imediatamente as APIs protegidas.</p>
            </div>
          </div>
          {approved.length === 0 ? (
            <EmptyState illustration={<EmptyInboxIllustration className="mb-4 h-20" />} title="Nenhum vínculo ativo" />
          ) : (
            <div className="table-scroll">
              <table className="data-table min-w-[760px]">
                <caption className="sr-only">Vínculos familiares ativos</caption>
                <thead>
                  <tr>
                    <th scope="col" className="pl-6">Responsável</th>
                    <th scope="col">Estudante</th>
                    <th scope="col">Aprovado em</th>
                    <th scope="col">Situação</th>
                    <th scope="col" className="pr-6 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {approved.map((link) => (
                    <tr key={`${link.guardian.id}:${link.student.id}`}>
                      <td className="pl-6 cell-primary">{link.guardian.name}</td>
                      <td>
                        <div className="flex items-center gap-3">
                          <Avatar name={link.student.name} size="sm" />
                          <div>
                            <p className="font-medium">{link.student.name}</p>
                            <p className="cell-secondary num">{link.student.enrollment}</p>
                          </div>
                        </div>
                      </td>
                      <td className="num whitespace-nowrap">{formatDateTime(link.approvedAt)}</td>
                      <td><Chip tone="positive" icon={CheckCircle2}>Ativo</Chip></td>
                      <td className="pr-6 text-right">
                        <button type="button" className="btn btn-sm btn-danger-outline" onClick={() => open({ type: 'revoke', link })}>
                          <ShieldX aria-hidden="true" />
                          Revogar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      <Callout tone="neutral" icon={ShieldCheck} className="mt-5">
        Antes da aprovação, o solicitante não consulta a ficha nem o histórico do estudante. A seleção de dependente no portal não substitui a validação feita pela escola.
      </Callout>

      <Modal
        isOpen={Boolean(action)}
        onClose={close}
        labelledById="link-action-title"
        icon={action?.type === 'revoke' ? ShieldX : Link2}
        title={action?.type === 'revoke' ? 'Revogar vínculo' : 'Analisar solicitação'}
        description={action?.type === 'revoke'
          ? `${action.link.guardian.name} · ${action.link.student.name}`
          : action ? `${action.request.guardian.name} · ${action.request.student.name}` : undefined}
        closeDisabled={Boolean(busy)}
        footer={action?.type === 'revoke' ? (
          <>
            <button type="button" className="btn btn-secondary" onClick={close} disabled={Boolean(busy)}>Cancelar</button>
            <button type="button" className="btn btn-danger" onClick={() => void submitRevoke()} disabled={Boolean(busy)}>
              <ShieldX aria-hidden="true" />
              {busy ? 'Revogando…' : 'Revogar vínculo'}
            </button>
          </>
        ) : (
          <>
            <button type="button" className="btn btn-danger-outline" onClick={() => void submitReview('REJECTED')} disabled={Boolean(busy)}>
              <X aria-hidden="true" />
              {busy === 'REJECTED' ? 'Recusando…' : 'Recusar'}
            </button>
            <button type="button" className="btn btn-primary" onClick={() => void submitReview('APPROVED')} disabled={Boolean(busy)}>
              <Check aria-hidden="true" />
              {busy === 'APPROVED' ? 'Aprovando…' : 'Aprovar vínculo'}
            </button>
          </>
        )}
      >
        {action?.type === 'review' && (
          <div className="space-y-5">
            <DefinitionList
              items={[
                ['Solicitante', action.request.guardian.name],
                ['Parentesco declarado', action.request.relationship],
                ['Estudante', action.request.student.name],
                ['Matrícula', <span className="tabular">{action.request.student.enrollment}</span>],
                ['Recebida em', formatDateTime(action.request.submittedAt)],
              ]}
            />
            <Callout tone="warning">Confira a documentação do responsável na secretaria antes de aprovar. A aprovação libera presença, histórico e avisos do estudante.</Callout>
            <Field label="Orientação ao responsável" htmlFor="link-review-note" hint="Opcional. Exibida ao responsável quando a solicitação é recusada.">
              <textarea id="link-review-note" className="textarea" rows={3} maxLength={500} value={note} onChange={(event) => setNote(event.target.value)} />
            </Field>
          </div>
        )}
        {action?.type === 'revoke' && (
          <div className="space-y-5">
            <Callout tone="negative">O acesso aos dados do estudante será bloqueado imediatamente pelo backend.</Callout>
            <Field label="Motivo obrigatório" htmlFor="link-revoke-reason" hint="Ao menos 5 caracteres. Fica registrado na auditoria.">
              <textarea id="link-revoke-reason" className="textarea" rows={3} maxLength={500} value={note} onChange={(event) => setNote(event.target.value)} />
            </Field>
          </div>
        )}
        {operationError && <Callout tone="negative" role="alert" className="mt-4">{operationError}</Callout>}
      </Modal>
    </>
  );
};
