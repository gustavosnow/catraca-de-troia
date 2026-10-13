import React, { useState } from 'react';
import { 
  KeyRound, 
  Search, 
  Filter, 
  Cpu, 
  CheckCircle2, 
  RotateCw,
  Clock,
  ArrowRight,
  Shield,
  Zap,
  SlidersHorizontal,
  Wifi
} from 'lucide-react';
import { Shift, Student, Turnstile } from '../types';
import { TURMAS_LIST } from '../data/mockData';

interface SideActionsPanelProps {
  onOpenManualRelease: () => void;
  onSelectStudent: (studentId: string) => void;
  students: Student[];
  turnstiles: Turnstile[];
  selectedTurno: Shift;
  onSelectTurno: (turno: Shift) => void;
  selectedTurma: string;
  onSelectTurma: (turma: string) => void;
  onTriggerManualTap: () => void;
}

export const SideActionsPanel: React.FC<SideActionsPanelProps> = ({
  onOpenManualRelease,
  onSelectStudent,
  students,
  turnstiles,
  selectedTurno,
  onSelectTurno,
  selectedTurma,
  onSelectTurma,
  onTriggerManualTap,
}) => {
  const [studentSearch, setStudentSearch] = useState('');

  // Filter students for instant lookup
  const searchResults = studentSearch.trim() === '' 
    ? [] 
    : students.filter(s => 
        s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
        s.matricula.includes(studentSearch) ||
        s.turma.toLowerCase().includes(studentSearch.toLowerCase())
      ).slice(0, 5);

  return (
    <div className="space-y-5">
      
      {/* 1. Primary Action: Manual Turnstile Release */}
      <div className="bg-gradient-to-br from-[#0B192C] via-[#1E293B] to-[#0F172A] rounded-2xl p-5 text-white shadow-md border border-slate-700/80 relative overflow-hidden group">
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-orange-600/20 rounded-full blur-2xl group-hover:scale-110 transition-transform"></div>
        
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-base tracking-tight text-white">
              Liberação Manual
            </h3>
            <p className="text-orange-300 text-xs font-semibold">
              Portaria e Auditoria de Acesso
            </p>
          </div>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed mt-2.5 mb-4 font-normal">
          Autorize e registre a passagem assistida de aluno sem crachá, visitante institucional ou responsável com notificação e log imediato.
        </p>

        <button
          onClick={onOpenManualRelease}
          className="w-full py-3 px-4 bg-orange-600 hover:bg-orange-500 text-white font-extrabold text-xs tracking-wider uppercase rounded-xl shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer border border-orange-400/30"
        >
          <Shield className="w-4 h-4 text-white" />
          <span>Liberar Catraca Manualmente</span>
        </button>
      </div>

      {/* 2. Instant Student Lookup */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Search className="w-4 h-4 text-orange-600" />
            Busca Rápida de Aluno
          </h3>
          <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
            {students.length} alunos
          </span>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={studentSearch}
            onChange={(e) => setStudentSearch(e.target.value)}
            placeholder="Nome, matrícula ou turma..."
            className="w-full pl-9 pr-8 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium text-slate-800"
          />
          {studentSearch && (
            <button
              onClick={() => setStudentSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
            >
              ✕
            </button>
          )}
        </div>

        {/* Quick Search Results Dropdown */}
        {studentSearch.trim() !== '' && (
          <div className="mt-2.5 divide-y divide-slate-100 border border-slate-200 rounded-xl bg-white overflow-hidden shadow-md animate-in fade-in">
            {searchResults.length === 0 ? (
              <div className="p-3.5 text-center text-xs text-slate-500 font-medium">
                Nenhum estudante encontrado com "{studentSearch}"
              </div>
            ) : (
              searchResults.map((std) => (
                <button
                  key={std.id}
                  onClick={() => {
                    onSelectStudent(std.id);
                    setStudentSearch('');
                  }}
                  className="w-full p-2.5 text-left hover:bg-orange-50/80 transition-colors flex items-center gap-2.5 group cursor-pointer"
                >
                  <img
                    src={std.avatar}
                    alt={std.name}
                    className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-200 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate group-hover:text-orange-600">
                      {std.name}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate font-medium">
                      {std.turma} • <span className="font-mono text-slate-600 font-bold">#{std.matricula}</span>
                    </p>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-orange-600 transition-colors shrink-0" />
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* 3. Shift & Class Filters */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-orange-600" />
            Filtros do Painel
          </h3>
          {(selectedTurno !== 'Todos' || selectedTurma !== 'Todas') && (
            <button
              onClick={() => {
                onSelectTurno('Todos');
                onSelectTurma('Todas');
              }}
              className="text-xs font-bold text-orange-600 hover:text-orange-700 hover:underline cursor-pointer"
            >
              Resetar Filtros
            </button>
          )}
        </div>

        {/* Turno Segmented Control */}
        <div>
          <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
            Turno Escolar
          </label>
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200">
            {(['Todos', 'Manhã', 'Tarde', 'Integral'] as Shift[]).map((turno) => (
              <button
                key={turno}
                onClick={() => onSelectTurno(turno)}
                className={`py-2 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedTurno === turno
                    ? 'bg-white text-orange-600 shadow-xs border border-slate-300'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                {turno}
              </button>
            ))}
          </div>
        </div>

        {/* Turma Select */}
        <div>
          <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
            Turma / Série
          </label>
          <select
            value={selectedTurma}
            onChange={(e) => onSelectTurma(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all cursor-pointer"
          >
            {TURMAS_LIST.map((turma) => (
              <option key={turma} value={turma}>
                {turma === 'Todas' ? 'Todas as Turmas' : turma}
              </option>
            ))}
          </select>
        </div>

      </div>

      {/* 4. Hardware Status (Catracas Físicas Conectadas) */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-3.5">
          <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Cpu className="w-4 h-4 text-orange-600" />
            Catracas Físicas (Hardware)
          </h3>
          <span className="text-xs font-extrabold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
            <Wifi className="w-3 h-3 text-emerald-600" />
            {turnstiles.filter(t => t.status === 'Online').length}/{turnstiles.length} online (simulado)
          </span>
        </div>

        <div className="space-y-2.5">
          {turnstiles.map((catraca) => (
            <div 
              key={catraca.id}
              className="p-3.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 leading-tight">
                    {catraca.name}
                  </h4>
                  <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                    IP: {catraca.ipAddress} • {catraca.location}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs font-extrabold font-mono text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200 inline-block">
                  {catraca.passesToday}
                </span>
                <span className="text-[10px] text-slate-500 block font-bold mt-0.5">
                  giros hoje
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Quick simulate tap trigger */}
        <button
          onClick={onTriggerManualTap}
          className="mt-4 w-full py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer border border-slate-200"
        >
          <RotateCw className="w-3.5 h-3.5 text-orange-600" />
          <span>Simular Sinal de Leitura (Facial / Crachá)</span>
        </button>
      </div>

    </div>
  );
};
