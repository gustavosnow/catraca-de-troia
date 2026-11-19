import React, { useEffect, useState } from 'react';
import { useAccessibleDialog } from '../../hooks/useAccessibleDialog';
import {
  ArrowLeftRight,
  Bell,
  Building2,
  CalendarDays,
  ChevronRight,
  ClipboardList,
  FileText,
  FlaskConical,
  Presentation,
  History,
  House,
  LayoutGrid,
  Link2,
  LogOut,
  Megaphone,
  Menu,
  ShieldCheck,
  SlidersHorizontal,
  Smartphone,
  Users,
  X,
} from 'lucide-react';
import { BrandLockup } from '../brand/BrandMark';
import { Avatar, cx, focusMainContent } from '../ui';
import type { AuthUser } from '../../types';

export type SchoolSection =
  | 'visao-geral'
  | 'registros'
  | 'estudantes'
  | 'comunicados'
  | 'justificativas'
  | 'vinculos'
  | 'contas'
  | 'auditoria'
  | 'ferramentas';

export const SCHOOL_SECTIONS: SchoolSection[] = [
  'visao-geral', 'registros', 'estudantes', 'comunicados', 'justificativas',
  'vinculos', 'contas', 'auditoria', 'ferramentas',
];

export const ADMIN_SECTIONS: SchoolSection[] = ['vinculos', 'contas', 'auditoria'];

interface NavEntry {
  id: SchoolSection;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  count?: number;
}

const SECTION_LABELS: Record<SchoolSection, { label: string; group: string }> = {
  'visao-geral': { label: 'Visão geral', group: 'Gestão escolar' },
  registros: { label: 'Registros de acesso', group: 'Gestão escolar' },
  estudantes: { label: 'Estudantes', group: 'Gestão escolar' },
  comunicados: { label: 'Comunicados', group: 'Gestão escolar' },
  justificativas: { label: 'Justificativas', group: 'Gestão escolar' },
  vinculos: { label: 'Vínculos familiares', group: 'Administração' },
  contas: { label: 'Contas e permissões', group: 'Administração' },
  auditoria: { label: 'Auditoria', group: 'Administração' },
  ferramentas: { label: 'Ferramentas', group: 'Operação' },
};

interface SchoolShellProps {
  section: SchoolSection;
  onNavigate: (section: SchoolSection) => void;
  canAdminister: boolean;
  user: AuthUser;
  counts: { notices: number; pendingJustifications: number; pendingLinks: number; activeAlerts: number };
  onOpenAlerts: () => void;
  /** Abre a apresentação do projeto (#/projeto). */
  onOpenPresentation: () => void;
  onSwitchToParentApp: () => void;
  onLogout: () => void;
  connection: { tone: 'positive' | 'warning' | 'neutral'; label: string };
  children: React.ReactNode;
}

const formatToday = () => {
  const formatted = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'short', year: 'numeric' });
  return formatted.charAt(0).toUpperCase() + formatted.slice(1).replace(/\.(?= )/, '');
};

const roleLabel = (role?: string) => {
  if (!role) return 'Equipe escolar';
  if (role.startsWith('Operador')) return 'Portaria';
  if (role.startsWith('Coordenação')) return 'Coordenação';
  if (role.startsWith('Direção')) return 'Direção';
  return role;
};

