import React, { useState } from 'react';
import { Clock3, Link2, Send, ShieldCheck, XCircle } from 'lucide-react';
import {
  GUARDIAN_RELATIONSHIPS,
  GuardianLinkRequestRecord,
  GuardianRelationship,
} from '../../../shared/contracts/linkRequests';
import { Avatar, Callout, Chip } from '../ui';

interface GuardianLinkRequestsProps {
  requests: GuardianLinkRequestRecord[];
  state: 'loading' | 'persistent' | 'unavailable';
  error?: string;
  isOnline: boolean;
  onCreate: (enrollment: string, relationship: GuardianRelationship) => Promise<void>;
}

const STATUS = {
  PENDING: { label: 'Em análise', icon: Clock3, tone: 'warning' },
  APPROVED: { label: 'Aprovado', icon: ShieldCheck, tone: 'positive' },
  REJECTED: { label: 'Não aprovado', icon: XCircle, tone: 'negative' },
} as const;

export const GuardianLinkRequests: React.FC<GuardianLinkRequestsProps> = ({ requests, state, error, isOnline, onCreate }) => {
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
    <section data-testid="guardian-link-requests" className="guardian-link-requests card p-4 sm:p-6" aria-labelledby="link-requests-title">
      <div className="flex items-start gap-3">
        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-brand-soft text-action">
          <Link2 aria-hidden="true" className="h-5 w-5" />
        </span>
        <div>
          <h2 id="link-requests-title" className="card-title">Solicitar vínculo com estudante</h2>
          <p className="card-subtitle">Informe a matrícula. O acesso só é liberado após conferência e aprovação pela escola.</p>
        </div>
      </div>

      <form data-testid="guardian-link-request-form" onSubmit={submit} className="guardian-link-request-form mt-5 grid gap-3">
        <div className="min-w-0">
          <label htmlFor="link-enrollment" className="field-label">Matrícula</label>
          <input
            id="link-enrollment"
            className="input tabular"
            value={enrollment}
            onChange={(event) => setEnrollment(event.target.value)}
            placeholder="Ex.: 2024-0182"
            minLength={4}
            maxLength={40}
            required
          />
        </div>
        <div className="min-w-0">
          <label htmlFor="link-relationship" className="field-label">Parentesco</label>
          <select id="link-relationship" className="select" value={relationship} onChange={(event) => setRelationship(event.target.value as GuardianRelationship)}>
            {GUARDIAN_RELATIONSHIPS.map((item) => <option key={item}>{item}</option>)}
          </select>
        </div>
        <button type="submit" className="guardian-link-request-submit btn btn-primary self-end" disabled={!isOnline || submitting}>
          <Send aria-hidden="true" />
          {submitting ? 'Enviando…' : 'Solicitar'}
        </button>
      </form>

      {(operationError || (state === 'unavailable' && error)) && (
        <Callout tone="negative" role="alert" className="mt-4">{operationError || error}</Callout>
      )}

      <div className="mt-6 border-t border-line pt-5">
        <h3 className="text-[13px] font-semibold text-ink">Solicitações desta conta</h3>
        {state === 'loading' && requests.length === 0 && <p className="mt-3 text-[13px] text-muted">Carregando solicitações…</p>}
        {state !== 'loading' && requests.length === 0 && <p className="mt-3 text-[13px] text-muted">Nenhuma solicitação registrada.</p>}
        {requests.length > 0 && (
          <ul className="mt-3 divide-y divide-line rounded-[10px] border border-line">
            {requests.map((request) => {
              const status = STATUS[request.status];
              return (
                <li key={request.id} className="px-3 py-3 sm:px-4">
                  <div className="flex flex-wrap items-start gap-x-4 gap-y-2">
                    <div className="flex min-w-0 grow basis-52 items-start gap-2.5">
                      <Avatar name={request.student.name} size="sm" />
                      <div className="min-w-0 wrap-anywhere">
                        <p className="text-sm font-medium text-ink">{request.student.name}</p>
                        <p className="tabular mt-0.5 text-xs text-muted">Matrícula {request.student.enrollment} · {request.relationship}</p>
                      </div>
                    </div>
                    <Chip tone={status.tone} icon={status.icon}>{status.label}</Chip>
                  </div>
                  {request.reviewNote && (
                    <p className="mt-3 border-t border-line pt-2 text-[13px] leading-relaxed wrap-anywhere text-ink-2">
                      <span className="font-medium">Observação da escola:</span> {request.reviewNote}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
};
