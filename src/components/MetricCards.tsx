import React from 'react';
import { 
  Users, 
  UserCheck, 
  Activity, 
  AlertTriangle, 
  TrendingUp, 
  ArrowUpRight, 
  ShieldAlert,
  Clock,
  CheckCircle2
} from 'lucide-react';

interface MetricCardsProps {
  totalStudents: number;
  entriesToday: number;
  presencePercentage: number;
  alertsCount: number;
  onOpenAlerts: () => void;
  onFilterStatus?: (status: string) => void;
}

export const MetricCards: React.FC<MetricCardsProps> = ({
  totalStudents,
  entriesToday,
  presencePercentage,
  alertsCount,
  onOpenAlerts,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      
      {/* 1. Total de Alunos Cadastrados */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:border-slate-300 transition-all group">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Total Cadastrados
          </span>
          <div className="w-10 h-10 rounded-xl bg-slate-100 group-hover:bg-blue-50 text-slate-700 group-hover:text-blue-600 flex items-center justify-center transition-colors">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {totalStudents.toLocaleString('pt-BR')}
          </span>
          <span className="text-xs font-bold text-slate-400">
            estudantes
          </span>
        </div>

        <div className="mt-3 flex items-center gap-1.5 text-xs text-emerald-700 font-semibold">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-bold">
            <CheckCircle2 className="w-3 h-3" /> 100% ativos
          </span>
          <span className="text-slate-300">•</span>
          <span className="text-slate-600 font-medium">3 turnos regulares</span>
        </div>
      </div>

      {/* 2. Entradas Registradas Hoje */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:border-orange-300 transition-all group">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Entradas Hoje
          </span>
          <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center transition-colors group-hover:bg-orange-100">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {entriesToday.toLocaleString('pt-BR')}
          </span>
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md flex items-center">
            <TrendingUp className="w-3.5 h-3.5 mr-0.5" />
            +8.4%
          </span>
        </div>

        <div className="mt-3 flex items-center justify-between text-xs text-slate-600 font-medium">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            Pico: 07:15 - 07:45
          </span>
          <span className="font-bold text-slate-800">70 c/ tolerância</span>
        </div>
      </div>

      {/* 3. Presença em Tempo Real (% da capacidade) */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:border-sky-300 transition-all group">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Presença no Campus
          </span>
          <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center transition-colors group-hover:bg-sky-100">
            <Activity className="w-5 h-5" />
          </div>
        </div>

        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {presencePercentage.toFixed(1)}%
          </span>
          <span className="text-xs font-semibold text-slate-500">
            da capacidade total
          </span>
        </div>

        {/* Visual Progress Bar */}
        <div className="mt-3">
          <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden border border-slate-200/60">
            <div 
              className="bg-gradient-to-r from-sky-500 to-blue-600 h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(presencePercentage, 100)}%` }}
            ></div>
          </div>
          <div className="mt-1.5 flex justify-between text-[11px] text-slate-600 font-semibold">
            <span>{entriesToday} no campus</span>
            <span className="text-slate-400">{Math.max(0, totalStudents - entriesToday)} ausentes</span>
          </div>
        </div>
      </div>

      {/* 4. Alertas & Inconsistências */}
      <div 
        onClick={onOpenAlerts}
        className={`rounded-2xl p-5 border shadow-sm transition-all cursor-pointer group ${
          alertsCount > 0 
            ? 'bg-amber-50/50 border-amber-300 hover:bg-amber-50 hover:border-amber-400 ring-1 ring-amber-400/20' 
            : 'bg-white border-slate-200 hover:border-slate-300'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
            Alertas & Tolerâncias
            {alertsCount > 0 && (
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
            )}
          </span>
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center transition-colors group-hover:scale-105">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="mt-3 flex items-baseline justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-amber-900 tracking-tight">
              {alertsCount}
            </span>
            <span className="text-xs font-bold text-amber-800">
              ocorrências ativas
            </span>
          </div>
          <span className="text-xs font-bold text-amber-800 underline underline-offset-2 flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
            Ver detalhes
            <ArrowUpRight className="w-3.5 h-3.5" />
          </span>
        </div>

        <div className="mt-3 text-xs text-amber-900 font-semibold flex items-center gap-1.5 truncate">
          <ShieldAlert className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span className="truncate">Tolerâncias e registros de segurança</span>
        </div>
      </div>

    </div>
  );
};
