import React from 'react';
import { 
  CalendarDays, 
  LogIn, 
  LogOut, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  FileText,
  ShieldCheck,
  ChevronRight,
  Info
} from 'lucide-react';
import { WeeklyAccessDay } from '../../types';

interface WeeklyAccessHistoryProps {
  days: WeeklyAccessDay[];
  onSelectDay?: (day: WeeklyAccessDay) => void;
}

export const WeeklyAccessHistory: React.FC<WeeklyAccessHistoryProps> = ({
  days,
  onSelectDay,
}) => {
  return (
    <section className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <CalendarDays className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              Histórico de Acessos da Semana
            </h3>
            <p className="text-[11px] text-slate-500">
              Eventos persistidos na API local demonstrativa
            </p>
          </div>
        </div>

        <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
          5 Dias Úteis
        </span>
      </div>

      {/* Week Day Cards */}
      <div className="space-y-3">
        {days.map((day, idx) => {
          const isToday = day.dayName.startsWith('Hoje');
          const isInProgress = day.status === 'em_andamento';
          const isJustified = day.status === 'ausente_justificado';
          const isDelay = day.status === 'atraso_tolerado';
          const isNormal = day.status === 'presente';
          const hasNoRecord = day.status === 'sem_registro';

          return (
            <div
              key={idx}
              onClick={() => onSelectDay?.(day)}
              className={`group p-3.5 rounded-xl border transition-all cursor-pointer ${
                isToday
                  ? 'bg-emerald-50/40 border-emerald-300/80 shadow-xs'
                  : 'bg-slate-50/50 hover:bg-slate-100/60 border-slate-200/70'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <div className={`w-9 h-9 rounded-lg flex flex-col items-center justify-center font-bold text-xs ${
                    isToday 
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-white text-slate-700 border border-slate-200'
                  }`}>
                    <span className="text-[9px] uppercase tracking-tighter opacity-80">{day.dayName.split(' ')[0]}</span>
                    <span className="leading-none text-[11px]">{day.shortDate.split('/')[0]}</span>
                  </div>

                  <div>
                    <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <span>{day.fullDate}</span>
                      {isToday && (
                        <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-emerald-600 text-white">
                          Hoje
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                      <span>{day.turnstileUsed}</span>
                      {day.method !== '-' && (
                        <>
                          <span>•</span>
                          <span className="font-medium text-slate-600">{day.method}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Status Badge */}
                <div>
                  {isInProgress && (
                    <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-300 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                      Em Andamento
                    </span>
                  )}
                  {isNormal && (
                    <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Pontual
                    </span>
                  )}
                  {isDelay && (
                    <span className="text-[11px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-amber-600" />
                      Atraso Tolerado
                    </span>
                  )}
                  {isJustified && (
                    <span className="text-[11px] font-semibold text-indigo-800 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200 flex items-center gap-1">
                      <FileText className="w-3 h-3 text-indigo-600" />
                      Falta Justificada
                    </span>
                  )}
                  {hasNoRecord && (
                    <span className="text-[11px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 text-slate-500" />
                      Sem registro
                    </span>
                  )}
                </div>
              </div>

              {/* Time Details Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-200/60 text-xs">
                {/* Entry */}
                <div className="flex items-center gap-1.5 bg-white/70 px-2 py-1.5 rounded-lg border border-slate-200/60">
                  <LogIn className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <div>
                    <div className="text-[10px] text-slate-500">Entrada</div>
                    <div className="font-mono font-bold text-slate-800">
                      {day.entryTime || '—'}
                    </div>
                  </div>
                </div>

                {/* Exit */}
                <div className="flex items-center gap-1.5 bg-white/70 px-2 py-1.5 rounded-lg border border-slate-200/60">
                  <LogOut className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <div>
                    <div className="text-[10px] text-slate-500">Saída</div>
                    <div className="font-mono font-bold text-slate-800">
                      {day.exitTime || '—'}
                    </div>
                  </div>
                </div>

                {/* Duration */}
                <div className="col-span-2 sm:col-span-1 flex items-center gap-1.5 bg-white/70 px-2 py-1.5 rounded-lg border border-slate-200/60">
                  <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <div className="truncate">
                    <div className="text-[10px] text-slate-500">Permanência</div>
                    <div className="font-medium text-slate-700 truncate text-[11px]">
                      {day.durationHours}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Info footer */}
      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-start gap-2">
        <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <p className="text-[11px] leading-relaxed">
          Esta tela consulta a mesma API local do painel escolar, com eventos simulados. O portal não registra alterações offline; a fila do servidor não substitui a integração com catracas físicas nem a homologação de segurança.
        </p>
      </div>
    </section>
  );
};
