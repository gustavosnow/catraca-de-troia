import React from 'react';
import {
  AlertTriangle,
  ArrowRight,
  ChevronRight,
  FileText,
  Link2,
  LogIn,
  LogOut,
  Megaphone,
  Plus,
  School,
  ScanFace,
  Users,
} from 'lucide-react';
import type { AccessLog, SecurityAlert, Turnstile } from '../../types';
import type { AccessEventOverview } from '../../../shared/contracts/accessEvents';
import type { AccessEventSyncStatus } from '../../../shared/contracts/accessEventSync';
import { DEMO_ACCESS_LABEL } from '../../services/accessHistory';
import { AllClearIllustration, EmptySearchIllustration } from '../brand/Illustrations';
import { Callout, Chip, EmptyState, SkeletonRows, StatTile, firstNameOf, greetingForNow } from '../ui';

/** Câmera com leitura nos últimos 2 minutos. */
const READING_WINDOW_MS = 2 * 60 * 1000;
import { AccessLogTable } from './AccessLogTable';
import { SyncQueueCard } from './SyncQueueCard';
import type { SchoolSection } from './SchoolShell';

interface OverviewPageProps {
  userName: string;
  totalStudents: number;
  accessOverview: AccessEventOverview | null;
  logs: AccessLog[];
  logsState: 'loading' | 'persistent' | 'unavailable';
  logsError?: string;
  turnstiles: Turnstile[];
  alerts: SecurityAlert[];
  pendingJustifications: number;
  pendingLinks: number;
  noticesCount: number;
  canAdminister: boolean;
  syncStatus: AccessEventSyncStatus | null;
  syncStatusState: 'loading' | 'available' | 'unavailable';
  syncStatusError?: string;
  canRetrySyncConflicts: boolean;
  isRetryingSyncConflicts: boolean;
  onRetrySyncConflicts: () => void;
  onOpenManualRelease: () => void;
  onOpenAlerts: () => void;
  onNavigate: (section: SchoolSection) => void;
  onSelectStudent: (studentId: string) => void;
}

const pad = (value?: number) => value === undefined ? '—' : String(value).padStart(2, '0');

