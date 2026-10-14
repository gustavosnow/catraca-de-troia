import React, { useState } from 'react';
import { 
  X, 
  Bell, 
  LogIn, 
  LogOut, 
  Megaphone, 
  FileCheck, 
  ShieldAlert, 
  CheckCheck, 
  Clock, 
  Sparkles,
  ChevronRight,
  Filter
} from 'lucide-react';
import { ParentNotification } from '../../types';

interface InAppNotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: ParentNotification[];
  onMarkAllAsRead: () => void;
  canMarkAsRead?: boolean;
  onSelectNotification?: (notif: ParentNotification) => void;
}

export const InAppNotificationDrawer: React.FC<InAppNotificationDrawerProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAllAsRead,
  canMarkAsRead = true,
  onSelectNotification,
}) => {
  const [filter, setFilter] = useState<'all' | 'access' | 'notices'>('all');

  if (!isOpen) return null;

  const filtered = notifications.filter(n => {
    if (filter === 'access') return n.type === 'entry' || n.type === 'exit';
    if (filter === 'notices') return n.type === 'notice' || n.type === 'absence';
    return true;
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="absolute inset-0 z-40 flex flex-col bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 text-white w-full h-full shadow-2xl flex flex-col animate-in slide-in-from-bottom sm:slide-in-from-right duration-300 border-t sm:border-t-0 sm:border-l border-slate-800">
        
        {/* Header */}
        <div className="bg-slate-900/95 text-white p-4 sm:p-5 flex items-center justify-between border-b border-slate-800 sticky top-0 z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">Central de Notificações</h2>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-bold">
                    {unreadCount} novas
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">Alertas de entrada, saída e comunicados</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Fechar Notificações"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action bar / Filters */}
        <div className="p-3 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between gap-2">
          <div className="flex gap-1">
            <button
              onClick={() => setFilter('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                filter === 'all' ? 'bg-orange-600 text-white shadow-xs font-bold' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              Todas ({notifications.length})
            </button>
            <button
              onClick={() => setFilter('access')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                filter === 'access' ? 'bg-orange-600 text-white shadow-xs font-bold' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              Catraca
            </button>
            <button
              onClick={() => setFilter('notices')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                filter === 'notices' ? 'bg-orange-600 text-white shadow-xs font-bold' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              Avisos
            </button>
          </div>

          <button
            onClick={onMarkAllAsRead}
            disabled={!canMarkAsRead}
            className="text-xs text-orange-400 hover:text-orange-300 font-bold flex items-center gap-1 cursor-pointer transition-colors disabled:cursor-not-allowed disabled:text-slate-600"
            title={canMarkAsRead ? 'Marcar todas como lidas' : 'Reconecte-se para registrar a leitura'}
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Marcar todas como lidas</span>
            <span className="sm:hidden">Lidas</span>
          </button>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-slate-400 text-xs">
              <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-3 text-slate-500">
                <Bell className="w-6 h-6" />
              </div>
              <p className="font-semibold text-slate-300">Nenhuma notificação nesta categoria</p>
              <p className="text-slate-500 mt-1">Os registros de passagem na catraca aparecerão aqui.</p>
            </div>
          ) : (
            filtered.map((item) => {
              const isEntry = item.type === 'entry';
              const isExit = item.type === 'exit';
              const isNotice = item.type === 'notice';
              const isAbsence = item.type === 'absence';

              return (
                <div
                  key={item.id}
                  onClick={() => onSelectNotification?.(item)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                    !item.isRead
                      ? 'bg-slate-800/90 border-orange-500/50 shadow-md ring-1 ring-orange-500/20'
                      : 'bg-slate-800/50 hover:bg-slate-800 border-slate-800'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 shadow-sm ${
                      isEntry 
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                        : isExit 
                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' 
                        : isNotice
                        ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                        : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                    }`}>
                      {isEntry && <LogIn className="w-4 h-4" />}
                      {isExit && <LogOut className="w-4 h-4" />}
                      {isNotice && <Megaphone className="w-4 h-4" />}
                      {isAbsence && <FileCheck className="w-4 h-4" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <h4 className={`text-xs font-bold truncate ${!item.isRead ? 'text-white' : 'text-slate-300'}`}>
                          {item.title}
                        </h4>
                        <span className="text-[10px] text-slate-400 font-mono shrink-0">
                          {item.timestamp}
                        </span>
                      </div>

                      <p className="text-xs text-slate-400 font-normal mt-1 leading-relaxed">
                        {item.message}
                      </p>

                      <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-800/80 text-[11px] text-slate-500">
                        {item.studentName && (
                          <span className="text-slate-300 font-medium">{item.studentName}</span>
                        )}
                        {item.turnstile && (
                          <>
                            <span>•</span>
                            <span className="text-slate-400">{item.turnstile}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-slate-900 border-t border-slate-800 text-center">
          <button
            onClick={onClose}
            className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Voltar ao Aplicativo
          </button>
        </div>

      </div>
    </div>
  );
};
