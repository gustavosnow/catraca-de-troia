import React, { useMemo, useState } from 'react';
import { History, RefreshCw } from 'lucide-react';
import type { AuditLogRecord } from '../../shared/contracts/audit';
import { EmptyInboxIllustration } from './brand/Illustrations';
import { Avatar, Callout, EmptyState, PageHeader, SkeletonRows } from './ui';

interface AuditLogPanelProps {
  records: AuditLogRecord[];
  state: 'loading' | 'persistent' | 'unavailable';
  error?: string;
  onRefresh: () => void;
}

const TYPE_LABELS: Record<string, string> = {
  ACCESS_EVENT: 'Evento de acesso',
  ATTACHMENT: 'Anexo legado',
  AUTH_SESSION: 'Sessão',
  GUARDIAN_LINK_REQUEST: 'Solicitação de vínculo',
  GUARDIAN_STUDENT_LINK: 'Vínculo familiar',
  JUSTIFICATION: 'Justificativa',
  SCHOOL_NOTICE: 'Comunicado',
  USER_ACCOUNT: 'Conta local',
  NOTIFICATION_DELIVERY: 'Entrega demonstrativa',
};

const ACTION_LABELS: Record<string, string> = {
  CREATED: 'Criação',
  UPDATED: 'Edição',
  DELETED: 'Exclusão',
  APPROVED: 'Aprovação',
  REJECTED: 'Recusa',
  REVIEWED: 'Análise',
  REVOKED: 'Revogação',
  BLOCKED: 'Bloqueio',
  ACTIVATED: 'Desbloqueio',
  DELIVERED: 'Entrega simulada',
  FAILED: 'Falha simulada',
  SESSION_CREATED: 'Início de sessão',
  SESSION_REVOKED: 'Fim de sessão',
  SESSIONS_REVOKED_REMOTELY: 'Sessões encerradas',
  SYNC_RECEIVED: 'Sincronização recebida',
  SYNC_CONFLICT: 'Conflito de sincronização',
};

export const AuditLogPanel: React.FC<AuditLogPanelProps> = ({ records, state, error, onRefresh }) => {
  const [type, setType] = useState('todos');
  const types = useMemo(() => [...new Set(records.map((record) => record.aggregateType))].sort(), [records]);
  const filtered = type === 'todos' ? records : records.filter((record) => record.aggregateType === type);

  return (
    <>
      <PageHeader
        eyebrow="Administração"
        title="Auditoria"
        description="Metadados das ações registradas no servidor local. Conteúdos sensíveis não são exibidos."
        actions={
          <button type="button" className="btn btn-secondary" onClick={onRefresh} disabled={state === 'loading'}>
            <RefreshCw aria-hidden="true" className={state === 'loading' ? 'animate-spin' : undefined} />
            Atualizar
          </button>
        }
      />

      <section className="card overflow-hidden" aria-labelledby="audit-title">
        <div className="card-header flex-col sm:flex-row sm:items-center">
          <div>
            <h2 id="audit-title" className="card-title">
              Trilha de auditoria <span className="font-normal text-muted">/ {filtered.length}</span>
            </h2>
            <p className="card-subtitle">Quem fez, sobre qual recurso e quando.</p>
          </div>
          <div className="w-full sm:w-60">
            <label htmlFor="audit-type" className="sr-only">Recurso</label>
            <select id="audit-type" className="select" value={type} onChange={(event) => setType(event.target.value)}>
              <option value="todos">Todos os recursos</option>
              {types.map((item) => <option key={item} value={item}>{TYPE_LABELS[item] ?? item}</option>)}
            </select>
          </div>
        </div>

        {state === 'unavailable' && (
          <div className="px-6 pb-4"><Callout tone="negative" role="alert">{error || 'Auditoria indisponível.'}</Callout></div>
        )}

        {state === 'loading' && records.length === 0 ? (
          <SkeletonRows rows={5} />
        ) : filtered.length === 0 ? (
          <EmptyState illustration={<EmptyInboxIllustration className="mb-4 h-20" />} title="Nenhuma ação auditada" icon={History} />
        ) : (
          <div className="table-scroll">
            <table className="data-table min-w-[760px]">
              <caption className="sr-only">Trilha de auditoria</caption>
              <thead>
                <tr>
                  <th scope="col" className="pl-6">Quando</th>
                  <th scope="col">Responsável pela ação</th>
                  <th scope="col">Recurso</th>
                  <th scope="col">Ação</th>
                  <th scope="col" className="pr-6">Referência</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((record) => {
                  const date = new Date(record.occurredAt);
                  return (
                    <tr key={record.id}>
                      <td className="num whitespace-nowrap pl-6">
                        <p className="font-medium">{date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</p>
                        <p className="cell-secondary">{date.toLocaleDateString('pt-BR')}</p>
                      </td>
                      <td>
                        <div className="flex items-center gap-2.5">
                          <Avatar name={record.actor.name} size="sm" />
                          <span className="font-medium">{record.actor.name}</span>
                        </div>
                      </td>
                      <td>{TYPE_LABELS[record.aggregateType] ?? record.aggregateType}</td>
                      <td>
                        <span className="font-medium">{ACTION_LABELS[record.action] ?? record.action}</span>
                        {ACTION_LABELS[record.action] && <p className="cell-secondary font-mono text-[11px]">{record.action}</p>}
                      </td>
                      <td className="pr-6">
                        <span className="block max-w-[220px] truncate font-mono text-xs text-muted" title={record.aggregateId}>{record.aggregateId}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <div className="table-footer">
          <span>Registros imutáveis gravados pelo servidor da escola</span>
        </div>
      </section>
    </>
  );
};
