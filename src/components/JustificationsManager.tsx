import React, { useMemo, useState } from 'react';
import { ArrowUpRight, CheckCircle2, Clock3, FileText, Search, ShieldCheck, XCircle } from 'lucide-react';
import type { AbsenceJustification } from '../types';
import { EmptyInboxIllustration } from './brand/Illustrations';
import { Avatar, Callout, Chip, DefinitionList, EmptyState, Modal, PageHeader, SkeletonRows } from './ui';

type ReviewStatus = Extract<AbsenceJustification['status'], 'Aprovado pela Coordenação' | 'Recusado'>;

interface JustificationsManagerProps {
  justifications: AbsenceJustification[];
  onUpdateStatus: (id: string, status: ReviewStatus) => Promise<void>;
  persistenceState: 'loading' | 'persistent' | 'unavailable';
  persistenceError?: string;
  canReview: boolean;
}

type TabFilter = 'Todas' | AbsenceJustification['status'];

const TABS: Array<{ id: TabFilter; label: string }> = [
  { id: 'Todas', label: 'Todas' },
  { id: 'Em Análise', label: 'Em análise' },
  { id: 'Aprovado pela Coordenação', label: 'Aprovadas' },
  { id: 'Recusado', label: 'Recusadas' },
];

export const formatIsoDate = (value?: string) => {
  if (!value) return '';
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : value;
};

export const JustificationStatusChip: React.FC<{ status: AbsenceJustification['status'] }> = ({ status }) => {
  if (status === 'Em Análise') return <Chip tone="warning" icon={Clock3}>Em análise</Chip>;
  if (status === 'Aprovado pela Coordenação') return <Chip tone="positive" icon={CheckCircle2}>Aprovada</Chip>;
  return <Chip tone="negative" icon={XCircle}>Recusada</Chip>;
};

