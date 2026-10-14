import React, { useState } from 'react';
import { 
  Megaphone, 
  AlertTriangle, 
  Info, 
  CheckCircle2, 
  Download, 
  Calendar, 
  ChevronRight, 
  Sparkles, 
  X, 
  FileText
} from 'lucide-react';
import { SchoolNotice } from '../../types';

interface SchoolNoticesSectionProps {
  notices: SchoolNotice[];
  onMarkAsRead: (id: string) => void;
  canMarkAsRead?: boolean;
}

export const SchoolNoticesSection: React.FC<SchoolNoticesSectionProps> = ({
  notices,
  onMarkAsRead,
  canMarkAsRead = true,
}) => {
  const [selectedNotice, setSelectedNotice] = useState<SchoolNotice | null>(null);

  const handleOpenNotice = (notice: SchoolNotice) => {
    setSelectedNotice(notice);
    if (notice.isUnread && canMarkAsRead) {
      onMarkAsRead(notice.id);
    }
  };

  return (
    <section className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
            <Megaphone className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              Canal de Avisos da Direção
            </h3>
            <p className="text-[11px] text-slate-500">
              Comunicados e informes oficiais da gestão escolar
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {notices.some(n => n.isUnread) && (
            <span className="text-[11px] font-bold text-purple-800 bg-purple-100 px-2 py-0.5 rounded-full border border-purple-200 animate-pulse">
              Novo
            </span>
          )}
        </div>
      </div>

      {/* Notices List */}
      <div className="space-y-3">
        {notices.map((notice) => {
          const isUrgent = notice.priority === 'urgent';
          const isImportant = notice.priority === 'important';

          return (
            <div
              key={notice.id}
              onClick={() => handleOpenNotice(notice)}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer group hover:shadow-xs ${
                notice.isUnread
                  ? 'bg-purple-50/40 border-purple-200'
                  : 'bg-slate-50/50 hover:bg-slate-100/60 border-slate-200/70'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                    isUrgent
                      ? 'bg-red-100 text-red-800 border border-red-200'
                      : isImportant
                      ? 'bg-amber-100 text-amber-900 border border-amber-200'
                      : 'bg-blue-100 text-blue-800 border border-blue-200'
                  }`}>
                    {notice.category}
                  </span>

                  {notice.isUnread && (
                    <span className="w-2 h-2 rounded-full bg-purple-600"></span>
                  )}
                </div>

                <span className="text-[11px] font-mono text-slate-500">
                  {notice.date}
                </span>
              </div>

              <h4 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                {notice.title}
              </h4>

              <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                {notice.summary}
              </p>

              <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-slate-200/50 text-[11px] text-slate-500">
                <span className="font-medium truncate">
                  {notice.author} • {notice.role}
                </span>
                <span className="text-blue-600 font-bold flex items-center gap-0.5 shrink-0 group-hover:translate-x-0.5 transition-transform">
                  Ler aviso <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal for full notice reading */}
      {selectedNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-purple-500/30 text-purple-300 border border-purple-500/40">
                  {selectedNotice.category}
                </span>
                <span className="text-xs text-slate-400 font-mono">{selectedNotice.date}</span>
              </div>

              <button
                onClick={() => setSelectedNotice(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto flex-1 space-y-4">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                {selectedNotice.title}
              </h2>

              <div className="flex items-center gap-2 text-xs text-slate-600 pb-3 border-b border-slate-100">
                <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-700">
                  {selectedNotice.author[0]}
                </div>
                <div>
                  <div className="font-bold text-slate-800">{selectedNotice.author}</div>
                  <div className="text-[11px] text-slate-500">{selectedNotice.role}</div>
                </div>
              </div>

              <div className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line bg-slate-50 p-4 rounded-2xl border border-slate-200/70">
                {selectedNotice.fullContent}
              </div>

              {selectedNotice.attachmentName && (
                <div className="flex items-center justify-between p-3 rounded-xl bg-blue-50 border border-blue-200">
                  <div className="flex items-center gap-2 text-xs font-semibold text-blue-950">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span>{selectedNotice.attachmentName}</span>
                  </div>
                  <button 
                    onClick={() => alert(`Download simulado do arquivo: ${selectedNotice.attachmentName}`)}
                    className="px-2.5 py-1 rounded-lg bg-blue-600 text-white text-xs font-bold flex items-center gap-1 hover:bg-blue-700 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" /> Baixar
                  </button>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <CheckCircle2 className={`w-4 h-4 ${canMarkAsRead ? 'text-emerald-600' : 'text-amber-600'}`} />
                {canMarkAsRead ? 'Leitura registrada no app' : 'Reconecte-se para registrar a leitura'}
              </span>
              <button
                onClick={() => setSelectedNotice(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors"
              >
                Fechar Comunicado
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
