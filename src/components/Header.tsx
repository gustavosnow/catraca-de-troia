import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Zap, 
  Smartphone, 
  Megaphone, 
  Users, 
  Activity, 
  SlidersHorizontal, 
  FileText, 
  School,
  Volume2, 
  VolumeX, 
  Clock, 
  ChevronDown,
  UserCheck,
  BadgeCheck,
  LogOut,
  ShieldCheck,
  Radio,
  X
} from 'lucide-react';
import { AuthUser } from '../types';
import { soundManager } from '../utils/sound';
import { CatracaTroiaLogo } from './CatracaTroiaLogo';

interface HeaderProps {
  isSimulating: boolean;
  onToggleSimulation: () => void;
  onTriggerManualTap: () => void;
  onOpenManualRelease: () => void;
  onOpenProjectDocs?: () => void;
  activeTab: 'catracas' | 'avisos' | 'alunos' | 'justificativas';
  onSelectTab: (tab: 'catracas' | 'avisos' | 'alunos' | 'justificativas') => void;
  noticesCount: number;
  pendingJustificationsCount: number;
  onSwitchToParentApp: () => void;
  currentStaffUser?: AuthUser;
  onOpenAuthModal?: (mode?: 'login' | 'register', role?: 'parent' | 'staff') => void;
}

