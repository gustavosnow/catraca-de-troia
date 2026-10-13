import { DemoNotice } from '../DemoNotice';
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Smartphone, 
  Monitor, 
  Home, 
  CalendarDays, 
  Megaphone, 
  FileText, 
  QrCode, 
  Bell, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  Sparkles, 
  Send,
  AlertCircle,
  Maximize2,
  Minimize2,
  RefreshCw,
  Wifi,
  Battery,
  Signal,
  Users
} from 'lucide-react';
import { ParentHeader } from './ParentHeader';
import { PresenceStatusCard } from './PresenceStatusCard';
import { WeeklyAccessHistory } from './WeeklyAccessHistory';
import { SchoolNoticesSection } from './SchoolNoticesSection';
import { AbsenceJustificationModal } from './AbsenceJustificationModal';
import { StudentDigitalBadgeModal } from './StudentDigitalBadgeModal';
import { InAppNotificationDrawer } from './InAppNotificationDrawer';
import { 
  Student, 
  DayTimelineEvent, 
  WeeklyAccessDay, 
  SchoolNotice, 
  ParentNotification, 
  AbsenceJustification 
} from '../../types';
import { 
  STUDENTS_DATABASE, 
  PARENT_ACCOUNTS,
  ParentAccount,
  getStudentTimeline,
  getStudentWeeklyAccess,
  INITIAL_SCHOOL_NOTICES, 
  INITIAL_PARENT_NOTIFICATIONS, 
  INITIAL_ABSENCE_JUSTIFICATIONS 
} from '../../data/mockData';

interface ParentAppViewProps {
  onSwitchToManagement?: () => void;
  sharedNotices?: SchoolNotice[];
  onUpdateSharedNotices?: (notices: SchoolNotice[]) => void;
  sharedNotifications?: ParentNotification[];
  onUpdateSharedNotifications?: (notifications: ParentNotification[]) => void;
  guardiansList?: ParentAccount[];
  currentGuardianExternal?: ParentAccount;
  onSelectGuardianExternal?: (guardian: ParentAccount) => void;
  onOpenAuthModal?: (mode?: 'login' | 'register') => void;
  studentsList?: Student[];
}

