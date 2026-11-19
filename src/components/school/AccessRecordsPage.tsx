import React, { useMemo, useState } from 'react';
import { Download, Plus, Search, X } from 'lucide-react';
import type { AccessLog } from '../../types';
import { EmptySearchIllustration } from '../brand/Illustrations';
import { Callout, EmptyState, PageHeader, SkeletonRows } from '../ui';
import { AccessLogTable, accessOriginLabel } from './AccessLogTable';

interface AccessRecordsPageProps {
  logs: AccessLog[];
  state: 'loading' | 'persistent' | 'unavailable';
  error?: string;
  updatedAt?: string;
  onSelectStudent: (studentId: string) => void;
  onOpenManualRelease: () => void;
}

type DirectionFilter = 'todos' | 'entry' | 'exit';

/** Aspas em todas as células e prefixo ' contra fórmulas (=, +, -, @) ao abrir no Excel. */
const csvCell = (value: string) => {
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return `"${safe.replace(/"/g, '""')}"`;
};

export const AccessRecordsPage: React.FC<AccessRecordsPageProps> = ({
  logs,
  state,
  error,
  updatedAt,
  onSelectStudent,
  onOpenManualRelease,
}) => {
  const [search, setSearch] = useState('');
  const [direction, setDirection] = useState<DirectionFilter>('todos');
  const [shift, setShift] = useState('Todos');
  const [turma, setTurma] = useState('Todas');

  const filtered = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('pt-BR');
    return logs.filter((log) => {
      const matchesTerm = !term || [log.studentName, log.matricula, log.turma, log.turnstileName]
        .some((value) => value.toLocaleLowerCase('pt-BR').includes(term));
      return matchesTerm
        && (direction === 'todos' || log.direction === direction)
        && (shift === 'Todos' || log.shift === shift)
        && (turma === 'Todas' || log.turma === turma);
    });
  }, [direction, logs, search, shift, turma]);

  // Turmas presentes nos registros carregados, em ordem natural (1º, 2º, ... 9º).
  const turmaOptions = useMemo(() => ['Todas', ...Array.from(new Set<string>(logs.map((log) => log.turma)))
    .sort((left, right) => left.localeCompare(right, 'pt-BR', { numeric: true }))], [logs]);

  const hasFilters = Boolean(search) || direction !== 'todos' || shift !== 'Todos' || turma !== 'Todas';
  const clearFilters = () => {
    setSearch('');
    setDirection('todos');
    setShift('Todos');
    setTurma('Todas');
  };

  const exportCsv = () => {
    const headers = ['Movimento', 'Horario', 'Data', 'Matricula', 'Estudante', 'Turma', 'Turno', 'Catraca', 'Origem', 'Situacao', 'Notificacao interna'];
    const rows = filtered.map((log) => [
      log.direction === 'entry' ? 'Entrada' : 'Saída',
      log.exactTime,
      new Date(log.timestamp).toLocaleDateString('pt-BR'),
      log.matricula,
      log.studentName,
      log.turma,
      log.shift,
      log.turnstileName,
      accessOriginLabel(log),
      log.status,
      log.notification.pushApp,
    ].map(csvCell).join(';'));
    // BOM UTF-8 + separador ";" para o Excel em pt-BR abrir acentos e colunas corretamente.
    const blob = new Blob(['\uFEFF', [headers.map(csvCell).join(';'), ...rows].join('\r\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `registros_catraca_troia_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <PageHeader
        eyebrow="Gestão escolar"
        title="Registros de acesso"
        description="Cada passagem reúne estudante, horário, movimento, catraca, método e situação."
        actions={
          <>
            <button type="button" className="btn btn-secondary" onClick={exportCsv} disabled={filtered.length === 0}>
              <Download aria-hidden="true" />
              Exportar CSV
            </button>
            <button type="button" className="btn btn-primary" onClick={onOpenManualRelease}>
              <Plus aria-hidden="true" />
              Passagem assistida
            </button>
          </>
        }
      />

      <section className="card overflow-hidden" aria-labelledby="records-title">
        <div className="card-header">
          <div>
            <h2 id="records-title" className="card-title">
              Movimentações <span className="font-normal text-muted">/ {filtered.length}</span>
            </h2>
            <p className="card-subtitle">Passagens gravadas pelo servidor da escola, atualizadas a cada 5 segundos.</p>
          </div>
        </div>

        <div className="grid gap-3 px-6 pb-5 md:grid-cols-[minmax(0,1fr)_repeat(3,minmax(0,170px))]">
          <div className="relative">
            <label htmlFor="records-search" className="sr-only">Buscar registros</label>
            <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
            <input
              id="records-search"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Nome, matrícula, turma ou catraca"
              className="input pl-9"
            />
          </div>
          <div>
            <label htmlFor="records-direction" className="sr-only">Movimento</label>
            <select id="records-direction" className="select" value={direction} onChange={(event) => setDirection(event.target.value as DirectionFilter)}>
              <option value="todos">Todos os movimentos</option>
              <option value="entry">Entradas</option>
              <option value="exit">Saídas</option>
            </select>
          </div>
          <div>
            <label htmlFor="records-shift" className="sr-only">Turno</label>
            <select id="records-shift" className="select" value={shift} onChange={(event) => setShift(event.target.value)}>
              <option value="Todos">Todos os turnos</option>
              <option value="Manhã">Manhã</option>
              <option value="Tarde">Tarde</option>
              <option value="Integral">Integral</option>
            </select>
          </div>
          <div>
            <label htmlFor="records-turma" className="sr-only">Turma</label>
            <select id="records-turma" className="select" value={turma} onChange={(event) => setTurma(event.target.value)}>
              {turmaOptions.map((item) => (
                <option key={item} value={item}>{item === 'Todas' ? 'Todas as turmas' : item}</option>
              ))}
            </select>
          </div>
        </div>

        {state === 'unavailable' && (
          <div className="px-6 pb-4">
            <Callout tone="warning" role="status">
              Eventos sem sincronização: {error || 'API local indisponível.'} Os últimos dados da sessão continuam visíveis.
            </Callout>
          </div>
        )}

        {state === 'loading' && logs.length === 0 ? (
          <SkeletonRows rows={6} />
        ) : filtered.length === 0 ? (
          <EmptyState
            illustration={<EmptySearchIllustration className="mb-4 h-20" />}
            title={hasFilters ? 'Nenhum resultado' : 'Nenhuma passagem registrada'}
            description={hasFilters ? 'Ajuste os filtros para continuar.' : 'As passagens aparecem aqui assim que forem registradas.'}
            action={hasFilters && (
              <button type="button" className="btn btn-secondary btn-sm" onClick={clearFilters}>
                <X aria-hidden="true" />
                Limpar filtros
              </button>
            )}
          />
        ) : (
          <AccessLogTable logs={filtered} onSelectStudent={onSelectStudent} variant="full" caption="Registros de acesso filtrados" />
        )}

        <div className="table-footer">
          <span>
            {filtered.length} de {logs.length} registros
            {updatedAt && ` · Atualizado às ${new Date(updatedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`}
          </span>
          {hasFilters && (
            <button type="button" className="btn-link" onClick={clearFilters}>Limpar filtros</button>
          )}
        </div>
      </section>
    </>
  );
};