export const SchoolShell: React.FC<SchoolShellProps> = ({
  section,
  onNavigate,
  canAdminister,
  user,
  counts,
  onOpenAlerts,
  onOpenPresentation,
  onSwitchToParentApp,
  onLogout,
  connection,
  children,
}) => {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [today, setToday] = useState(formatToday);

  useEffect(() => {
    const interval = window.setInterval(() => setToday(formatToday()), 60_000);
    return () => window.clearInterval(interval);
  }, []);

  // A gaveta só existe abaixo de lg (lg:hidden). Ao alargar a janela com ela aberta,
  // fechamos o estado para que a limpeza do diálogo devolva a rolagem do body.
  useEffect(() => {
    if (!isMobileNavOpen) return undefined;
    const desktop = window.matchMedia('(min-width: 64rem)');
    const closeOnDesktop = () => {
      if (desktop.matches) setIsMobileNavOpen(false);
    };
    closeOnDesktop();
    desktop.addEventListener('change', closeOnDesktop);
    return () => desktop.removeEventListener('change', closeOnDesktop);
  }, [isMobileNavOpen]);

  const mobileNavRef = useAccessibleDialog({ isOpen: isMobileNavOpen, onClose: () => setIsMobileNavOpen(false) });

  const management: NavEntry[] = [
    { id: 'visao-geral', label: 'Visão geral', icon: LayoutGrid },
    { id: 'registros', label: 'Registros de acesso', icon: ArrowLeftRight },
    { id: 'estudantes', label: 'Estudantes', icon: Users },
    { id: 'comunicados', label: 'Comunicados', icon: Megaphone },
    { id: 'justificativas', label: 'Justificativas', icon: FileText, count: counts.pendingJustifications },
  ];
  const administration: NavEntry[] = [
    { id: 'vinculos', label: 'Vínculos familiares', icon: Link2, count: counts.pendingLinks },
    { id: 'contas', label: 'Contas e permissões', icon: ShieldCheck },
    { id: 'auditoria', label: 'Auditoria', icon: History },
  ];

  const go = (target: SchoolSection) => {
    onNavigate(target);
    setIsMobileNavOpen(false);
  };

  const renderItem = (entry: NavEntry) => (
    <li key={entry.id}>
      <button
        type="button"
        className="nav-item"
        aria-current={section === entry.id ? 'page' : undefined}
        onClick={() => go(entry.id)}
      >
        <entry.icon aria-hidden="true" />
        <span className="flex-1 truncate">{entry.label}</span>
        {Boolean(entry.count) && (
          <span className="count-badge" aria-label={`${entry.count} pendentes`}>{entry.count}</span>
        )}
      </button>
    </li>
  );

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-5 pb-5 pt-6">
        <BrandLockup size={46} />
        <button type="button" className="icon-btn lg:hidden" onClick={() => setIsMobileNavOpen(false)} aria-label="Fechar navegação">
          <X />
        </button>
      </div>

      <div className="mx-4 mb-6 flex items-center gap-3 rounded-[10px] border border-line px-3 py-2.5">
        <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface text-ink-2">
          <Building2 aria-hidden="true" className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-[13px] font-semibold text-ink" title={user.schoolUnit}>{user.schoolUnit}</p>
          <p className="text-[11px] text-muted">Unidade escolar</p>
        </div>
      </div>

      <nav aria-label="Navegação do painel escolar" className="flex-1 space-y-6 overflow-y-auto px-4 pb-4">
        <div>
          <p className="nav-group-label">Gestão escolar</p>
          <ul className="space-y-0.5">{management.map(renderItem)}</ul>
        </div>
        {canAdminister && (
          <div>
            <p className="nav-group-label">Administração</p>
            <ul className="space-y-0.5">{administration.map(renderItem)}</ul>
          </div>
        )}
        <div>
          <ul className="space-y-0.5 border-t border-line pt-4">
            <li>
              <button type="button" className="nav-item" aria-current={section === 'ferramentas' ? 'page' : undefined} onClick={() => go('ferramentas')}>
                <SlidersHorizontal aria-hidden="true" />
                <span className="flex-1">Ferramentas</span>
              </button>
            </li>
            <li>
              <button type="button" className="nav-item" onClick={() => { setIsMobileNavOpen(false); onOpenPresentation(); }}>
                <Presentation aria-hidden="true" />
                <span className="flex-1">Sobre o projeto</span>
              </button>
            </li>
          </ul>
        </div>

        <div className="rounded-[10px] border border-line bg-surface px-3.5 py-3">
          <span className="chip chip-brand">
            <FlaskConical aria-hidden="true" />
            Piloto local
          </span>
          <p className="mt-2 text-xs leading-relaxed text-muted">
            Reconhecimento facial em protótipo.
            <br />
            Sem catraca física acionada.
          </p>
        </div>
      </nav>

      <div className="flex items-center gap-3 border-t border-line px-4 py-4">
        <Avatar name={user.name} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-semibold text-ink" title={user.name}>{user.name}</p>
          <p className="truncate text-xs text-muted">{roleLabel(user.staffRole)}</p>
        </div>
        <button type="button" className="icon-btn" onClick={onLogout} aria-label="Sair da conta" title="Sair">
          <LogOut />
        </button>
      </div>
    </div>
  );

  const crumb = SECTION_LABELS[section];

  return (
    <div className="min-h-screen bg-surface">
      <a
        href="#school-main-content"
        onClick={focusMainContent('school-main-content')}
        className="fixed left-3 top-3 z-[100] -translate-y-24 rounded-lg bg-action px-4 py-2 text-sm font-semibold text-white shadow-lg transition-transform focus:translate-y-0"
      >
        Pular para o conteúdo
      </a>

      {/* Sidebar fixa (desktop) */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[248px] border-r border-line bg-white lg:block">
        {sidebar}
      </aside>

      {/* Sidebar em gaveta (mobile/tablet) */}
      {isMobileNavOpen && (
        <div className="overlay lg:hidden" onMouseDown={(event) => event.target === event.currentTarget && setIsMobileNavOpen(false)}>
          <aside ref={mobileNavRef} role="dialog" aria-modal="true" aria-label="Menu de navegação" tabIndex={-1} className="drawer-panel absolute inset-y-0 left-0 w-[280px] max-w-[86vw] bg-white shadow-[var(--shadow-pop)]">
            {sidebar}
          </aside>
        </div>
      )}

      <div className="lg:pl-[248px]">
        <header className="sticky top-0 z-20 border-b border-line bg-white/95 backdrop-blur" style={{ top: 'env(safe-area-inset-top, 0px)' }}>
          <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-10">
            <button type="button" className="icon-btn -ml-1 lg:hidden" onClick={() => setIsMobileNavOpen(true)} aria-label="Abrir navegação">
              <Menu />
            </button>

            <nav aria-label="Você está em" className="flex min-w-0 items-center gap-2 text-[13px]">
              <House aria-hidden="true" className="hidden h-4 w-4 text-subtle sm:block" />
              <span className="hidden text-muted sm:inline">{crumb.group}</span>
              <ChevronRight aria-hidden="true" className="hidden h-3.5 w-3.5 text-subtle sm:block" />
              <span className="truncate font-semibold text-ink">{crumb.label}</span>
            </nav>

            <div className="ml-auto flex items-center gap-1 sm:gap-2">
              <span className="hidden items-center gap-2 text-[13px] text-muted xl:inline-flex">
                <CalendarDays aria-hidden="true" className="h-4 w-4" />
                {today}
              </span>
              <span
                className={cx(
                  'hidden items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium md:inline-flex',
                  connection.tone === 'positive' && 'border-positive-line bg-positive-soft text-positive',
                  connection.tone === 'warning' && 'border-warning-line bg-warning-soft text-warning',
                  connection.tone === 'neutral' && 'border-line bg-surface text-muted',
                )}
                role="status"
              >
                <span aria-hidden="true" className={cx(
                  'h-1.5 w-1.5 rounded-full',
                  connection.tone === 'positive' ? 'bg-positive' : connection.tone === 'warning' ? 'bg-warning' : 'bg-subtle',
                )} />
                {connection.label}
              </span>
              <button type="button" onClick={onSwitchToParentApp} className="btn btn-ghost btn-sm hidden md:inline-flex" title="Abrir o portal dos responsáveis">
                <Smartphone aria-hidden="true" />
                Portal dos responsáveis
              </button>
              <button
                type="button"
                className="icon-btn relative"
                onClick={onOpenAlerts}
                aria-label={counts.activeAlerts > 0 ? `Pontos de atenção: ${counts.activeAlerts} ativos` : 'Pontos de atenção'}
              >
                <Bell />
                {counts.activeAlerts > 0 && (
                  <span aria-hidden="true" className="absolute right-2 top-2 h-2 w-2 rounded-full bg-brand ring-2 ring-white" />
                )}
              </button>
              <span className="hidden sm:block"><Avatar name={user.name} /></span>
            </div>
          </div>
        </header>

        <main id="school-main-content" tabIndex={-1} className="mx-auto w-full max-w-[1320px] px-4 pb-16 pt-8 outline-none sm:px-6 lg:px-10">
          {children}
          <footer className="mt-12 flex flex-col gap-1 border-t border-line pt-5 text-xs text-muted sm:flex-row sm:justify-between">
            <span>{user.schoolUnit}</span>
            <span className="inline-flex items-center gap-1.5">
              <ClipboardList aria-hidden="true" className="h-3.5 w-3.5" />
              Catraca de Troia · Projeto acadêmico de gerência de projetos
            </span>
          </footer>
        </main>
      </div>
    </div>
  );
};
