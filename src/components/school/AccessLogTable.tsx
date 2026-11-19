import React from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FlaskConical,
  Hand,
  ScanFace,
  ShieldCheck,
  Smartphone,
} from 'lucide-react';
import type { AccessLog } from '../../types';
import { DEMO_ACCESS_LABEL } from '../../services/accessHistory';
import { Avatar, Chip } from '../ui';

export const splitTurnstile = (name: string) => {
  const code = name.match(/(\d{2})/)?.[1] ?? '—';
  const place = name.match(/\(([^)]+)\)/)?.[1] ?? name.split(' - ')[1] ?? '';
  return { code, place };
};

export const formatEventDate = (timestamp: string) => {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).replace('.', '');
};

export const DirectionChip: React.FC<{ direction: AccessLog['direction'] }> = ({ direction }) =>
  direction === 'entry'
    ? <Chip tone="positive" icon={ArrowDownLeft}>Entrada</Chip>
    : <Chip tone="neutral" icon={ArrowUpRight}>Saída</Chip>;

/**
 * Origem do registro, com o mesmo rótulo na tabela, na ficha do estudante e no CSV:
 * passagem assistida pela portaria, protótipo facial (MC-036) ou evento simulado.
 */
export const accessOriginLabel = (log: AccessLog) => {
  if (log.source === 'simulacao') return DEMO_ACCESS_LABEL;
  if (log.method === 'Manual') return 'Assistida';
  return log.source === 'camera' ? 'Protótipo facial' : 'Simulada';
};

export const MethodChip: React.FC<{ log: AccessLog }> = ({ log }) => {
  if (log.source === 'simulacao') {
    return <Chip tone="neutral" icon={FlaskConical}>{DEMO_ACCESS_LABEL}</Chip>;
  }
  if (log.method === 'Manual') {
    return <Chip tone="info" icon={Hand} title="Passagem assistida registrada pela portaria">Assistida</Chip>;
  }
  if (log.source === 'camera') {
    const detail = log.recognition
      ? `Protótipo facial: similaridade ${log.recognition.matchScore.toFixed(3)}, inferência ${Math.round(log.recognition.inferenceMs)} ms (${log.recognition.deviceId})`
      : 'Protótipo facial de laboratório — sem homologação';
    return <Chip tone="brand" icon={ScanFace} title={detail}>Protótipo facial</Chip>;
  }
  return <Chip tone="neutral" icon={FlaskConical} title="Evento simulado — nenhum reconhecimento facial real">Simulada</Chip>;
};

export const StatusChip: React.FC<{ log: AccessLog }> = ({ log }) => {
  if (log.status === 'Tolerância') return <Chip tone="warning" icon={Clock3}>Tolerância</Chip>;
  if (log.status === 'LiberacaoManual') return <Chip tone="info" icon={ShieldCheck} title={log.reason}>Liberação assistida</Chip>;
  if (log.status === 'Bloqueado') return <Chip tone="negative" icon={ShieldCheck}>Bloqueado</Chip>;
  return <Chip tone="positive" icon={CheckCircle2}>Autorizado</Chip>;
};

interface AccessLogTableProps {
  logs: AccessLog[];
  onSelectStudent: (studentId: string) => void;
  variant?: 'compact' | 'full';
  caption: string;
}

export const AccessLogTable: React.FC<AccessLogTableProps> = ({ logs, onSelectStudent, variant = 'compact', caption }) => {
  const full = variant === 'full';
  return (
    <div className="table-scroll">
      <table className={`data-table ${full ? 'min-w-[920px]' : 'min-w-[640px]'}`}>
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr>
            <th scope="col" className="pl-6">Estudante</th>
            <th scope="col">Horário</th>
            <th scope="col">Movimento</th>
            <th scope="col">Catraca</th>
            {full && <th scope="col">Origem</th>}
            {full && <th scope="col">Situação</th>}
            {full && <th scope="col">Notificação</th>}
            <th scope="col" className="w-14 pr-6 text-right"><span className="sr-only">Detalhes</span></th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => {
            const turnstile = splitTurnstile(log.turnstileName);
            return (
              <tr key={log.id} className={log.isNew ? 'is-new' : undefined}>
                <td className="pl-6">
                  <div className="flex items-center gap-3">
                    <Avatar name={log.studentName} />
                    <div className="min-w-0">
                      <p className="cell-primary truncate">{log.studentName}</p>
                      <p className="cell-secondary num">
                        {log.matricula}
                        {full && <span className="hidden xl:inline"> · {log.turma.split(' - ')[0]}</span>}
                      </p>
                      {!full && log.source === 'simulacao' && <p className="cell-secondary">{DEMO_ACCESS_LABEL}</p>}
                    </div>
                  </div>
                </td>
                <td className="num whitespace-nowrap">
                  <p className="font-medium">{log.exactTime}</p>
                  <p className="cell-secondary">{formatEventDate(log.timestamp)}</p>
                </td>
                <td><DirectionChip direction={log.direction} /></td>
                <td className="whitespace-nowrap">
                  <p className="num font-medium">{turnstile.code}</p>
                  <p className="cell-secondary">{turnstile.place}</p>
                </td>
                {full && <td><MethodChip log={log} /></td>}
                {full && <td><StatusChip log={log} /></td>}
                {full && (
                  <td className="whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5 text-[13px] text-ink-2">
                      <Smartphone aria-hidden="true" className="h-3.5 w-3.5 text-muted" />
                      {log.notification.pushApp === 'Lido' ? 'Lida' : log.notification.pushApp === 'Falha' ? 'Falhou' : log.notification.pushApp === 'Pendente' ? 'Pendente' : 'Gerada'}
                    </span>
                  </td>
                )}
                <td className="pr-6 text-right">
                  <button
                    type="button"
                    className="icon-btn"
                    onClick={() => onSelectStudent(log.studentId)}
                    aria-label={`Ver ficha de ${log.studentName}, registro das ${log.exactTime}`}
                  >
                    <ChevronRight />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
