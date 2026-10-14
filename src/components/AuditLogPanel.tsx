import React from 'react';
import { History, RefreshCw } from 'lucide-react';
import type { AuditLogRecord } from '../../shared/contracts/audit';

interface AuditLogPanelProps {
  records: AuditLogRecord[];
  state: 'loading' | 'persistent' | 'unavailable';
  error?: string;
  onRefresh: () => void;
}

const typeLabels: Record<string, string> = {
  ACCESS_EVENT: 'Evento de acesso',
  ATTACHMENT: 'Anexo',
  AUTH_SESSION: 'Sessão',
  GUARDIAN_LINK_REQUEST: 'Solicitação de vínculo',
  GUARDIAN_STUDENT_LINK: 'Vínculo responsável-estudante',
  JUSTIFICATION: 'Justificativa',
  SCHOOL_NOTICE: 'Comunicado',
};

export const AuditLogPanel: React.FC<AuditLogPanelProps> = ({ records, state, error, onRefresh }) => (
  <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <History className="h-5 w-5 text-blue-700" />
        <div>
          <h2 className="text-sm font-bold text-slate-900">Trilha de auditoria</h2>
          <p className="text-[11px] text-slate-500">Metadados das ações locais; conteúdos sensíveis não são exibidos.</p>
        </div>
      </div>
      <button type="button" onClick={onRefresh} className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700">
        <RefreshCw className={`h-3.5 w-3.5 ${state === 'loading' ? 'animate-spin' : ''}`} /> Atualizar
      </button>
    </div>
    {state === 'unavailable' && <p role="alert" className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">{error || 'Auditoria indisponível.'}</p>}
    {state === 'loading' && records.length === 0 && <p className="mt-3 text-xs text-slate-500">Carregando registros…</p>}
    {state !== 'loading' && records.length === 0 && <p className="mt-3 rounded-xl bg-slate-50 p-3 text-xs text-slate-500">Nenhuma ação auditada.</p>}
    <div className="mt-3 overflow-x-auto">
      <table className="w-full min-w-[680px] text-left text-xs">
        <thead className="border-b border-slate-200 text-[11px] uppercase tracking-wide text-slate-500">
          <tr><th className="px-2 py-2">Quando</th><th className="px-2 py-2">Ator</th><th className="px-2 py-2">Recurso</th><th className="px-2 py-2">Ação</th><th className="px-2 py-2">Referência</th></tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {records.map((record) => (
            <tr key={record.id}>
              <td className="whitespace-nowrap px-2 py-2.5 text-slate-600">{new Date(record.occurredAt).toLocaleString('pt-BR')}</td>
              <td className="px-2 py-2.5 font-semibold text-slate-800">{record.actor.name}</td>
              <td className="px-2 py-2.5 text-slate-700">{typeLabels[record.aggregateType] || record.aggregateType}</td>
              <td className="px-2 py-2.5 font-bold text-blue-800">{record.action}</td>
              <td className="max-w-52 truncate px-2 py-2.5 font-mono text-[11px] text-slate-500" title={record.aggregateId}>{record.aggregateId}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </section>
);
