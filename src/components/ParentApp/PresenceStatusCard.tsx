import React from 'react';
import { ArrowRight, CheckCircle2, Clock3, LogIn, LogOut, School } from 'lucide-react';
import type { AccessLog, DayTimelineEvent } from '../../types';
import { DEMO_ACCESS_LABEL } from '../../services/accessHistory';
import { firstNameOf } from '../ui';

const turnstileLabel = (name?: string) => name?.split(' (')[0] ?? '';

const dayLabel = (timestamp?: string) => {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' });
};

interface PresenceStatusCardProps {
  studentName: string;
  latestAccess?: AccessLog;
}

/** Estado atual do estudante conforme o último registro — nunca rastreamento em tempo real. */
export const PresenceStatusCard: React.FC<PresenceStatusCardProps> = ({ studentName, latestAccess }) => {
  const firstName = firstNameOf(studentName);
  const isAtSchool = latestAccess?.direction === 'entry';
  const isDemo = latestAccess?.source === 'simulacao';
  const presence = isAtSchool ? `${firstName} está na escola.` : `${firstName} saiu da escola.`;
  const simulatedPresence = `${isAtSchool ? 'Entrada' : 'Saída'} de ${firstName} na demonstração.`;
  const meta = latestAccess
    ? [
        `${latestAccess.direction === 'entry' ? 'Entrada' : 'Saída'} às ${latestAccess.exactTime.slice(0, 5)}`,
        turnstileLabel(latestAccess.turnstileName),
        dayLabel(latestAccess.timestamp),
        isDemo ? DEMO_ACCESS_LABEL : '',
      ].filter(Boolean).join(' · ')
    : 'Nenhuma passagem registrada hoje.';

  return (
    <section
      id="card-current-presence"
      aria-live="polite"
      className={`rounded-[14px] border p-6 sm:p-7 ${isAtSchool ? 'border-positive-line bg-positive-soft' : 'border-line bg-white'}`}
    >
      <div className="flex items-start justify-between gap-3">
        <span className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ${isAtSchool ? 'bg-white/70 text-positive' : 'bg-surface text-ink-2'}`}>
          <School aria-hidden="true" className="h-6 w-6" />
        </span>
        {latestAccess ? (
          <span className={`chip ${isAtSchool ? 'chip-positive bg-white/70' : 'chip-neutral'}`}>
            {isAtSchool ? <CheckCircle2 aria-hidden="true" /> : <LogOut aria-hidden="true" />}
            {isAtSchool ? 'Entrada registrada' : 'Saída registrada'}
          </span>
        ) : (
          <span className="chip chip-neutral"><Clock3 aria-hidden="true" />Sem registro</span>
        )}
      </div>
      <h2 className={`mt-6 text-[26px] font-bold leading-tight tracking-tight sm:text-[28px] ${isAtSchool ? 'text-[#124d34]' : 'text-ink'}`}>
        {latestAccess ? (isDemo ? simulatedPresence : presence) : `Sem passagens de ${firstName}.`}
      </h2>
      <p className={`tabular mt-2 text-sm ${isAtSchool ? 'text-[#2c6b4c]' : 'text-muted'}`}>{meta}</p>
      <p className={`mt-5 border-t pt-4 text-[13px] ${isAtSchool ? 'border-positive-line text-[#2c6b4c]' : 'border-line text-muted'}`}>
        Conforme a última passagem de hoje. Não é rastreamento em tempo real.
      </p>
    </section>
  );
};

interface TodayMovementsProps {
  timeline: DayTimelineEvent[];
  isAtSchool: boolean;
  onOpenHistory: () => void;
}

export const TodayMovements: React.FC<TodayMovementsProps> = ({ timeline, isAtSchool, onOpenHistory }) => {
  const hasExit = timeline.some((event) => event.badgeType === 'exit');
  const items = [...timeline];

  return (
    <section className="card p-6" aria-labelledby="today-movements-title">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <h2 id="today-movements-title" className="card-title min-w-0 grow basis-44">Movimentações registradas</h2>
        <button type="button" className="btn-link" onClick={onOpenHistory}>
          <ArrowRight aria-hidden="true" />
          Histórico
        </button>
      </div>

      {items.length === 0 ? (
        <p className="mt-5 rounded-[10px] bg-surface px-4 py-5 text-center text-[13px] text-muted">
          Nenhuma entrada ou saída registrada hoje.
        </p>
      ) : (
        <ol className="relative mt-5 space-y-5 before:absolute before:bottom-3 before:left-[15px] before:top-3 before:w-px before:bg-line">
          {items.map((event) => {
            const isEntry = event.badgeType !== 'exit';
            const Icon = isEntry ? LogIn : LogOut;
            return (
              <li key={event.id} className="relative flex gap-3.5">
                <span className={`relative z-10 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full ring-4 ring-white ${isEntry ? 'bg-positive-soft text-positive' : 'bg-surface-2 text-ink-2'}`}>
                  <Icon aria-hidden="true" className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1 pt-0.5">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="text-sm font-semibold text-ink">{event.title}</p>
                    <span className="tabular text-sm font-medium text-ink">{event.time.slice(0, 5)}</span>
                  </div>
                  <p className="mt-0.5 text-[13px] text-muted">{turnstileLabel(event.location)} · {event.detail}</p>
                </div>
              </li>
            );
          })}
          {isAtSchool && !hasExit && (
            <li className="relative flex gap-3.5">
              <span className="relative z-10 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface text-subtle ring-4 ring-white">
                <LogOut aria-hidden="true" className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1 pt-0.5">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-sm font-semibold text-muted">Nenhuma saída registrada</p>
                  <span aria-hidden="true" className="text-sm text-subtle">—</span>
                </div>
                <p className="mt-0.5 text-[13px] text-muted">Aguardando um novo registro.</p>
              </div>
            </li>
          )}
        </ol>
      )}
    </section>
  );
};