export const JustificationsManager: React.FC<JustificationsManagerProps> = ({
  justifications,
  onUpdateStatus,
  persistenceState,
  persistenceError,
  canReview,
}) => {
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<TabFilter>('Todas');
  const [selectedId, setSelectedId] = useState<string>();
  const [updating, setUpdating] = useState<ReviewStatus>();
  const [actionError, setActionError] = useState<string>();

  const selected = justifications.find((item) => item.id === selectedId);

  const filtered = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('pt-BR');
    return justifications.filter((item) =>
      (tab === 'Todas' || item.status === tab)
      && (!term || [item.studentName, item.reasonCategory, item.description]
        .some((value) => value.toLocaleLowerCase('pt-BR').includes(term))));
  }, [justifications, search, tab]);

  const countOf = (status: TabFilter) =>
    status === 'Todas' ? justifications.length : justifications.filter((item) => item.status === status).length;

  const review = async (status: ReviewStatus) => {
    if (!selected) return;
    setUpdating(status);
    setActionError(undefined);
    try {
      await onUpdateStatus(selected.id, status);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Não foi possível analisar a justificativa.');
    } finally {
      setUpdating(undefined);
    }
  };

  const openDetails = (id: string) => {
    setActionError(undefined);
    setSelectedId(id);
  };

  const reviewBlocked = !canReview || persistenceState !== 'persistent' || Boolean(updating);

  return (
    <>
      <PageHeader
        eyebrow="Gestão escolar"
        title="Justificativas de ausência"
        description="Acompanhe as solicitações textuais enviadas pelos responsáveis."
      />

      <div role="tablist" aria-label="Filtrar por situação" className="tabs mb-6">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            className="tab inline-flex items-center gap-2"
            onClick={() => setTab(item.id)}
          >
            {item.label}
            <span className={`count-badge ${tab === item.id ? 'count-badge-brand' : ''}`}>{countOf(item.id)}</span>
          </button>
        ))}
      </div>

      <section className="card overflow-hidden" aria-labelledby="justifications-title">
        <div className="card-header">
          <div>
            <h2 id="justifications-title" className="card-title">Fila de análise</h2>
            <p className="card-subtitle">Compartilhada com o portal dos responsáveis.</p>
          </div>
          <Chip tone="neutral">{filtered.length} {filtered.length === 1 ? 'solicitação' : 'solicitações'}</Chip>
        </div>
        <div className="px-6 pb-5">
          <label htmlFor="justifications-search" className="sr-only">Buscar justificativas</label>
          <div className="relative">
            <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
            <input
              id="justifications-search"
              type="search"
              className="input pl-9"
              placeholder="Buscar por estudante, motivo ou descrição"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
        </div>

        {persistenceState === 'unavailable' && (
          <div className="px-6 pb-4">
            <Callout tone="warning" role="status">API local indisponível. {persistenceError}</Callout>
          </div>
        )}

        {persistenceState === 'loading' && justifications.length === 0 ? (
          <SkeletonRows rows={4} />
        ) : filtered.length === 0 ? (
          <EmptyState
            illustration={<EmptyInboxIllustration className="mb-4 h-20" />}
            title={justifications.length === 0 ? 'Nenhuma justificativa recebida' : 'Nenhum resultado'}
            description={justifications.length === 0 ? 'As solicitações enviadas pelo portal aparecem aqui.' : 'Ajuste a busca ou a aba selecionada.'}
          />
        ) : (
          <div className="table-scroll">
            <table className="data-table min-w-[820px]">
              <caption className="sr-only">Justificativas de ausência</caption>
              <thead>
                <tr>
                  <th scope="col" className="pl-6">Estudante</th>
                  <th scope="col">Período de ausência</th>
                  <th scope="col">Motivo</th>
                  <th scope="col">Situação</th>
                  <th scope="col" className="pr-6 text-right">Detalhes</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => (
                  <tr key={item.id}>
                    <td className="pl-6">
                      <div className="flex items-center gap-3">
                        <Avatar name={item.studentName} />
                        <p className="cell-primary">{item.studentName}</p>
                      </div>
                    </td>
                    <td className="num whitespace-nowrap">
                      <p className="font-medium">{formatIsoDate(item.date)}</p>
                      {item.endDate && item.endDate !== item.date && <p className="cell-secondary">até {formatIsoDate(item.endDate)}</p>}
                      <p className="cell-secondary">Enviada {item.submittedAt}</p>
                    </td>
                    <td>{item.reasonCategory}</td>
                    <td><JustificationStatusChip status={item.status} /></td>
                    <td className="pr-6 text-right">
                      <button type="button" className="btn-link" onClick={() => openDetails(item.id)}>
                        <ArrowUpRight aria-hidden="true" />
                        {item.status === 'Em Análise' && canReview ? 'Analisar' : 'Consultar'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="table-footer">
          <span className="inline-flex items-center gap-1.5"><FileText aria-hidden="true" className="h-3.5 w-3.5" /> Somente texto · sem atestados ou anexos</span>
          <span>{canReview ? 'Decisões registradas por perfil autorizado' : 'Análise restrita à Coordenação e à Direção'}</span>
        </div>
      </section>

      <Modal
        isOpen={Boolean(selected)}
        onClose={() => setSelectedId(undefined)}
        labelledById="justification-detail-title"
        title={selected?.status === 'Em Análise' && canReview ? 'Analisar justificativa' : 'Justificativa'}
        description={selected ? `${selected.studentName} · enviada ${selected.submittedAt}` : undefined}
        icon={FileText}
        closeDisabled={Boolean(updating)}
        footer={selected?.status === 'Em Análise' && canReview ? (
          <>
            <button type="button" className="btn btn-danger-outline" disabled={reviewBlocked} onClick={() => void review('Recusado')}>
              <XCircle aria-hidden="true" />
              {updating === 'Recusado' ? 'Recusando…' : 'Recusar'}
            </button>
            <button type="button" className="btn btn-primary" disabled={reviewBlocked} onClick={() => void review('Aprovado pela Coordenação')}>
              <CheckCircle2 aria-hidden="true" />
              {updating === 'Aprovado pela Coordenação' ? 'Aprovando…' : 'Aprovar'}
            </button>
          </>
        ) : (
          <button type="button" className="btn btn-secondary" onClick={() => setSelectedId(undefined)}>Fechar</button>
        )}
      >
        {selected && (
          <div className="space-y-5">
            <div className="flex items-center justify-between gap-3">
              <JustificationStatusChip status={selected.status} />
              {selected.reviewedAt && (
                <span className="text-xs text-muted">Analisada por {selected.reviewedBy ?? 'perfil autorizado'} em {selected.reviewedAt}</span>
              )}
            </div>
            <DefinitionList
              items={[
                ['Estudante', selected.studentName],
                ['Motivo', selected.reasonCategory],
                ['Início da ausência', formatIsoDate(selected.date)],
                ['Fim da ausência', formatIsoDate(selected.endDate) || formatIsoDate(selected.date)],
              ]}
            />
            <div>
              <p className="mb-2 text-xs font-medium text-muted">Descrição enviada pelo responsável</p>
              <blockquote className="rounded-[10px] border border-line bg-surface px-4 py-3 text-sm leading-relaxed text-ink">
                {selected.description}
              </blockquote>
            </div>
            {selected.status === 'Em Análise' && !canReview && (
              <Callout tone="neutral" icon={ShieldCheck}>A análise é restrita às contas de Coordenação e Direção.</Callout>
            )}
            {actionError && <Callout tone="negative" role="alert">{actionError}</Callout>}
          </div>
        )}
      </Modal>
    </>
  );
};
