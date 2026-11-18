import React, { useState } from 'react';
import { Bell, CheckCheck, FileCheck, LogIn, LogOut, Megaphone, ShieldAlert } from 'lucide-react';
import type { ParentNotification } from '../../types';
import { Drawer, EmptyState, cx } from '../ui';

interface InAppNotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: ParentNotification[];
  onMarkAllAsRead: () => void;
  canMarkAsRead?: boolean;
  onSelectNotification?: (notification: ParentNotification) => void;
}

const ICONS: Record<ParentNotification['type'], { icon: typeof Bell; tint: string }> = {
  entry: { icon: LogIn, tint: 'bg-positive-soft text-positive' },
  exit: { icon: LogOut, tint: 'bg-surface-2 text-ink-2' },
  notice: { icon: Megaphone, tint: 'bg-brand-soft text-action' },
  absence: { icon: FileCheck, tint: 'bg-info-soft text-info' },
  security: { icon: ShieldAlert, tint: 'bg-warning-soft text-warning' },
};

export const InAppNotificationDrawer: React.FC<InAppNotificationDrawerProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAllAsRead,
  canMarkAsRead = true,
  onSelectNotification,
}) => {
  const [filter, setFilter] = useState<'all' | 'access' | 'notices'>('all');
  const unread = notifications.filter((item) => !item.isRead).length;
  const filtered = notifications.filter((item) => {
    if (filter === 'access') return item.type === 'entry' || item.type === 'exit';
    if (filter === 'notices') return item.type === 'notice' || item.type === 'absence';
    return true;
  });

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      labelledById="notification-drawer-title"
      title={<>Notificações {unread > 0 && <span className="count-badge count-badge-brand ml-1.5 align-middle">{unread}</span>}</>}
      description="Entradas, saídas e comunicados dos seus estudantes."
      footer={<button type="button" className="btn btn-secondary w-full" onClick={onClose}>Voltar ao portal</button>}
    >
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-b border-line px-5 py-3">
        <div className="segmented" role="group" aria-label="Filtrar notificações">
          <button type="button" aria-pressed={filter === 'all'} onClick={() => setFilter('all')}>Todas</button>
          <button type="button" aria-pressed={filter === 'access'} onClick={() => setFilter('access')}>Catraca</button>
          <button type="button" aria-pressed={filter === 'notices'} onClick={() => setFilter('notices')}>Avisos</button>
        </div>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={onMarkAllAsRead}
          disabled={!canMarkAsRead || unread === 0}
          title={canMarkAsRead ? 'Marcar todas como lidas' : 'Reconecte-se para registrar a leitura'}
        >
          <CheckCheck aria-hidden="true" />
          Marcar como lidas
        </button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          compact
          icon={Bell}
          title={filter === 'all' ? 'Nenhuma notificação' : 'Nenhuma notificação nesta categoria'}
          description={filter === 'notices' ? 'Os comunicados da escola aparecem aqui.' : filter === 'access' ? 'As passagens registradas na catraca aparecem aqui.' : 'Passagens na catraca e comunicados da escola aparecem aqui.'}
        />
      ) : (
        <ul className="divide-y divide-line">
          {filtered.map((item) => {
            const { icon: Icon, tint } = ICONS[item.type] ?? ICONS.notice;
            const content = (
              <>
                <span className={cx('inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', tint)}>
                  <Icon aria-hidden="true" className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className={cx('text-sm text-ink', !item.isRead ? 'font-semibold' : 'font-medium')}>
                      {item.title}
                      {!item.isRead && <span className="sr-only"> (não lida)</span>}
                    </p>
                    <span className="tabular shrink-0 text-xs text-muted">{item.timestamp}</span>
                  </div>
                  <p className="mt-0.5 text-[13px] leading-relaxed text-ink-2">{item.message}</p>
                  {(item.studentName || item.turnstile) && (
                    <p className="mt-1 text-xs text-muted">{[item.studentName, item.turnstile].filter(Boolean).join(' · ')}</p>
                  )}
                </div>
                {!item.isRead && <span aria-hidden="true" className="mt-2 h-2 w-2 shrink-0 rounded-full bg-brand" />}
              </>
            );
            return (
              <li key={item.id}>
                {onSelectNotification ? (
                  <button type="button" className="flex w-full gap-3 px-5 py-4 text-left hover:bg-surface" onClick={() => onSelectNotification(item)}>{content}</button>
                ) : (
                  <div className={cx('flex gap-3 px-5 py-4', !item.isRead && 'bg-[#fffaf5]')}>{content}</div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </Drawer>
  );
};
