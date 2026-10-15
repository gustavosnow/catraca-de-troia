import React, { useState } from 'react';
import { 
  Bell, 
  QrCode, 
  ChevronDown, 
  School, 
  Check, 
  CalendarDays,
  Megaphone,
  UserCheck,
  LogOut,
} from 'lucide-react';
import { Student } from '../../types';
import { ParentAccount } from '../../data/mockData';
import { CatracaTroiaLogo } from '../CatracaTroiaLogo';

interface ParentHeaderProps {
  currentGuardian: ParentAccount;
  allGuardians: ParentAccount[];
  onSelectGuardian: (guardian: ParentAccount) => void;
  myChildren: Student[];
  selectedStudent: Student;
  onSelectStudent: (student: Student) => void;
  unreadNotificationsCount: number;
  onOpenNotifications: () => void;
  onOpenDigitalBadge: () => void;
  activeTab: 'home' | 'history' | 'notices';
  onLogout?: () => void;
}

export const ParentHeader: React.FC<ParentHeaderProps> = ({
  currentGuardian,
  allGuardians,
  onSelectGuardian,
  myChildren,
  selectedStudent,
  onSelectStudent,
  unreadNotificationsCount,
  onOpenNotifications,
  onOpenDigitalBadge,
  activeTab,
  onLogout,
}) => {

  const [guardianDropdownOpen, setGuardianDropdownOpen] = useState(false);
  const [childDropdownOpen, setChildDropdownOpen] = useState(false);

  return (
    <header className="bg-[#0B192C] text-white pt-4 pb-3 px-4 sm:px-5 relative shadow-xl border-b border-slate-800/90">
      {/* Background glow ambient effects */}
      <div className="absolute top-0 right-0 w-64 h-28 bg-orange-600/10 pointer-events-none rounded-full blur-3xl" />
      <div className="absolute top-0 left-0 w-36 h-28 bg-blue-600/10 pointer-events-none rounded-full blur-2xl" />

      <div className="relative z-10 space-y-3.5 max-w-2xl mx-auto">
        
        {/* 1. Header Superior: Identidade Oficial da Escola + Ações Rápidas */}
        <div className="flex items-center justify-between gap-3">
          
          {/* Logo e Nome da Escola com visualização garantida sem truncagem */}
          <div className="flex items-center gap-3 min-w-0">
            <CatracaTroiaLogo size={40} variant="dark" showText={false} />
            
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h1 className="text-sm sm:text-base font-extrabold text-white tracking-tight flex items-center gap-1.5">
                  <School className="w-4 h-4 text-orange-400 shrink-0" />
                  <span>EMEF Profª. Cecília Meireles</span>
                </h1>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-orange-500/20 text-orange-300 border border-orange-500/30 shrink-0">
                  Rede Pública
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                Portal dos Pais & Responsáveis • Catraca de Tróia
              </p>
            </div>
          </div>

          {/* Botões de Ação Rápida (Carteirinha e Central de Avisos) */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Carteirinha Digital do Aluno (apenas se houver aluno selecionado) */}
            {activeTab !== 'notices' && (
              <button
                id="btn-parent-digital-badge"
                onClick={onOpenDigitalBadge}
                className="px-2.5 py-1.5 rounded-xl bg-orange-600/25 hover:bg-orange-600/40 text-orange-200 border border-orange-500/40 transition-all hover:scale-105 active:scale-95 shadow-sm flex items-center gap-1.5 cursor-pointer font-bold text-xs"
                title="Abrir Carteirinha Digital do Estudante"
              >
                <QrCode className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                <span className="hidden sm:inline">Carteirinha</span>
              </button>
            )}

            {/* Sino de Notificações / Avisos */}
            <button
              id="btn-parent-notifications"
              onClick={onOpenNotifications}
              className="relative p-2 sm:px-2.5 sm:py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all hover:scale-105 active:scale-95 shadow-sm flex items-center gap-1.5 cursor-pointer font-semibold text-xs"
              title="Notificações e Avisos"
            >
              <Bell className="w-3.5 h-3.5 text-orange-400 shrink-0" />
              <span className="hidden sm:inline">Avisos</span>
              {unreadNotificationsCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-extrabold rounded-full flex items-center justify-center border-2 border-[#0B192C] animate-pulse">
                  {unreadNotificationsCount}
                </span>
              )}
            </button>
          </div>

        </div>

        {/* ------------------------------------------------------------- */}
        {/* 2. CONTEÚDO CONTEXTUAL DO CABEÇALHO CONFORME A ABA ATIVA      */}
        {/* ------------------------------------------------------------- */}
        
        {/* CASO A: ABA AVISOS (Sem nenhum card ou seletor de filho) */}
        {activeTab === 'notices' && (
          <div className="bg-slate-800/60 rounded-xl p-2.5 sm:p-3 border border-slate-700/60 flex items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-orange-500/20 text-orange-400 flex items-center justify-center shrink-0 border border-orange-500/30">
                <Megaphone className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h2 className="text-xs sm:text-sm font-extrabold text-white leading-tight">
                  Canal de Avisos & Comunicados da Direção
                </h2>
                <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                  Informes gerais e convocações oficiais para a comunidade escolar
                </p>
              </div>
            </div>
          </div>
        )}

        {/* CASO B: ABA HISTÓRICO SEMANAL (Apenas seletor sutil se houver múltiplos filhos) */}
        {activeTab === 'history' && (
          <div className="bg-slate-800/60 rounded-xl p-2.5 border border-slate-700/60 flex items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-orange-500/20 text-orange-400 flex items-center justify-center shrink-0 border border-orange-500/30">
                <CalendarDays className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h2 className="text-xs sm:text-sm font-extrabold text-white leading-tight">
                  Histórico Semanal de Acesso
                </h2>
                <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                  Registro de presenças e pontualidade de <span className="text-orange-300 font-bold">{selectedStudent.name.split(' ')[0]}</span>
                </p>
              </div>
            </div>

            {/* Alternador compacto de aluno para a semana (somente se tiver > 1 filho) */}
            {myChildren.length > 1 && (
              <div className="relative shrink-0">
                <button
                  onClick={() => setChildDropdownOpen(!childDropdownOpen)}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-bold flex items-center gap-2 transition-colors border border-slate-600 cursor-pointer shadow-xs"
                >
                  <img
                    src={selectedStudent.avatar}
                    alt={selectedStudent.name}
                    className="w-4 h-4 rounded-full object-cover"
                  />
                  <span className="truncate max-w-[90px] sm:max-w-none">{selectedStudent.name.split(' ')[0]}</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                {childDropdownOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setChildDropdownOpen(false)}
                    />
                    <div className="absolute right-0 mt-1.5 w-60 bg-slate-900 rounded-xl shadow-2xl border border-slate-700 p-1.5 z-50 animate-in fade-in zoom-in-95">
                      <div className="px-2 py-1 text-[10px] font-bold text-orange-400 uppercase tracking-wider border-b border-slate-800 mb-1">
                        Ver histórico de:
                      </div>
                      {myChildren.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => {
                            onSelectStudent(c);
                            setChildDropdownOpen(false);
                          }}
                          className={`w-full text-left p-2 rounded-lg text-xs flex items-center justify-between transition-colors cursor-pointer ${
                            c.id === selectedStudent.id ? 'bg-orange-600/20 text-orange-300 font-bold' : 'text-slate-200 hover:bg-slate-800'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <img src={c.avatar} alt={c.name} className="w-5 h-5 rounded-full object-cover shrink-0" />
                            <span className="truncate">{c.name}</span>
                          </div>
                          {c.id === selectedStudent.id && <Check className="w-3.5 h-3.5 text-orange-400 shrink-0" />}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* CASO C: ABA PRESENÇA / INÍCIO (Onde faz sentido escolher e ver o card do filho) */}
        {activeTab === 'home' && (
          <div className="space-y-2.5 animate-in fade-in">
            
            {/* Linha do Responsável & Troca de Conta */}
            <div className="flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-6 h-6 rounded-full bg-orange-500/20 text-orange-400 font-bold text-xs flex items-center justify-center shrink-0 border border-orange-500/30">
                  {currentGuardian.name.charAt(0)}
                </div>
                <span className="font-extrabold text-white truncate">
                  Olá, {currentGuardian.name.split(' ')[0]} 👋
                </span>
                <span className="text-slate-500 hidden sm:inline">•</span>
                <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
                  {currentGuardian.phone}
                </span>
              </div>

              {/* Seletor de Responsável */}
              <div className="relative shrink-0">
                <button
                  onClick={() => setGuardianDropdownOpen(!guardianDropdownOpen)}
                  className="text-[11px] text-orange-400 hover:text-orange-300 font-semibold flex items-center gap-1 cursor-pointer py-0.5"
                  title="Abrir opções da conta"
                >
                  <UserCheck className="w-3 h-3 text-orange-400" />
                  <span>Minha conta</span>
                  <ChevronDown className="w-3 h-3" />
                </button>

                {guardianDropdownOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setGuardianDropdownOpen(false)}
                    />
                    <div className="absolute right-0 mt-1.5 w-64 bg-slate-900 rounded-2xl shadow-2xl border border-slate-700 p-2 z-50 animate-in fade-in zoom-in-95">
                      <div className="px-3 py-1.5 text-[10px] font-bold text-orange-400 uppercase tracking-wider border-b border-slate-800 flex items-center justify-between">
                        <span>Responsáveis Cadastrados</span>
                        <span className="text-[9px] text-slate-500">EMEF</span>
                      </div>
                      <div className="mt-1 space-y-1">
                        {allGuardians.map((g) => {
                          const isSelected = g.id === currentGuardian.id;
                          return (
                            <button
                              key={g.id}
                              onClick={() => {
                                onSelectGuardian(g);
                                setGuardianDropdownOpen(false);
                              }}
                              className={`w-full text-left px-2.5 py-2 rounded-xl text-xs flex items-center justify-between transition-colors cursor-pointer ${
                                isSelected 
                                  ? 'bg-orange-600/25 text-orange-200 font-bold border border-orange-500/40' 
                                  : 'text-slate-200 hover:bg-slate-800'
                              }`}
                            >
                              <div className="min-w-0">
                                <div className="font-bold text-white truncate">{g.name}</div>
                                <div className="text-[10px] text-slate-400 font-mono">
                                  {g.phone} ({g.childrenIds.length} {g.childrenIds.length === 1 ? 'filho' : 'filhos'})
                                </div>
                              </div>
                              {isSelected && <Check className="w-3.5 h-3.5 text-orange-400 shrink-0" />}
                            </button>
                          );
                        })}
                      </div>

                      {onLogout && (
                        <button
                          onClick={() => {
                            setGuardianDropdownOpen(false);
                            onLogout();
                          }}
                          className="mt-1 w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-red-300 hover:bg-red-950/40 flex items-center gap-2 cursor-pointer transition-colors"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Encerrar ou trocar conta</span>
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Chips de Seleção de Filhos Conectados */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {myChildren.map((child) => {
                const isSelected = child.id === selectedStudent.id;
                return (
                  <button
                    key={child.id}
                    onClick={() => onSelectStudent(child)}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2.5 text-left ${
                      isSelected
                        ? 'bg-slate-800/95 border-orange-500/80 shadow-md ring-1 ring-orange-500/40'
                        : 'bg-slate-800/40 hover:bg-slate-800/70 border-slate-700/60 opacity-80 hover:opacity-100'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="relative shrink-0">
                        <img
                          src={child.avatar}
                          alt={child.name}
                          className={`w-9 h-9 rounded-lg object-cover ring-2 ${
                            isSelected ? 'ring-orange-500' : 'ring-slate-700'
                          }`}
                          referrerPolicy="no-referrer"
                        />
                        <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#0B192C]"></span>
                      </div>
                      <div className="min-w-0">
                        <h3 className={`text-xs font-extrabold truncate ${
                          isSelected ? 'text-white' : 'text-slate-300'
                        }`}>
                          {child.name}
                        </h3>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-0.5">
                          <span className="font-bold text-orange-400">{child.turma}</span>
                          <span>•</span>
                          <span className="font-mono">#{child.matricula}</span>
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0">
                      {isSelected ? (
                        <span className="w-6 h-6 rounded-full bg-orange-600 text-white flex items-center justify-center shadow-xs">
                          <Check className="w-3.5 h-3.5" />
                        </span>
                      ) : (
                        <span className="w-6 h-6 rounded-full border-2 border-slate-700/70 block" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

          </div>
        )}

      </div>
    </header>
  );
};