export const Header: React.FC<HeaderProps> = ({
  isSimulating,
  onToggleSimulation,
  onTriggerManualTap,
  onOpenManualRelease,
  onOpenProjectDocs,
  activeTab,
  onSelectTab,
  noticesCount,
  pendingJustificationsCount,
  onSwitchToParentApp,
  currentStaffUser,
  onOpenAuthModal,
}) => {

  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');
  const [soundOn, setSoundOn] = useState<boolean>(true);
  const [showToolsMenu, setShowToolsMenu] = useState<boolean>(false);
  const [showProfileMenu, setShowProfileMenu] = useState<boolean>(false);

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      
      const formattedDate = now.toLocaleDateString('pt-BR', { 
        weekday: 'short', 
        day: '2-digit', 
        month: 'short'
      });
      setCurrentDate(formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1));
    };

    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    soundManager.setEnabled(next);
  };

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2 sm:gap-4">
          
          {/* 1. Left: Brand & School Identification */}
          <div className="flex items-center space-x-2.5 sm:space-x-3 shrink-0 min-w-0">
            <CatracaTroiaLogo 
              size={38} 
              variant="dark" 
              showText={false}
              className="cursor-pointer"
            />

            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h1 className="text-sm sm:text-base font-extrabold text-white tracking-tight leading-none truncate">
                  Catraca de Tróia
                </h1>
                <span className="px-1.5 py-0.5 text-[9px] sm:text-[10px] font-extrabold bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded shrink-0">
                  EMEF
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-400 hidden sm:flex items-center gap-1 mt-0.5 leading-none truncate">
                <School className="w-3 h-3 text-orange-400 inline shrink-0" />
                <span className="truncate">EMEF Profª. Cecília Meireles • Rede Pública</span>
              </p>
            </div>
          </div>

          {/* 2. Center: Navigation Tabs */}
          <nav className="flex items-center p-1 bg-slate-800/90 rounded-xl border border-slate-700/80 shrink-0">
            <button
              id="nav-tab-catracas"
              onClick={() => onSelectTab('catracas')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'catracas'
                  ? 'bg-orange-600 text-white shadow-sm font-bold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Activity className={`w-3.5 h-3.5 ${activeTab === 'catracas' ? 'text-white' : 'text-orange-400'}`} />
              <span className="hidden md:inline">Portaria & Catracas</span>
              <span className="md:hidden">Catracas</span>
            </button>

            <button
              id="nav-tab-avisos"
              onClick={() => onSelectTab('avisos')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer relative ${
                activeTab === 'avisos'
                  ? 'bg-orange-600 text-white shadow-sm font-bold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Megaphone className={`w-3.5 h-3.5 ${activeTab === 'avisos' ? 'text-white' : 'text-slate-400'}`} />
              <span>Comunicados</span>
              {noticesCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-orange-500 text-white text-[10px] font-bold">
                  {noticesCount}
                </span>
              )}
            </button>

            <button
              id="nav-tab-alunos"
              onClick={() => onSelectTab('alunos')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'alunos'
                  ? 'bg-orange-600 text-white shadow-sm font-bold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Users className={`w-3.5 h-3.5 ${activeTab === 'alunos' ? 'text-white' : 'text-slate-400'}`} />
              <span className="hidden md:inline">Estudantes (1º ao 9º)</span>
              <span className="md:hidden">Alunos</span>
            </button>

            <button
              id="nav-tab-justificativas"
              onClick={() => onSelectTab('justificativas')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer relative ${
                activeTab === 'justificativas'
                  ? 'bg-orange-600 text-white shadow-sm font-bold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <FileText className={`w-3.5 h-3.5 ${activeTab === 'justificativas' ? 'text-white' : 'text-slate-400'}`} />
              <span className="hidden lg:inline">Justificativas</span>
              <span className="lg:hidden">Faltas</span>
              {pendingJustificationsCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-slate-950 text-[10px] font-bold">
                  {pendingJustificationsCount}
                </span>
              )}
            </button>
          </nav>

          {/* 3. Right: Simulation Controls & User Menus */}
          <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
            
            {/* Live simulation toggle */}
            <button
              onClick={onToggleSimulation}
              title={isSimulating ? 'Pausar fluxo de simulação' : 'Retomar fluxo automático'}
              className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                isSimulating
                  ? 'bg-emerald-950/60 text-emerald-300 border-emerald-700/80 hover:bg-emerald-900/60'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isSimulating ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`}></span>
              <span>{isSimulating ? 'Ao Vivo' : 'Pausado'}</span>
            </button>

            {/* Quick Simulate Entry Button */}
            <button
              onClick={onTriggerManualTap}
              title="Simular passagem de estudante na catraca"
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-orange-200 bg-orange-600/30 hover:bg-orange-600/40 border border-orange-500/50 rounded-lg transition-colors cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 text-orange-400" />
              <span>Simular Entrada</span>
            </button>

            {/* Digital Clock */}
            <div className="hidden xl:flex items-center gap-1.5 text-slate-300 bg-slate-800 px-2.5 py-1.5 rounded-lg border border-slate-700 font-mono text-xs">
              <Clock className="w-3.5 h-3.5 text-orange-400" />
              <span className="font-semibold text-white">{currentTime || '07:30:00'}</span>
            </div>

            {/* Sound toggle button */}
            <button
              onClick={toggleSound}
              title={soundOn ? 'Desativar som de bipe' : 'Ativar som de bipe'}
              className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer border border-slate-700"
            >
              {soundOn ? (
                <Volume2 className="w-4 h-4 text-orange-400" />
              ) : (
                <VolumeX className="w-4 h-4 text-slate-500" />
              )}
            </button>

            {/* Tools Menu with Backdrop */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowToolsMenu(!showToolsMenu);
                  setShowProfileMenu(false);
                }}
                title="Ferramentas e Integrações"
                className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                  showToolsMenu 
                    ? 'bg-slate-800 text-orange-400 border-orange-500/50' 
                    : 'text-slate-300 hover:text-white hover:bg-slate-800 border-slate-700'
                }`}
              >
                <SlidersHorizontal className="w-4 h-4" />
              </button>

              {/* Backdrop */}
              {showToolsMenu && (
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowToolsMenu(false)}
                />
              )}

              {showToolsMenu && (
                <div 
                  className="absolute right-0 mt-2 w-72 bg-slate-900 rounded-2xl shadow-2xl border border-slate-700 py-2 z-50 animate-in fade-in zoom-in-95 duration-150"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="px-4 py-2 border-b border-slate-800 flex items-center justify-between">
                    <span className="text-[11px] font-bold text-orange-400 uppercase tracking-wider">
                      Governança & Portaria EMEF
                    </span>
                    <button 
                      onClick={() => setShowToolsMenu(false)}
                      className="text-slate-400 hover:text-white p-0.5"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="p-1.5 space-y-1">
                    {onOpenProjectDocs && (
                      <button
                        onClick={() => {
                          onOpenProjectDocs();
                          setShowToolsMenu(false);
                        }}
                        className="w-full px-3 py-2.5 text-left text-xs rounded-xl text-slate-200 hover:bg-slate-800 hover:text-white flex items-center gap-3 cursor-pointer transition-colors"
                      >
                        <div className="w-8 h-8 rounded-lg bg-orange-500/20 text-orange-400 flex items-center justify-center shrink-0 border border-orange-500/30">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-bold text-white">Documentos do Projeto</div>
                          <div className="text-[10px] text-slate-400">SMART, KPIs, Orçamento R$ 291k & Equipe</div>
                        </div>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        onOpenManualRelease();
                        setShowToolsMenu(false);
                      }}
                      className="w-full px-3 py-2.5 text-left text-xs rounded-xl text-slate-200 hover:bg-slate-800 hover:text-white flex items-center gap-3 cursor-pointer transition-colors"
                    >
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-white">Liberação Manual na Portaria</div>
                        <div className="text-[10px] text-slate-400">Registro com operador e justificativa</div>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        onTriggerManualTap();
                        setShowToolsMenu(false);
                      }}
                      className="w-full px-3 py-2.5 text-left text-xs rounded-xl text-slate-200 hover:bg-slate-800 hover:text-white flex items-center gap-3 cursor-pointer transition-colors sm:hidden"
                    >
                      <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
                        <Zap className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-white">Simular Entrada de Estudante</div>
                        <div className="text-[10px] text-slate-400">Disparo de passagem instantânea</div>
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Operator Profile Dropdown with Backdrop & Rich Rendering */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowProfileMenu(!showProfileMenu);
                  setShowToolsMenu(false);
                }}
                className={`flex items-center gap-1.5 p-1 rounded-xl transition-colors cursor-pointer border ${
                  showProfileMenu 
                    ? 'bg-slate-800 border-orange-500/50 ring-1 ring-orange-500/30' 
                    : 'border-transparent hover:bg-slate-800'
                }`}
                title="Perfil do Operador da Portaria"
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-600 to-amber-600 border border-orange-400/40 flex items-center justify-center text-white font-extrabold text-xs shadow-sm">
                  {currentStaffUser?.name ? currentStaffUser.name.split(' ').map(n => n[0]).slice(0, 2).join('') : 'CM'}
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${showProfileMenu ? 'rotate-180 text-orange-400' : ''} hidden sm:block`} />
              </button>

              {/* Backdrop */}
              {showProfileMenu && (
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowProfileMenu(false)}
                />
              )}

              {showProfileMenu && (
                <div 
                  className="absolute right-0 mt-2 w-80 bg-slate-900 rounded-2xl shadow-2xl border border-slate-700 py-3 z-50 animate-in fade-in zoom-in-95 duration-150"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Top user header */}
                  <div className="px-4 pb-3 border-b border-slate-800 flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-orange-600 text-white flex items-center justify-center font-black text-sm shadow-md ring-2 ring-orange-400/30">
                        {currentStaffUser?.name ? currentStaffUser.name.split(' ').map(n => n[0]).slice(0, 2).join('') : 'CM'}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-sm font-bold text-white">{currentStaffUser?.name || 'Carlos Mendes'}</h4>
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Online"></span>
                        </div>
                        <p className="text-xs text-orange-400 font-medium">{currentStaffUser?.staffRole || 'Inspetor & Operador de Portaria'}</p>
                        <p className="text-[11px] text-slate-400">Reg. Funcional: {currentStaffUser?.functionalRegistry || 'MAT-2026/0481'}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setShowProfileMenu(false)}
                      className="text-slate-400 hover:text-white p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* School unit & shift details */}
                  <div className="px-4 py-3 space-y-2 bg-slate-950/40 text-xs border-b border-slate-800">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Unidade Escolar:</span>
                      <span className="font-semibold text-slate-200 text-right">EMEF Profª. Cecília Meireles</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Código INEP:</span>
                      <span className="font-mono text-slate-300">#35019284</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Turno Ativo:</span>
                      <span className="font-semibold text-amber-300">Manhã (06:30 - 13:00)</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Catracas Gerenciadas:</span>
                      <span className="font-semibold text-emerald-400">2 Unidades Online</span>
                    </div>
                  </div>

                  {/* Status & actions */}
                  <div className="p-2 space-y-1.5">
                    <div className="px-3 py-2 rounded-xl bg-emerald-950/50 border border-emerald-800/40 flex items-center justify-between text-xs text-emerald-300">
                      <div className="flex items-center gap-1.5">
                        <BadgeCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span className="font-semibold">Sessão Autenticada</span>
                      </div>
                      <span className="text-[10px] text-emerald-400 font-mono">Meta: disponibilidade ≥ 99%</span>
                    </div>

                    {onOpenAuthModal && (
                      <div className="pt-1 space-y-1 border-t border-slate-800">
                        <button
                          onClick={() => {
                            setShowProfileMenu(false);
                            onOpenAuthModal('register', 'staff');
                          }}
                          className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-orange-300 hover:bg-orange-600/20 flex items-center gap-2 cursor-pointer transition-colors"
                        >
                          <span className="w-4 h-4 rounded-full bg-orange-600 text-white flex items-center justify-center text-[10px] font-black">+</span>
                          <span>Cadastrar Novo Membro da Equipe</span>
                        </button>
                        <button
                          onClick={() => {
                            setShowProfileMenu(false);
                            onOpenAuthModal('login', 'staff');
                          }}
                          className="w-full text-left px-3 py-2 rounded-xl text-xs text-slate-300 hover:bg-slate-800 flex items-center gap-2 cursor-pointer transition-colors"
                        >
                          <UserCheck className="w-4 h-4 text-slate-400" />
                          <span>Trocar Usuário / Fazer Login</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Switch to Parent App (Primary CTA) */}
            <button
              id="btn-switch-to-parent-app"
              onClick={onSwitchToParentApp}
              className="ml-1 px-3 py-1.5 rounded-lg bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition-all active:scale-95 cursor-pointer shrink-0"
              title="Abrir o aplicativo móvel dos pais e responsáveis"
            >
              <Smartphone className="w-3.5 h-3.5 text-white" />
              <span className="hidden sm:inline">App dos Pais</span>
            </button>

          </div>

        </div>
      </div>
    </header>
  );
};
