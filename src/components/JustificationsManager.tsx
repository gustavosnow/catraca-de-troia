import React, { useMemo, useState } from 'react';
import { CheckCircle2, Clock3, FileText, Search, XCircle } from 'lucide-react';
import { AbsenceJustification } from '../types';

interface JustificationsManagerProps {
  justifications: AbsenceJustification[];
  onUpdateStatus: (
    id: string,
    status: Extract<AbsenceJustification['status'], 'Aprovado pela Coordenação' | 'Recusado'>,
  ) => Promise<void>;
  persistenceState: 'loading' | 'persistent' | 'unavailable';
  persistenceError?: string;
  canReview: boolean;
}

export const JustificationsManager: React.FC<JustificationsManagerProps> = ({
  justifications,
  onUpdateStatus,
  persistenceState,
  persistenceError,
  canReview,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Todas' | AbsenceJustification['status']>('Todas');
  const [updatingId, setUpdatingId] = useState<string>();
  const [actionError, setActionError] = useState<string>();

  const updateStatus = async (
    justification: AbsenceJustification,
    status: Extract<AbsenceJustification['status'], 'Aprovado pela Coordenação' | 'Recusado'>,
  ) => {
    setUpdatingId(justification.id);
    setActionError(undefined);
    try {
      await onUpdateStatus(justification.id, status);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Não foi possível analisar a justificativa.');
    } finally {
      setUpdatingId(undefined);
    }
  };

  const filtered = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLocaleLowerCase('pt-BR');
    return justifications.filter((justification) => {
      const matchesSearch =
        !normalizedSearch ||
        justification.studentName.toLocaleLowerCase('pt-BR').includes(normalizedSearch) ||
        justification.reasonCategory.toLocaleLowerCase('pt-BR').includes(normalizedSearch) ||
        justification.description.toLocaleLowerCase('pt-BR').includes(normalizedSearch);
      const matchesStatus = statusFilter === 'Todas' || justification.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [justifications, searchTerm, statusFilter]);

  const pendingCount = justifications.filter((item) => item.status === 'Em Análise').length;

  return (
    <section className="space-y-5">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Justificativas de ausência</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Fila demonstrativa compartilhada com o portal dos responsáveis
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-xs font-bold text-amber-800">
              {pendingCount} em análise
            </span>
            <span className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-600">
              {justifications.length} no total
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 mt-4 pt-4 border-t border-slate-100">
          <label className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Buscar estudante, motivo ou descrição"
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
            />
          </label>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700"
          >
            <option>Todas</option>
            <option>Em Análise</option>
            <option>Aprovado pela Coordenação</option>
            <option>Recusado</option>
          </select>
        </div>
      </div>

      <div className="space-y-3">
        {actionError && (
          <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
            {actionError}
          </div>
        )}
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center text-sm text-slate-500">
            Nenhuma justificativa corresponde aos filtros.
          </div>
        ) : (
          filtered.map((justification) => (
            <article key={justification.id} className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-3 min-w-0">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-slate-900">{justification.studentName}</h3>
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                        justification.status === 'Em Análise'
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : justification.status === 'Aprovado pela Coordenação'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-rose-50 text-rose-800 border-rose-200'
                      }`}>
                        {justification.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Ausência em {justification.date} • {justification.reasonCategory} • Enviada {justification.submittedAt}
                    </p>
                  </div>

                  <p className="text-sm text-slate-700 bg-slate-50 border border-slate-100 rounded-xl p-3">
                    {justification.description}
                  </p>



                  {justification.reviewedAt && (
                    <p className="text-[11px] text-slate-500">
                      Analisada por {justification.reviewedBy} em {justification.reviewedAt}
                    </p>
                  )}
                </div>

                {justification.status === 'Em Análise' && (
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => updateStatus(justification, 'Aprovado pela Coordenação')}
                      disabled={!canReview || updatingId === justification.id || persistenceState !== 'persistent'}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-xs font-bold"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Aprovar
                    </button>
                    <button
                      onClick={() => updateStatus(justification, 'Recusado')}
                      disabled={!canReview || updatingId === justification.id || persistenceState !== 'persistent'}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-rose-50 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed border border-rose-200 text-rose-700 text-xs font-bold"
                    >
                      <XCircle className="w-4 h-4" /> Recusar
                    </button>
                  </div>
                )}
              </div>
            </article>
          ))
        )}
      </div>

      <div className={`flex items-start gap-2 p-3 rounded-xl border text-xs ${
        persistenceState === 'persistent'
          ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
          : 'bg-amber-50 border-amber-200 text-amber-900'
      }`}>
        <Clock3 className="w-4 h-4 shrink-0 mt-0.5" />
        <p>
          {persistenceState === 'persistent'
            ? canReview
              ? 'Justificativas exclusivamente textuais, persistidas na API local demonstrativa. Este piloto não recebe atestados ou outros anexos.'
              : 'Dados persistidos na API local. A análise é restrita às contas demonstrativas de Coordenação e Direção.'
            : persistenceState === 'loading'
              ? 'Carregando justificativas da API local…'
              : `API local indisponível. ${persistenceError || ''}`}
        </p>
      </div>
    </section>
  );
};
