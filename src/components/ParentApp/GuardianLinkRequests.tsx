import React, { useState } from 'react';
import { Clock, Link2, Send, ShieldCheck, XCircle } from 'lucide-react';
import {
  GUARDIAN_RELATIONSHIPS,
  GuardianLinkRequestRecord,
  GuardianRelationship,
} from '../../../shared/contracts/linkRequests';

interface GuardianLinkRequestsProps {
  requests: GuardianLinkRequestRecord[];
  state: 'loading' | 'persistent' | 'unavailable';
  error?: string;
  isOnline: boolean;
  onCreate: (enrollment: string, relationship: GuardianRelationship) => Promise<void>;
}

const status = {
  PENDING: { label: 'Em análise', icon: Clock, style: 'bg-amber-100 text-amber-900' },
  APPROVED: { label: 'Aprovado', icon: ShieldCheck, style: 'bg-emerald-100 text-emerald-900' },
  REJECTED: { label: 'Não aprovado', icon: XCircle, style: 'bg-rose-100 text-rose-900' },
} as const;

export const GuardianLinkRequests: React.FC<GuardianLinkRequestsProps> = ({
  requests,
  state,
  error,
  isOnline,
  onCreate,
}) => {
  const [enrollment, setEnrollment] = useState('');
  const [relationship, setRelationship] = useState<GuardianRelationship>('Responsável');
  const [submitting, setSubmitting] = useState(false);
  const [operationError, setOperationError] = useState<string>();

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setOperationError(undefined);
    try {
      await onCreate(enrollment.trim(), relationship);
      setEnrollment('');
    } catch (caught) {
      setOperationError(caught instanceof Error ? caught.message : 'Não foi possível solicitar o vínculo.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section data-testid="guardian-link-requests" className="guardian-link-requests rounded-2xl border border-slate-200 bg-white p-4 text-slate-900 shadow-sm space-y-4 sm:p-5">
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-blue-100 p-2 text-blue-700"><Link2 className="h-5 w-5" /></div>
        <div>
          <h2 className="text-sm font-bold">Solicitar vínculo com estudante</h2>
          <p className="mt-1 text-xs text-slate-600">
            Informe a matrícula. O acesso só será liberado após conferência e aprovação pela escola.
          </p>
        </div>
      </div>

      <form data-testid="guardian-link-request-form" onSubmit={submit} className="guardian-link-request-form grid gap-3">
        <input
          value={enrollment}
          onChange={(event) => setEnrollment(event.target.value)}
          placeholder="Matrícula, ex.: 2024-0182"
          minLength={4}
          maxLength={40}
          required
          className="rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-none"
        />
        <select
          value={relationship}
          onChange={(event) => setRelationship(event.target.value as GuardianRelationship)}
          className="rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-none"
        >
          {GUARDIAN_RELATIONSHIPS.map((item) => <option key={item}>{item}</option>)}
        </select>
        <button
          type="submit"
          disabled={!isOnline || submitting}
          className="guardian-link-request-submit flex min-w-0 items-center justify-center gap-1.5 rounded-xl bg-blue-700 px-4 py-2 text-xs font-bold text-white disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          <Send className="h-3.5 w-3.5" /> {submitting ? 'Enviando…' : 'Solicitar'}
        </button>
      </form>

      {(operationError || (state === 'unavailable' && error)) && (
        <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
          {operationError || error}
        </p>
      )}

      <div className="space-y-2 border-t border-slate-100 pt-3">
        <h3 className="text-xs font-bold text-slate-700">Solicitações desta conta</h3>
        {state === 'loading' && <p className="text-xs text-slate-500">Carregando solicitações…</p>}
        {state !== 'loading' && requests.length === 0 && (
          <p className="text-xs text-slate-500">Nenhuma solicitação registrada.</p>
        )}
        {requests.map((request) => {
          const presentation = status[request.status];
          const StatusIcon = presentation.icon;
          return (
            <div key={request.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="min-w-0">
                <p className="truncate text-xs font-bold">{request.student.name}</p>
                <p className="text-[11px] text-slate-500">Matrícula {request.student.enrollment} · {request.relationship}</p>
                {request.reviewNote && <p className="mt-1 text-[11px] text-slate-600">Observação: {request.reviewNote}</p>}
              </div>
              <span className={`flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold ${presentation.style}`}>
                <StatusIcon className="h-3 w-3" /> {presentation.label}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
};
