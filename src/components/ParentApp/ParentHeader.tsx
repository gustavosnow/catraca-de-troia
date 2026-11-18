import React, { useEffect, useRef, useState } from 'react';
import { Bell, Building2, Check, FileText, History, House, LogOut, Megaphone } from 'lucide-react';
import type { ParentAccount } from '../../data/mockData';
import { BrandLockup } from '../brand/BrandMark';
import { Avatar, cx, firstNameOf } from '../ui';

export type ParentTab = 'home' | 'history' | 'notices';

interface ParentHeaderProps {
  currentGuardian: ParentAccount;
  allGuardians: ParentAccount[];
  onSelectGuardian: (guardian: ParentAccount) => void;
  unreadNotificationsCount: number;
  onOpenNotifications: () => void;
  activeTab: ParentTab;
  onSelectTab: (tab: ParentTab) => void;
  hasUnreadNotices: boolean;
  onOpenAbsence: () => void;
  canSubmitAbsence: boolean;
  onSwitchToManagement?: () => void;
  onLogout?: () => void;
  showNavigation?: boolean;
}

const TABS: Array<{ id: ParentTab; label: string; icon: typeof House }> = [
  { id: 'home', label: 'Início', icon: House },
  { id: 'history', label: 'Histórico', icon: History },
  { id: 'notices', label: 'Avisos', icon: Megaphone },
];

export const ParentHeader: React.FC<ParentHeaderProps> = ({
  currentGuardian,
  allGuardians,
  onSelectGuardian,
  unreadNotificationsCount,
  onOpenNotifications,
  activeTab,
  onSelectTab,
  hasUnreadNotices,
  onOpenAbsence,
  canSubmitAbsence,
  onSwitchToManagement,
  onLogout,
  showNavigation = true,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onPointer = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false);
    };
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && setMenuOpen(false);
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  return (
    <header
      data-testid="parent-header"
      className="sticky z-30 border-b border-line bg-white"
      style={{ top: 'env(safe-area-inset-top, 0px)' }}
    >
      <div className="mx-auto flex h-16 max-w-5xl items-center gap-4 px-4 sm:px-6 md:h-[72px]">
        <div data-testid="parent-brand" className="flex min-w-0 shrink-0 items-center">
          <BrandLockup size={44} />
        </div>

        {showNavigation && (
          <nav
            aria-label="Navegação do portal dos responsáveis"
            className="native-bottom-nav fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-line bg-white px-2 pt-1.5 md:static md:mx-auto md:flex md:gap-1 md:border-0 md:bg-transparent md:p-0"
          >
            {TABS.map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  id={`tab-parent-${tab.id}`}
                  type="button"
                  onClick={() => onSelectTab(tab.id)}
                  aria-current={active ? 'page' : undefined}
                  aria-label={tab.id === 'notices' && hasUnreadNotices ? 'Avisos, há itens não lidos' : undefined}
                  className={cx(
                    'relative flex flex-col items-center justify-center gap-1 rounded-lg py-1.5 text-xs font-medium transition-colors md:h-10 md:flex-row md:gap-2 md:px-3.5 md:text-sm',
                    active ? 'text-action-ink md:bg-brand-soft md:font-semibold' : 'text-muted hover:text-ink md:hover:bg-surface-2',
                  )}
                >
                  <tab.icon aria-hidden="true" className="h-5 w-5 md:h-[18px] md:w-[18px]" />
                  {tab.label}
                  {tab.id === 'notices' && hasUnreadNotices && (
                    <span aria-hidden="true" className="absolute right-[calc(50%-18px)] top-1 h-2 w-2 rounded-full bg-brand ring-2 ring-white md:static md:ring-0" />
                  )}
                </button>
              );
            })}
            <button
              id="tab-parent-absence"
              type="button"
              onClick={onOpenAbsence}
              disabled={!canSubmitAbsence}
              title={canSubmitAbsence ? 'Justificar uma ausência' : 'Reconecte-se para enviar uma justificativa'}
              className="flex flex-col items-center justify-center gap-1 rounded-lg py-1.5 text-xs font-medium text-muted transition-colors hover:text-ink disabled:opacity-50 md:h-10 md:flex-row md:gap-2 md:px-3.5 md:text-sm md:hover:bg-surface-2"
            >
              <FileText aria-hidden="true" className="h-5 w-5 md:h-[18px] md:w-[18px]" />
              Justificar
            </button>
          </nav>
        )}

        <div data-testid="parent-header-actions" className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
          <span className="hidden text-sm text-ink-2 lg:inline">Olá, {firstNameOf(currentGuardian.name)}</span>
          <button
            id="btn-parent-notifications"
            type="button"
            onClick={onOpenNotifications}
            className="icon-btn relative"
            aria-label={unreadNotificationsCount > 0 ? `Notificações: ${unreadNotificationsCount} não lidas` : 'Notificações'}
          >
            <Bell />
            {unreadNotificationsCount > 0 && (
              <span aria-hidden="true" className="absolute right-1 top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-action px-1 text-[10px] font-bold text-white ring-2 ring-white">
                {unreadNotificationsCount}
              </span>
            )}
          </button>

          <div ref={menuRef} className="relative">
            <button
              type="button"
              className="rounded-full p-0.5 ring-offset-2 transition hover:ring-2 hover:ring-line-strong"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              aria-label="Abrir menu da conta"
              onClick={() => setMenuOpen((current) => !current)}
            >
              <Avatar name={currentGuardian.name} />
            </button>
            {menuOpen && (
              <div role="menu" className="dialog-panel absolute right-0 top-12 z-40 w-72 overflow-hidden rounded-xl border border-line bg-white shadow-[var(--shadow-pop)]">
                <div className="flex items-center gap-3 border-b border-line px-4 py-4">
                  <Avatar name={currentGuardian.name} size="lg" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink">{currentGuardian.name}</p>
                    <p className="text-xs text-muted">{currentGuardian.relation} · {currentGuardian.childrenIds.length} {currentGuardian.childrenIds.length === 1 ? 'estudante vinculado' : 'estudantes vinculados'}</p>
                  </div>
                </div>
                {allGuardians.length > 1 && (
                  <div className="border-b border-line py-1.5">
                    <p className="eyebrow-muted px-4 py-1.5">Contas de demonstração</p>
                    {allGuardians.map((guardian) => (
                      <button
                        key={guardian.id}
                        type="button"
                        role="menuitemradio"
                        aria-checked={guardian.id === currentGuardian.id}
                        className="flex w-full items-center justify-between gap-2 px-4 py-2 text-left text-sm text-ink hover:bg-surface"
                        onClick={() => { onSelectGuardian(guardian); setMenuOpen(false); }}
                      >
                        {guardian.name}
                        {guardian.id === currentGuardian.id && <Check aria-hidden="true" className="h-4 w-4 text-action" />}
                      </button>
                    ))}
                  </div>
                )}
                <div className="py-1.5">
                  {onSwitchToManagement && (
                    <button type="button" role="menuitem" className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-ink hover:bg-surface" onClick={() => { setMenuOpen(false); onSwitchToManagement(); }}>
                      <Building2 aria-hidden="true" className="h-4 w-4 text-muted" />
                      Ir para a gestão escolar
                    </button>
                  )}
                  {onLogout && (
                    <button type="button" role="menuitem" className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-negative hover:bg-negative-soft" onClick={() => { setMenuOpen(false); onLogout(); }}>
                      <LogOut aria-hidden="true" className="h-4 w-4" />
                      Sair da conta
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