export const OverviewPage: React.FC<OverviewPageProps> = ({
  userName,
  totalStudents,
  accessOverview,
  logs,
  logsState,
  logsError,
  turnstiles,
  alerts,
  pendingJustifications,
  pendingLinks,
  noticesCount,
  canAdminister,
  syncStatus,
  syncStatusState,
  syncStatusError,
  canRetrySyncConflicts,
  isRetryingSyncConflicts,
  onRetrySyncConflicts,
  onOpenManualRelease,
  onOpenAlerts,
  onNavigate,
  onSelectStudent,
}) => {
  const activeAlerts = alerts;
  const recentLogs = logs.slice(0, 6);
  const firstName = firstNameOf(userName);

  const pending = [
    { id: 'justificativas' as const, icon: FileText, label: 'Justificativas', detail: pendingJustifications === 1 ? '1 aguardando análise' : `${pendingJustifications} aguardando análise`, show: true },
    { id: 'vinculos' as const, icon: Link2, label: 'Solicitações de vínculo', detail: pendingLinks === 1 ? '1 pendente de aprovação' : `${pendingLinks} pendentes de aprovação`, show: canAdminister },
    { id: 'comunicados' as const, icon: Megaphone, label: 'Comunicados', detail: noticesCount === 1 ? '1 publicado pela escola' : `${noticesCount} publicados pela escola`, show: true },
  ].filter((item) => item.show);

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow-muted mb-2">Visão geral</p>
          <h1 className="display-title text-[28px] sm:text-[32px]">{greetingForNow()}, {firstName}.</h1>
          <p className="mt-2 text-sm text-muted">Acompanhe as entradas, saídas e pendências da sua escola.</p>
        </div>
        <button type="button" onClick={onOpenManualRelease} className="btn btn-primary btn-lg self-start sm:self-auto">
          <Plus aria-hidden="true" />
          Passagem assistida
        </button>
      </header>

      <section aria-label="Indicadores do dia" className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatTile label="Estudantes cadastrados" value={pad(totalStudents)} icon={Users} caption="Cadastro da escola" />
        <StatTile label="Entradas hoje" value={pad(accessOverview?.entries)} icon={LogIn} caption="Registros do dia" emphasis />
        <StatTile label="Saídas hoje" value={pad(accessOverview?.exits)} icon={LogOut} caption="Registros do dia" />
        <StatTile label="Na escola agora" value={pad(accessOverview?.onCampus)} icon={School} caption="Pela última passagem de hoje" />
        {accessOverview?.hasDemoRecords && (
          <p className="col-span-full text-xs text-muted">Os indicadores do dia incluem dados de demonstração.</p>
        )}
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-6">
          <section aria-labelledby="turnstiles-title">
            <div className="mb-3 flex items-baseline justify-between gap-3">
              <h2 id="turnstiles-title" className="text-base font-semibold text-ink">Controle de acesso</h2>
              <span className="text-xs text-muted">{turnstiles.length} {turnstiles.length === 1 ? 'catraca cadastrada' : 'catracas cadastradas'}</span>
            </div>
            {turnstiles.length === 0 ? (
              <div className="card px-6 py-5 text-[13px] text-muted">
                Nenhuma catraca cadastrada. Registre as câmeras com <code className="text-ink">npm run device:register</code>.
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {turnstiles.map((turnstile) => {
                  const passes = accessOverview
                    ? accessOverview.turnstiles.find(({ id }) => id === turnstile.id)?.passes ?? 0
                    : undefined;
                  return (
                    <article key={turnstile.id} className="card p-5">
                      <div className="flex items-start gap-3">
                        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-brand-soft text-action">
                          <ScanFace aria-hidden="true" className="h-5 w-5" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-[15px] font-semibold text-ink">{turnstile.name}</h3>
                          <p className="text-[13px] text-muted">Reconhecimento facial em protótipo</p>
                        </div>
                      </div>
                      <ul className="mt-4 space-y-2 border-t border-line pt-4">
                        {turnstile.lanes.map((lane) => {
                          const reading = Boolean(lane.lastSeenAt) && Date.now() - Date.parse(lane.lastSeenAt!) < READING_WINDOW_MS;
                          return (
                            <li key={lane.deviceId} className="flex items-center justify-between gap-3 text-[13px]">
                              <span className="flex items-center gap-2 text-ink-2">
                                {lane.direction === 'entry' ? <LogIn aria-hidden="true" className="h-4 w-4" /> : <LogOut aria-hidden="true" className="h-4 w-4" />}
                                {lane.direction === 'entry' ? 'Entrada' : 'Saída'}
                              </span>
                              {!lane.active
                                ? <Chip tone="neutral">Câmera desativada</Chip>
                                : reading
                                  ? <Chip tone="positive">Leitura recente</Chip>
                                  : <Chip tone="neutral">Sem leitura recente</Chip>}
                            </li>
                          );
                        })}
                      </ul>
                      <div className="mt-4 flex items-baseline justify-between border-t border-line pt-4">
                        <span className="text-[13px] text-ink-2">Passagens hoje</span>
                        <span className="tabular text-lg font-bold text-ink">{pad(passes)}</span>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          <section className="card overflow-hidden" aria-labelledby="recent-title">
            <div className="card-header">
              <div>
                <h2 id="recent-title" className="card-title">Últimas movimentações</h2>
                <p className="card-subtitle">Passagens gravadas pelo servidor da escola</p>
              </div>
              <button type="button" className="btn-link mt-1" onClick={() => onNavigate('registros')}>
                Ver todos <ArrowRight aria-hidden="true" />
              </button>
            </div>
            {logsState === 'loading' && logs.length === 0 ? (
              <SkeletonRows rows={4} />
            ) : logsState === 'unavailable' && logs.length === 0 ? (
              <div className="px-6 pb-6"><Callout tone="negative" role="alert">{logsError || 'API de eventos indisponível.'}</Callout></div>
            ) : recentLogs.length === 0 ? (
              <EmptyState
                illustration={<EmptySearchIllustration className="mb-4 h-20" />}
                title="Nenhuma passagem registrada hoje"
                description="As passagens aparecem aqui quando a câmera reconhece um estudante ou a portaria registra uma passagem assistida."
              />
            ) : (
              <>
                <AccessLogTable logs={recentLogs} onSelectStudent={onSelectStudent} caption="Últimas movimentações registradas" />
                <div className="table-footer">
                  <span>Exibindo {recentLogs.length} de {logs.length} registros</span>
                  <span>Atualização automática a cada 5 segundos</span>
                </div>
              </>
            )}
          </section>
        </div>

        <aside className="space-y-6" aria-label="Painel lateral">
          <section className="card p-5" aria-labelledby="attention-title">
            <div className="flex items-center justify-between gap-3">
              <h2 id="attention-title" className="card-title">Pontos de atenção</h2>
              {activeAlerts.length > 0 && <span className="count-badge count-badge-brand">{activeAlerts.length}</span>}
            </div>
            {activeAlerts.length === 0 ? (
              <EmptyState compact illustration={<AllClearIllustration className="mb-3 h-16" />} title="Nada pendente" description="Nenhuma leitura negada hoje." />
            ) : (
              <ul className="mt-3 divide-y divide-line">
                {activeAlerts.slice(0, 2).map((alert) => (
                  <li key={alert.id} className="flex gap-3 py-4">
                    <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-warning-soft text-warning">
                      <AlertTriangle aria-hidden="true" className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold text-ink">{alert.title}</p>
                      <p className="mt-0.5 text-xs text-muted">{alert.turnstileName} · {alert.direction === 'entry' ? 'entrada' : 'saída'}{alert.demo && ` · ${DEMO_ACCESS_LABEL}`}</p>
                      <p className="tabular mt-1 text-xs text-subtle">Hoje, {new Date(alert.occurredAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <div className="border-t border-line pt-4">
              <button type="button" className="btn-link" onClick={onOpenAlerts}>
                Consultar alertas <ArrowRight aria-hidden="true" />
              </button>
            </div>
          </section>

          <section className="card p-5" aria-labelledby="needs-title">
            <h2 id="needs-title" className="card-title">O que precisa de você</h2>
            <ul className="mt-2 divide-y divide-line">
              {pending.map((item) => (
                <li key={item.id}>
                  <button type="button" onClick={() => onNavigate(item.id)} className="group flex w-full items-center gap-3 py-3.5 text-left">
                    <item.icon aria-hidden="true" className="h-[18px] w-[18px] shrink-0 text-ink-2" />
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13px] font-semibold text-ink group-hover:text-action-ink">{item.label}</span>
                      <span className="block text-xs text-muted">{item.detail}</span>
                    </span>
                    <ChevronRight aria-hidden="true" className="h-4 w-4 text-subtle transition-transform group-hover:translate-x-0.5" />
                  </button>
                </li>
              ))}
            </ul>
          </section>

          <SyncQueueCard
            status={syncStatus}
            state={syncStatusState}
            error={syncStatusError}
            canRetry={canRetrySyncConflicts}
            isRetrying={isRetryingSyncConflicts}
            onRetry={onRetrySyncConflicts}
          />
        </aside>
      </div>
    </div>
  );
};