export const ParentAppView: React.FC<ParentAppViewProps> = ({ 
  onSwitchToManagement,
  sharedNotices,
  onUpdateSharedNotices,
  sharedNotifications,
  onUpdateSharedNotifications,
  guardiansList = PARENT_ACCOUNTS,
  currentGuardianExternal,
  onSelectGuardianExternal,
  onOpenAuthModal,
  studentsList = STUDENTS_DATABASE,
}) => {
  // Current logged in guardian (Default: Claudia Mendes or external)
  const [internalGuardian, setInternalGuardian] = useState<ParentAccount>(guardiansList[0] || PARENT_ACCOUNTS[0]);
  
  const currentGuardian = currentGuardianExternal || internalGuardian;
  const setCurrentGuardian = onSelectGuardianExternal || setInternalGuardian;

  // Derived: Only the children of the current guardian (Strict Parent Scope)
  const myChildren = useMemo(() => {
    return studentsList.filter(s => currentGuardian.childrenIds.includes(s.id));
  }, [currentGuardian, studentsList]);

  // Active selected child among myChildren
  const [selectedStudent, setSelectedStudent] = useState<Student>(myChildren[0] || studentsList[0]);

  useEffect(() => {
    if (myChildren.length > 0 && !myChildren.some(c => c.id === selectedStudent.id)) {
      setSelectedStudent(myChildren[0]);
    }
  }, [myChildren, selectedStudent]);

  // When guardian changes, update selectedStudent to their first child
  const handleSelectGuardian = (guardian: ParentAccount) => {
    setCurrentGuardian(guardian);
    const guardianChildren = studentsList.filter(s => guardian.childrenIds.includes(s.id));
    if (guardianChildren.length > 0) {
      setSelectedStudent(guardianChildren[0]);
    }
  };


  // Dynamic Timeline and Weekly Access tailored to the selected student
  const timeline = useMemo(() => {
    return getStudentTimeline(selectedStudent.id, selectedStudent.name);
  }, [selectedStudent]);

  const weeklyAccess = useMemo(() => {
    return getStudentWeeklyAccess(selectedStudent.id);
  }, [selectedStudent]);

  const [internalNotices, setInternalNotices] = useState<SchoolNotice[]>(INITIAL_SCHOOL_NOTICES);
  const [internalNotifications, setInternalNotifications] = useState<ParentNotification[]>(INITIAL_PARENT_NOTIFICATIONS);
  const [justifications, setJustifications] = useState<AbsenceJustification[]>(INITIAL_ABSENCE_JUSTIFICATIONS);

  const notices = sharedNotices || internalNotices;
  const setNotices = onUpdateSharedNotices || setInternalNotices;

  const allNotifications = sharedNotifications || internalNotifications;
  const setAllNotifications = onUpdateSharedNotifications || setInternalNotifications;

  // STRICT PRIVACY RULE: The guardian ONLY sees notifications of their own children or general school notices!
  const parentNotifications = useMemo(() => {
    const childrenNames = myChildren.map(c => c.name);
    return allNotifications.filter(n => n.studentName === 'Geral' || (n.studentName && childrenNames.includes(n.studentName)));
  }, [allNotifications, myChildren]);

  // Modals & Drawers state
  const [isAbsenceModalOpen, setIsAbsenceModalOpen] = useState(false);
  const [isBadgeModalOpen, setIsBadgeModalOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // View state: 'home' | 'history' | 'notices'
  const [activeTab, setActiveTab] = useState<'home' | 'history' | 'notices'>('home');

  // Device frame mode: 'mobile_frame' | 'full_canvas'
  const [deviceMode, setDeviceMode] = useState<'mobile_frame' | 'full_canvas'>('mobile_frame');

  // Simulated live push notification banner
  const [liveBanner, setLiveBanner] = useState<{ title: string; message: string; time: string } | null>(null);

  const unreadCount = parentNotifications.filter(n => !n.isRead).length;

  // Handler for adding a new absence justification
  const handleAddJustification = (newJust: Omit<AbsenceJustification, 'id' | 'submittedAt' | 'status'>) => {
    const created: AbsenceJustification = {
      ...newJust,
      id: 'abs-' + Date.now(),
      submittedAt: 'Hoje às ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      status: 'Em Análise',
    };
    setJustifications([created, ...justifications]);

    // Add in-app notification for this guardian
    const newNotif: ParentNotification = {
      id: 'pn-' + Date.now(),
      title: 'Justificativa Registrada no App',
      message: `Sua justificativa para ${selectedStudent.name.split(' ')[0]} no dia ${newJust.date} (${newJust.reasonCategory}) foi protocolada.`,
      timestamp: 'Agora',
      type: 'absence',
      studentName: selectedStudent.name,
      turnstile: 'Secretaria Escolar',
      isRead: false,
    };
    setAllNotifications([newNotif, ...allNotifications]);
  };

  const handleMarkNoticeAsRead = (id: string) => {
    setNotices(notices.map(n => n.id === id ? { ...n, isUnread: false } : n));
  };

  const handleMarkAllNotificationsAsRead = () => {
    const childrenNames = myChildren.map(c => c.name);
    setAllNotifications(allNotifications.map(n => {
      if (n.studentName === 'Geral' || (n.studentName && childrenNames.includes(n.studentName))) {
        return { ...n, isRead: true };
      }
      return n;
    }));
  };

  // Simulate instant turnstile pass notification for the currently selected child
  const handleSimulatePassNotification = () => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const turnstileName = selectedStudent.stage === 'Fundamental I' ? 'Catraca 02 (Fundamental I)' : 'Catraca 01 (Portão Principal)';

    const bannerInfo = {
      title: 'Catraca de Tróia: Acesso Liberado',
      message: `${selectedStudent.name.split(' ')[0]} passou na ${turnstileName} via Reconhecimento Facial.`,
      time: timeStr,
    };

    setLiveBanner(bannerInfo);

    const newNotif: ParentNotification = {
      id: 'pn-' + Date.now(),
      title: `Entrada confirmada na ${turnstileName.split(' ')[0]}`,
      message: `${selectedStudent.name} passou na Portaria Central da EMEF via Biometria Facial.`,
      timestamp: `${timeStr} - Agora`,
      type: 'entry',
      studentName: selectedStudent.name,
      turnstile: turnstileName,
      isRead: false,
    };

    setAllNotifications(prev => [newNotif, ...prev]);

    setTimeout(() => {
      setLiveBanner(null);
    }, 5000);
  };

  if (myChildren.length === 0 || !myChildren.some(child => child.id === selectedStudent.id)) {
    return <div className="min-h-screen bg-slate-950 text-white p-6">
      <DemoNotice />
      <h1 className="text-xl font-bold mt-6">Nenhum estudante vinculado</h1>
      <p className="mt-3">Solicite à escola a validação do vínculo antes de consultar registros.</p>
      <button className="mt-4 underline" onClick={() => onOpenAuthModal?.('login')}>Trocar conta de demonstração</button>
    </div>;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-orange-500 selection:text-white">
      <DemoNotice />
      
      {/* Top Navigation / Perspective Bar */}
      <header className="bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-4 py-3 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          
          {/* Logo & Mode indicator */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-orange-600 to-amber-600 flex items-center justify-center shadow-md">
              <Smartphone className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-extrabold text-white tracking-tight">
                  Catraca de Tróia
                </h1>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/30">
                  App dos Pais
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Acesso exclusivo para responsáveis • EMEF Profª. Cecília Meireles
              </p>
            </div>
          </div>

          {/* Quick controls */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Simulate pass notification */}
            <button
              id="btn-simulate-parent-push"
              onClick={handleSimulatePassNotification}
              className="px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-xs"
              title="Simular passagem instantânea na catraca para o filho selecionado"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Simular Entrada de {selectedStudent.name.split(' ')[0]}</span>
            </button>

            {/* Frame mode switch */}
            <div className="bg-slate-800 p-0.5 rounded-xl border border-slate-700 flex items-center text-xs">
              <button
                id="btn-mode-mobile-frame"
                onClick={() => setDeviceMode('mobile_frame')}
                className={`px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  deviceMode === 'mobile_frame' ? 'bg-orange-600 text-white shadow-xs font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Moldura de Smartphone"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Smartphone</span>
              </button>

              <button
                id="btn-mode-full-canvas"
                onClick={() => setDeviceMode('full_canvas')}
                className={`px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  deviceMode === 'full_canvas' ? 'bg-orange-600 text-white shadow-xs font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Tela Cheia / Responsiva"
              >
                <Monitor className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Expandido</span>
              </button>
            </div>

            {/* Switch to school portal */}
            {onSwitchToManagement && (
              <button
                id="btn-switch-to-school-portal"
                onClick={onSwitchToManagement}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Monitor className="w-3.5 h-3.5 text-orange-400" />
                <span>Painel da Escola</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center p-2 sm:p-6 lg:p-8 relative">
        {/* Device Container */}
        <div className={`w-full transition-all duration-300 ${
          deviceMode === 'mobile_frame'
            ? 'max-w-[440px] rounded-[44px] ring-12 ring-slate-900 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] border-4 border-slate-800 bg-slate-900 overflow-hidden relative my-2'
            : 'max-w-3xl rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden'
        }`}>
          
          {/* Smartphone Status Bar (Simulated) */}
          {deviceMode === 'mobile_frame' && (
            <div className="bg-slate-900 text-white px-7 pt-3 pb-1 flex items-center justify-between text-[11px] font-semibold select-none border-b border-slate-800/40">
              <div className="font-mono">07:20</div>
              {/* Dynamic Island */}
              <div className="w-24 h-4 bg-black rounded-full flex items-center justify-center space-x-1.5 px-2">
                <span className="w-2 h-2 rounded-full bg-slate-800"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-orange-900"></span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-300">
                <Signal className="w-3 h-3" />
                <Wifi className="w-3 h-3" />
                <Battery className="w-3.5 h-3.5" />
              </div>
            </div>
          )}

          {/* In-App Live Notification Toast Banner */}
          {liveBanner && (
            <div className="absolute top-12 left-4 right-4 z-50 animate-in slide-in-from-top-4 duration-300">
              <div className="bg-slate-900/95 backdrop-blur-md text-white p-3.5 rounded-2xl border border-orange-500/50 shadow-2xl flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-orange-600 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                  <Bell className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between text-[10px] text-orange-300 font-bold uppercase tracking-wider">
                    <span>{liveBanner.title}</span>
                    <span className="font-mono text-slate-400">{liveBanner.time}</span>
                  </div>
                  <p className="text-xs text-white font-medium mt-0.5 leading-snug">
                    {liveBanner.message}
                  </p>
                </div>
                <button
                  onClick={() => setLiveBanner(null)}
                  className="text-slate-400 hover:text-white p-1 cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          {/* Parent App Header (With Child Cards & Guardian Switcher) */}
          <ParentHeader
            currentGuardian={currentGuardian}
            allGuardians={guardiansList}
            onSelectGuardian={handleSelectGuardian}
            myChildren={myChildren}
            selectedStudent={selectedStudent}
            onSelectStudent={setSelectedStudent}
            unreadNotificationsCount={unreadCount}
            onOpenNotifications={() => setIsNotificationsOpen(true)}
            onOpenDigitalBadge={() => setIsBadgeModalOpen(true)}
            activeTab={activeTab}
            onOpenAuthModal={onOpenAuthModal}
          />

          {/* Quick Absence Shortcut Bar on Home */}
          {activeTab === 'home' && (
            <div className="bg-slate-900 px-4 py-2 border-b border-slate-800 flex items-center justify-between gap-2">
              <button
                id="btn-parent-open-absence-modal"
                onClick={() => setIsAbsenceModalOpen(true)}
                className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-98 cursor-pointer"
              >
                <FileText className="w-4 h-4" />
                <span>Notificar Falta / Enviar Atestado</span>
              </button>
            </div>
          )}

          {/* Dynamic Screen Content */}
          <div className="p-4 sm:p-5 space-y-5 max-h-[640px] overflow-y-auto bg-slate-950/30 custom-scrollbar">
            {activeTab === 'home' && (
              <>
                {/* 1. Status de Presença Atual & Linha do Tempo do Filho Selecionado */}
                <PresenceStatusCard
                  studentName={selectedStudent.name}
                  isAtSchool={true}
                  entryTime="07:15"
                  turnstileName={selectedStudent.stage === 'Fundamental I' ? 'Catraca 02 - Portão Fundamental I' : 'Catraca 01 - Portão Principal'}
                  timeline={timeline}
                  onSimulateNewPass={handleSimulatePassNotification}
                  onViewTimelineDetails={(event) => {
                    alert(`Evento: ${event.title}\nHorário: ${event.time}\nLocal: ${event.location}\nDetalhes: ${event.detail}`);
                  }}
                />

                {/* 2. Resumo de Comunicados Oficiais */}
                <SchoolNoticesSection
                  notices={notices}
                  onMarkAsRead={handleMarkNoticeAsRead}
                />
              </>
            )}

            {activeTab === 'history' && (
              /* 3. Histórico semanal de acessos do filho */
              <WeeklyAccessHistory
                days={weeklyAccess}
                onSelectDay={(day) => {
                  alert(`Dia: ${day.fullDate}\nEntrada: ${day.entryTime || 'Não registrada'}\nSaída: ${day.exitTime || 'Em andamento'}\nCatraca: ${day.turnstileUsed}\nMétodo: ${day.method}\nStatus: ${day.status}`);
                }}
              />
            )}

            {activeTab === 'notices' && (
              /* 4. Canal de Avisos da Direção Completo */
              <SchoolNoticesSection
                notices={notices}
                onMarkAsRead={handleMarkNoticeAsRead}
              />
            )}
          </div>

          {/* Bottom Navigation Bar */}
          <nav className="bg-slate-900 border-t border-slate-800 px-3 py-2 flex items-center justify-around text-xs select-none">
            <button
              id="tab-parent-home"
              onClick={() => setActiveTab('home')}
              className={`flex flex-col items-center gap-1 py-1.5 px-3 rounded-xl transition-all cursor-pointer ${
                activeTab === 'home'
                  ? 'text-orange-400 font-bold bg-orange-950/50'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Home className="w-5 h-5" />
              <span className="text-[10px]">Presença</span>
            </button>

            <button
              id="tab-parent-history"
              onClick={() => setActiveTab('history')}
              className={`flex flex-col items-center gap-1 py-1.5 px-3 rounded-xl transition-all cursor-pointer ${
                activeTab === 'history'
                  ? 'text-orange-400 font-bold bg-orange-950/50'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <CalendarDays className="w-5 h-5" />
              <span className="text-[10px]">Semana</span>
            </button>

            <button
              id="tab-parent-notices"
              onClick={() => setActiveTab('notices')}
              className={`flex flex-col items-center gap-1 py-1.5 px-3 rounded-xl transition-all cursor-pointer relative ${
                activeTab === 'notices'
                  ? 'text-orange-400 font-bold bg-orange-950/50'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Megaphone className="w-5 h-5" />
              <span className="text-[10px]">Avisos</span>
              {notices.some(n => n.isUnread) && (
                <span className="absolute top-1 right-3 w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
              )}
            </button>

            <button
              id="tab-parent-absence"
              onClick={() => setIsAbsenceModalOpen(true)}
              className="flex flex-col items-center gap-1 py-1.5 px-3 rounded-xl text-slate-400 hover:text-slate-200 transition-all cursor-pointer"
            >
              <FileText className="w-5 h-5 text-amber-400" />
              <span className="text-[10px]">Justificar</span>
            </button>
          </nav>

          {/* Smartphone Home Bar Indicator */}
          {deviceMode === 'mobile_frame' && (
            <div className="bg-slate-900 py-1.5 flex justify-center">
              <div className="w-32 h-1 bg-slate-700 rounded-full"></div>
            </div>
          )}

          {/* In-App Modals & Notification Drawer */}
          {isAbsenceModalOpen && (
            <AbsenceJustificationModal
              isOpen={isAbsenceModalOpen}
              onClose={() => setIsAbsenceModalOpen(false)}
              student={selectedStudent}
              existingJustifications={justifications.filter(j => myChildren.some(c => c.id === j.studentId))}
              onSubmitJustification={handleAddJustification}
            />
          )}

          {isBadgeModalOpen && (
            <StudentDigitalBadgeModal
              isOpen={isBadgeModalOpen}
              onClose={() => setIsBadgeModalOpen(false)}
              student={selectedStudent}
            />
          )}

          {isNotificationsOpen && (
            <InAppNotificationDrawer
              isOpen={isNotificationsOpen}
              onClose={() => setIsNotificationsOpen(false)}
              notifications={parentNotifications}
              onMarkAllAsRead={handleMarkAllNotificationsAsRead}
            />
          )}
        </div>
      </main>
    </div>
  );
};
