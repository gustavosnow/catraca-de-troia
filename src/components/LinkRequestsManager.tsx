import React, { useState } from 'react';
import { Check, Link2, ShieldX, X } from 'lucide-react';
import type {
  GuardianLinkRequestRecord,
  GuardianStudentLinkRecord,
  LinkReviewStatus,
} from '../../shared/contracts/linkRequests';

interface LinkRequestsManagerProps {
  requests: GuardianLinkRequestRecord[];
  links: GuardianStudentLinkRecord[];
  state: 'loading' | 'persistent' | 'unavailable';
  error?: string;
  canReview: boolean;
  onReview: (request: GuardianLinkRequestRecord, status: LinkReviewStatus, note?: string) => Promise<void>;
  onRevoke: (link: GuardianStudentLinkRecord, reason: string) => Promise<void>;
}

export const LinkRequestsManager: React.FC<LinkRequestsManagerProps> = ({
  requests,
  links,
  state,
  error,
  canReview,
  onReview,
  onRevoke,
}) => {
  const [busyId, setBusyId] = useState<string>();
  const [operationError, setOperationError] = useState<string>();
  const [pendingAction, setPendingAction] = useState<
    | { type: 'reject'; request: GuardianLinkRequestRecord }
    | { type: 'revoke'; link: GuardianStudentLinkRecord }
  >();
  const [actionReason, setActionReason] = useState('');
  const pending = requests.filter((request) => request.status === 'PENDING');
  const approved = links.filter((link) => link.status === 'APPROVED');

  const review = async (request: GuardianLinkRequestRecord, status: LinkReviewStatus, note?: string) => {
    setBusyId(request.id);
    setOperationError(undefined);
    try {
      await onReview(request, status, note);
      return true;
    } catch (caught) {
      setOperationError(caught instanceof Error ? caught.message : 'Não foi possível analisar a solicitação.');
      return false;
    } finally {
      setBusyId(undefined);
    }
  };

  const revoke = async (link: GuardianStudentLinkRecord, reason: string) => {
    setBusyId(`${link.guardian.id}:${link.student.id}`);
    setOperationError(undefined);
    try {
      await onRevoke(link, reason);
      return true;
    } catch (caught) {
      setOperationError(caught instanceof Error ? caught.message : 'Não foi possível revogar o vínculo.');
      return false;
    } finally {
      setBusyId(undefined);
    }
  };

  const submitPendingAction = async () => {
    if (!pendingAction) return;
    const reason = actionReason.trim();
    if (pendingAction.type === 'revoke' && reason.length < 5) {
      setOperationError('Informe um motivo com pelo menos 5 caracteres.');
      return;
    }
    const succeeded = pendingAction.type === 'reject'
      ? await review(pendingAction.request, 'REJECTED', reason || undefined)
      : await revoke(pendingAction.link, reason);
    if (!succeeded) return;
    setPendingAction(undefined);
    setActionReason('');
  };

  return (
    <section className="mb-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Link2 className="h-5 w-5 text-blue-700" />
          <div>
            <h2 className="text-sm font-bold text-slate-900">Solicitações de vínculo</h2>
            <p className="text-[11px] text-slate-500">A aprovação libera os dados do estudante para a conta solicitante.</p>
          </div>
        </div>
        <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-900">{pending.length} pendente(s)</span>
      </div>

      {(operationError || (state === 'unavailable' && error)) && (
        <p role="alert" className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
          {operationError || error}
        </p>
      )}
      {state === 'loading' && <p className="mt-3 text-xs text-slate-500">Carregando solicitações…</p>}
      {state !== 'loading' && pending.length === 0 && (
        <p className="mt-3 rounded-xl bg-slate-50 p-3 text-xs text-slate-500">Nenhuma solicitação pendente.</p>
      )}
      <div className="mt-3 space-y-2">
        {pending.map((request) => (
          <div key={request.id} className="flex flex-col gap-3 rounded-xl border border-slate-200 p-3 sm:flex-row sm:items-center">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-slate-900">{request.guardian.name} · {request.relationship}</p>
              <p className="text-[11px] text-slate-600">{request.student.name} · Matrícula {request.student.enrollment}</p>
            </div>
            {canReview ? (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => { setPendingAction({ type: 'reject', request }); setActionReason(''); setOperationError(undefined); }}
                  disabled={busyId === request.id}
                  className="flex items-center gap-1 rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-bold text-rose-700 disabled:opacity-50"
                ><X className="h-3.5 w-3.5" /> Recusar</button>
                <button
                  type="button"
                  onClick={() => void review(request, 'APPROVED')}
                  disabled={busyId === request.id}
                  className="flex items-center gap-1 rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50"
                ><Check className="h-3.5 w-3.5" /> Aprovar</button>
              </div>
            ) : <span className="text-[11px] text-slate-500">Somente Coordenação/Direção analisa.</span>}
          </div>
        ))}
      </div>

      <div className="mt-5 border-t border-slate-200 pt-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Vínculos ativos</h3>
            <p className="text-[11px] text-slate-500">A revogação bloqueia imediatamente as APIs protegidas.</p>
          </div>
          <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-900">{approved.length} ativo(s)</span>
        </div>
        {approved.length === 0 && <p className="mt-3 rounded-xl bg-slate-50 p-3 text-xs text-slate-500">Nenhum vínculo ativo.</p>}
        <div className="mt-3 space-y-2">
          {approved.map((link) => {
            const key = `${link.guardian.id}:${link.student.id}`;
            return (
              <div key={key} className="flex flex-col gap-3 rounded-xl border border-slate-200 p-3 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-900">{link.guardian.name}</p>
                  <p className="text-[11px] text-slate-600">{link.student.name} · Matrícula {link.student.enrollment}</p>
                </div>
                <button
                  type="button"
                  onClick={() => { setPendingAction({ type: 'revoke', link }); setActionReason(''); setOperationError(undefined); }}
                  disabled={busyId === key}
                  className="flex items-center justify-center gap-1 rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-bold text-rose-700 disabled:opacity-50"
                ><ShieldX className="h-3.5 w-3.5" /> Revogar</button>
              </div>
            );
          })}
        </div>
      </div>

      {pendingAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4" role="dialog" aria-modal="true" aria-labelledby="link-action-title" onMouseDown={(event) => { if (event.target === event.currentTarget) setPendingAction(undefined); }}>
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 id="link-action-title" className="font-bold text-slate-900">{pendingAction.type === 'reject' ? 'Recusar solicitação' : 'Revogar vínculo'}</h3>
                <p className="mt-1 text-xs text-slate-500">{pendingAction.type === 'reject'
                  ? `${pendingAction.request.guardian.name} · ${pendingAction.request.student.name}`
                  : `${pendingAction.link.guardian.name} · ${pendingAction.link.student.name}`}</p>
              </div>
              <button type="button" onClick={() => setPendingAction(undefined)} aria-label="Fechar" className="rounded-lg p-1 text-slate-500 hover:bg-slate-100"><X className="h-4 w-4" /></button>
            </div>
            <p className="mt-3 rounded-xl bg-amber-50 p-3 text-xs text-amber-900">{pendingAction.type === 'reject'
              ? 'A orientação será exibida ao responsável na solicitação.'
              : 'O acesso aos dados do estudante será bloqueado imediatamente pelo backend.'}</p>
            <label className="mt-3 block text-xs font-bold text-slate-700">{pendingAction.type === 'reject' ? 'Orientação ao responsável (opcional)' : 'Motivo obrigatório'}
              <textarea autoFocus value={actionReason} onChange={(event) => setActionReason(event.target.value)} rows={3} maxLength={500} className="mt-1 w-full rounded-xl border border-slate-200 p-3 text-xs outline-none focus:border-blue-500" />
            </label>
            {operationError && <p role="alert" className="mt-2 text-xs text-rose-700">{operationError}</p>}
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setPendingAction(undefined)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700">Cancelar</button>
              <button type="button" onClick={() => void submitPendingAction()} disabled={Boolean(busyId)} className={`rounded-lg px-3 py-2 text-xs font-bold text-white disabled:opacity-50 ${pendingAction.type === 'reject' ? 'bg-rose-700' : 'bg-slate-900'}`}>{busyId ? 'Salvando…' : 'Confirmar'}</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
