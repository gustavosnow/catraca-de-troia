import React from 'react';
import { AlertCircle, CheckCircle2, CircleDashed, Clock3, FileText, Info, LogIn, LogOut, Timer } from 'lucide-react';
import type { WeeklyAccessDay } from '../../types';
import { DEMO_ACCESS_LABEL } from '../../services/accessHistory';
import { Chip } from '../ui';

interface WeeklyAccessHistoryProps {
  days: WeeklyAccessDay[];
  studentName: string;
}

export const DayStatusChip: React.FC<{ status: WeeklyAccessDay['status'] }> = ({ status }) => {
  switch (status) {
    case 'presente': return <Chip tone="positive" icon={CheckCircle2}>Presente</Chip>;
    case 'em_andamento': return <Chip tone="brand" icon={Timer}>Em andamento</Chip>;
    case 'atraso_tolerado': return <Chip tone="warning" icon={Clock3}>Atraso tolerado</Chip>;
    case 'ausente_justificado': return <Chip tone="info" icon={FileText}>Falta justificada</Chip>;
    case 'ausente': return <Chip tone="negative" icon={AlertCircle}>Ausente</Chip>;
    default: return <Chip tone="neutral" icon={CircleDashed}>Sem registro</Chip>;
  }
};

const place = (value: string) => value.split(' (')[0];

/** "segunda-feira, 16 de novembro de 2026" → ["Segunda-feira", "16 de novembro de 2026"] */
const splitDate = (fullDate: string) => {
  const [weekday, ...rest] = fullDate.split(', ');
  return [weekday.charAt(0).toUpperCase() + weekday.slice(1), rest.join(', ')];
};

export const WeeklyAccessHistory: React.FC<WeeklyAccessHistoryProps> = ({ days, studentName }) => (
  <section aria-labelledby="weekly-history-title">
    <div className="mb-5">
      <h2 id="weekly-history-title" className="text-xl font-semibold tracking-tight text-ink">Histórico da semana</h2>
      <p className="mt-1 text-sm text-muted">Entradas e saídas de {studentName} nos últimos cinco dias úteis.</p>
    </div>

    {/* Desktop: tabela */}
    <div className="card hidden overflow-hidden md:block">
      <div className="table-scroll">
        <table className="data-table">
          <caption className="sr-only">Histórico de acessos da semana de {studentName}</caption>
          <thead>
            <tr>
              <th scope="col" className="pl-6">Dia</th>
              <th scope="col">Entrada</th>
              <th scope="col">Saída</th>
              <th scope="col">Permanência</th>
              <th scope="col">Catraca</th>
              <th scope="col" className="pr-6">Situação</th>
            </tr>
          </thead>
          <tbody>
            {days.map((day) => {
              const isToday = day.dayName.startsWith('Hoje');
              return (
                <tr key={day.fullDate} className={isToday ? 'is-new' : undefined}>
                  <td className="pl-6">
                    <p className="cell-primary">{isToday ? 'Hoje' : splitDate(day.fullDate)[0]}</p>
                    <p className="cell-secondary num">{splitDate(day.fullDate)[1]}</p>
                    {day.hasDemoRecords && <p className="cell-secondary">{DEMO_ACCESS_LABEL}</p>}
                  </td>
                  <td className="num font-medium">{day.entryTime?.slice(0, 5) ?? '—'}</td>
                  <td className="num font-medium">{day.exitTime?.slice(0, 5) ?? '—'}</td>
                  <td className="max-w-[220px] text-[13px] text-ink-2">{day.durationHours}</td>
                  <td className="text-[13px] text-ink-2">{day.method === '-' ? '—' : place(day.turnstileUsed)}</td>
                  <td className="pr-6"><DayStatusChip status={day.status} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>

    {/* Mobile: lista */}
    <ul className="card divide-y divide-line md:hidden">
      {days.map((day) => {
        const isToday = day.dayName.startsWith('Hoje');
        return (
          <li key={day.fullDate} className="px-4 py-4">
            <div className="flex flex-wrap items-start gap-x-3 gap-y-2">
              <div className="min-w-0 grow basis-36">
                <p className="text-sm font-semibold text-ink">{isToday ? 'Hoje' : splitDate(day.fullDate)[0]}</p>
                <p className="tabular text-xs text-muted">{splitDate(day.fullDate)[1]}</p>
                {day.hasDemoRecords && <p className="mt-1 text-xs text-muted">{DEMO_ACCESS_LABEL}</p>}
              </div>
              <DayStatusChip status={day.status} />
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-3 rounded-[10px] bg-surface px-3 py-2.5">
              <div className="flex items-center gap-2">
                <LogIn aria-hidden="true" className="h-4 w-4 text-muted" />
                <div>
                  <dt className="text-xs text-muted">Entrada</dt>
                  <dd className="tabular text-sm font-semibold text-ink">{day.entryTime?.slice(0, 5) ?? '—'}</dd>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <LogOut aria-hidden="true" className="h-4 w-4 text-muted" />
                <div>
                  <dt className="text-xs text-muted">Saída</dt>
                  <dd className="tabular text-sm font-semibold text-ink">{day.exitTime?.slice(0, 5) ?? '—'}</dd>
                </div>
              </div>
            </dl>
            <p className="mt-2 text-xs text-muted">{day.durationHours}</p>
          </li>
        );
      })}
    </ul>

    <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-muted">
      <Info aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
      O portal consulta o mesmo servidor do painel escolar. Ele não registra alterações offline; a fila do servidor da escola é que preserva os registros.
    </p>
  </section>
);
