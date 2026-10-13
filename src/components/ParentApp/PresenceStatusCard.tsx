import React from 'react';
import { 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Sparkles, 
  BellRing, 
  ChevronRight,
  ShieldCheck,
  Building2,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { DayTimelineEvent } from '../../types';

interface PresenceStatusCardProps {
  studentName: string;
  isAtSchool: boolean;
  entryTime: string;
  turnstileName: string;
  timeline: DayTimelineEvent[];
  onSimulateNewPass?: () => void;
  onViewTimelineDetails?: (event: DayTimelineEvent) => void;
}

export const PresenceStatusCard: React.FC<PresenceStatusCardProps> = ({
  studentName,
  isAtSchool,
  entryTime,
  turnstileName,
  timeline,
  onSimulateNewPass,
  onViewTimelineDetails,
}) => {
  const firstName = studentName.split(' ')[0];

  return (
    <section className="space-y-4">
      {/* Primary Hero Status Card */}
      <div 
        id="card-current-presence" 
        className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm relative overflow-hidden transition-all hover:shadow-md"
      >
        {/* Glow accent */}
        <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-20 pointer-events-none ${
          isAtSchool ? 'bg-emerald-500' : 'bg-amber-500'
        }`} />

        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                {isAtSchool ? (
                  <>
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                  </>
                ) : (
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-slate-400"></span>
                )}
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Status de Acesso Hoje
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 flex items-center gap-2">
              {isAtSchool ? (
                <>
                  <span className="text-emerald-700">Na Escola</span>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 inline-flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Presença Confirmada
                  </span>
                </>
              ) : (
                <span className="text-slate-700">Fora do Campus</span>
              )}
            </h2>
          </div>

          <div className="text-right">
            <div className="text-[11px] text-slate-500 font-medium">Turno Regular</div>
            <div className="text-xs font-bold text-slate-800 bg-slate-100 px-2 py-1 rounded-lg border border-slate-200 inline-block mt-0.5">
              Manhã (07:15 - 12:45)
            </div>
          </div>
        </div>

        {/* Highlight Banner with exact entry info */}
        <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50/60 rounded-xl p-3.5 border border-emerald-200/80 mb-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-sm shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-emerald-800 font-medium">
                  Entrada registrada com pontualidade
                </div>
                <div className="text-sm font-bold text-emerald-950 flex items-center gap-1.5">
                  <span>Às {entryTime}</span>
                  <span className="text-emerald-400">•</span>
                  <span className="font-medium text-emerald-800 text-xs">{turnstileName}</span>
                </div>
              </div>
            </div>

            <div className="hidden sm:flex flex-col items-end">
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-white/80 px-2 py-0.5 rounded-md border border-emerald-200">
                <BellRing className="w-3 h-3 text-emerald-600" /> Notificado no App
              </span>
            </div>
          </div>
        </div>

        {/* Security & Access verification tags */}
        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100 text-xs text-slate-600">
          <div className="flex items-center gap-1.5 py-1">
            <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
            <span className="truncate">Validação: <strong>Biometria Facial</strong></span>
          </div>
          <div className="flex items-center gap-1.5 py-1">
            <Building2 className="w-4 h-4 text-slate-500 shrink-0" />
            <span className="truncate">Local: <strong>Portaria Central</strong></span>
          </div>
        </div>
      </div>

      {/* Daily Timeline Section */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
        <div className="flex items-center justify-between gap-2 mb-4 pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              Linha do Tempo do Dia de {firstName}
            </h3>
          </div>
          <span className="text-[11px] font-medium text-slate-500">
            Atualizado em tempo real
          </span>
        </div>

        {/* Timeline Items */}
        <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
          {timeline.map((event, index) => {
            const isCompleted = event.status === 'completed';
            const isCurrent = event.status === 'current';
            const isUpcoming = event.status === 'upcoming';

            return (
              <div 
                key={event.id}
                onClick={() => onViewTimelineDetails?.(event)}
                className={`relative group cursor-pointer transition-all ${
                  isCurrent ? 'bg-blue-50/70 p-3 rounded-xl border border-blue-200/80 -ml-2' : ''
                }`}
              >
                {/* Node icon */}
                <div 
                  className={`absolute -left-6 top-1 w-5 h-5 rounded-full flex items-center justify-center ring-4 ring-white transition-all ${
                    isCompleted
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : isCurrent
                      ? 'bg-blue-600 text-white animate-pulse'
                      : 'bg-slate-200 text-slate-400'
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-3 h-3" />
                  ) : isCurrent ? (
                    <span className="w-2 h-2 rounded-full bg-white"></span>
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                  )}
                </div>

                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-mono font-bold ${
                        isCompleted ? 'text-slate-800' : isCurrent ? 'text-blue-700' : 'text-slate-500'
                      }`}>
                        {event.time}
                      </span>
                      {isCurrent && (
                        <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded bg-blue-600 text-white">
                          Agora
                        </span>
                      )}
                    </div>

                    <h4 className={`text-xs sm:text-sm font-semibold mt-0.5 ${
                      isCompleted ? 'text-slate-900' : isCurrent ? 'text-blue-950 font-bold' : 'text-slate-500'
                    }`}>
                      {event.title}
                    </h4>

                    <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                      <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                      <span>{event.location}</span>
                    </div>

                    {event.detail && (
                      <p className={`text-[11px] mt-1 line-clamp-2 ${
                        isCurrent ? 'text-blue-800' : 'text-slate-600'
                      }`}>
                        {event.detail}
                      </p>
                    )}
                  </div>

                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600 group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
