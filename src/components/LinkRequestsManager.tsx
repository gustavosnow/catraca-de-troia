import React, { useState } from 'react';
import { Check, Link2, X } from 'lucide-react';
import type { GuardianLinkRequestRecord, LinkReviewStatus } from '../../shared/contracts/linkRequests';

interface LinkRequestsManagerProps {
  requests: GuardianLinkRequestRecord[];
  state: 'loading' | 'persistent' | 'unavailable';
  error?: string;
  canReview: boolean;
  onReview: (request: GuardianLinkRequestRecord, status: LinkReviewStatus, note?: string) => Promise<void>;
}

export const LinkRequestsManager: React.FC<LinkRequestsManagerProps> = ({
  requests,
  state,
  error,
  canReview,
  onReview,
}) => {
  const [busyId, setBusyId] = useState<string>();
  const [operationError, setOperationError] = useState<string>();
  const pending = requests.filter((request) => request.status === 'PENDING');

  const review = async (request: GuardianLinkRequestRecord, status: LinkReviewStatus) => {
    const note = status === 'REJECTED'
      ? window.prompt('Informe uma orientação curta para o responsável (opcional):') || undefined
      : undefined;
    setBusyId(request.id);
    setOperationError(undefined);
    try {
      await onReview(request, status, note);
    } catch (caught) {
      setOperationError(caught instanceof Error ? caught.message : 'Não foi possível analisar a solicitação.');
    } finally {
      setBusyId(undefined);
    }
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
                  onClick={() => void review(request, 'REJECTED')}
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
    </section>
  );
};
