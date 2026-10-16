import { DemoNotice } from '../DemoNotice';
import { CatracaTroiaLogo } from '../CatracaTroiaLogo';
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
import { InstallAppBanner } from './InstallAppBanner';
import { ParentDataStatus } from './ParentDataStatus';
import { GuardianLinkRequests } from './GuardianLinkRequests';
import { 
  Student, 
  DayTimelineEvent, 
  WeeklyAccessDay, 
  SchoolNotice, 
  ParentNotification, 
  AbsenceJustification,
  AccessLog,
} from '../../types';
import { 
  STUDENTS_DATABASE, 
  PARENT_ACCOUNTS,
  ParentAccount,
  INITIAL_SCHOOL_NOTICES, 
  INITIAL_PARENT_NOTIFICATIONS, 
} from '../../data/mockData';
import {
  buildStudentAccessTimeline,
  buildWeeklyAccessFromLogs,
  getStudentAccessLogs,
} from '../../services/demoAccessService';
import type {
  GuardianLinkRequestRecord,
  GuardianRelationship,
} from '../../../shared/contracts/linkRequests';
import { isNativeApp } from '../../config/runtime';

interface ParentAppViewProps {
  onSwitchToManagement?: () => void;
  sharedNotices?: SchoolNotice[];
  onUpdateSharedNotices?: (notices: SchoolNotice[]) => void;
  sharedNotifications?: ParentNotification[];
  onUpdateSharedNotifications?: (notifications: ParentNotification[]) => void;
  onMarkNoticeRead?: (id: string) => Promise<void>;
  onMarkAllNotificationsRead?: () => Promise<void>;
  guardiansList?: ParentAccount[];
  currentGuardianExternal?: ParentAccount;
  onSelectGuardianExternal?: (guardian: ParentAccount) => void;
  studentsList?: Student[];
  sharedAccessLogs: AccessLog[];
  sharedJustifications: AbsenceJustification[];
  onSubmitJustification: (
    justification: Omit<AbsenceJustification, 'id' | 'submittedAt' | 'status'>,
    attachment?: File,
  ) => Promise<void>;
  justificationsState: 'loading' | 'persistent' | 'unavailable';
  justificationsError?: string;
  accessEventsState: 'loading' | 'persistent' | 'unavailable';
  accessEventsError?: string;
  communicationsState: 'loading' | 'persistent' | 'unavailable';
  communicationsError?: string;
  isOnline: boolean;
  dataUpdatedAt?: string;
  onRefreshData: () => void;
  linkRequests: GuardianLinkRequestRecord[];
  linkRequestsState: 'loading' | 'persistent' | 'unavailable';
  linkRequestsError?: string;
  onCreateLinkRequest: (enrollment: string, relationship: GuardianRelationship) => Promise<void>;
  onLogout?: () => void;
}

export const ParentAppView: React.FC<ParentAppViewProps> = ({ 
  onSwitchToManagement,
  sharedNotices,
  onUpdateSharedNotices,
  sharedNotifications,
  onUpdateSharedNotifications,
  onMarkNoticeRead,
  onMarkAllNotificationsRead,
  guardiansList = PARENT_ACCOUNTS,
  currentGuardianExternal,
  onSelectGuardianExternal,
  studentsList = STUDENTS_DATABASE,
  sharedAccessLogs,
  sharedJustifications,
  onSubmitJustification,
  justificationsState,
  justificationsError,
  accessEventsState,
  accessEventsError,
  communicationsState,
  communicationsError,
  isOnline,
  dataUpdatedAt,
  onRefreshData,
  linkRequests,
  linkRequestsState,
  linkRequestsError,
  onCreateLinkRequest,
  onLogout,
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
    return buildStudentAccessTimeline(sharedAccessLogs, selectedStudent.id);
  }, [selectedStudent, sharedAccessLogs]);

  const weeklyAccess = useMemo(() => {
    return buildWeeklyAccessFromLogs(
      sharedAccessLogs,
      selectedStudent.id,
      sharedJustifications,
    );
  }, [selectedStudent, sharedAccessLogs, sharedJustifications]);

  const selectedStudentLogs = useMemo(
    () => getStudentAccessLogs(sharedAccessLogs, selectedStudent.id),
    [selectedStudent, sharedAccessLogs],
  );
  const latestAccess = selectedStudentLogs.at(-1);
  const latestEntry = [...selectedStudentLogs].reverse().find((log) => log.direction === 'entry');
  const isAtSchool = latestAccess?.direction === 'entry';

  const [internalNotices, setInternalNotices] = useState<SchoolNotice[]>(INITIAL_SCHOOL_NOTICES);
  const [internalNotifications, setInternalNotifications] = useState<ParentNotification[]>(INITIAL_PARENT_NOTIFICATIONS);

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
  const [deviceMode, setDeviceMode] = useState<'mobile_frame' | 'full_canvas'>(
    isNativeApp ? 'full_canvas' : 'mobile_frame',
  );
  const [isCompactViewport, setIsCompactViewport] = useState(() => window.matchMedia('(max-width: 639px)').matches);
  const isStandaloneWebApp = window.matchMedia('(display-mode: standalone)').matches
    || Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
  const isAppLikeExperience = isNativeApp || isStandaloneWebApp || isCompactViewport;

  useEffect(() => {
    const media = window.matchMedia('(max-width: 639px)');
    const update = () => setIsCompactViewport(media.matches);
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  const unreadCount = parentNotifications.filter(n => !n.isRead).length;

  // Handler for adding a new absence justification
  const handleAddJustification = (
    newJust: Omit<AbsenceJustification, 'id' | 'submittedAt' | 'status'>,
    attachment?: File,
  ) => onSubmitJustification(newJust, attachment);

  const handleMarkNoticeAsRead = async (id: string) => {
    if (onMarkNoticeRead) {
      await onMarkNoticeRead(id);
      return;
    }
    setNotices(notices.map(n => n.id === id ? { ...n, isUnread: false } : n));
  };

  const handleMarkAllNotificationsAsRead = async () => {
    if (onMarkAllNotificationsRead) {
      await onMarkAllNotificationsRead();
      return;
    }
    const childrenNames = myChildren.map(c => c.name);
    setAllNotifications(allNotifications.map(n => {
      if (n.studentName === 'Geral' || (n.studentName && childrenNames.includes(n.studentName))) {
        return { ...n, isRead: true };
      }
      return n;
    }));
  };

  if (myChildren.length === 0 || !myChildren.some(child => child.id === selectedStudent.id)) {
    return <div className={`${isAppLikeExperience ? 'min-h-dvh native-app-shell' : 'min-h-screen'} bg-slate-950 text-white`}>
      <DemoNotice />
      <InstallAppBanner />
      <main className="mx-auto max-w-2xl space-y-5 p-5 sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold">Nenhum estudante vinculado</h1>
            <p className="mt-2 text-sm text-slate-300">Solicite o vínculo abaixo. Nenhum registro estudantil é liberado antes da aprovação escolar.</p>
          </div>
          <button className="shrink-0 text-xs underline" onClick={onLogout}>Sair</button>
        </div>
        <GuardianLinkRequests
          requests={linkRequests}
          state={linkRequestsState}
          error={linkRequestsError}
          isOnline={isOnline}
          onCreate={onCreateLinkRequest}
        />
      </main>
    </div>;
  }

  return (
    <div className={`${isAppLikeExperience ? 'h-dvh overflow-hidden' : 'min-h-screen'} bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-orange-500 selection:text-white`}>
      <a href="#parent-app-content" className="fixed left-3 top-3 z-[100] -translate-y-24 rounded-lg bg-orange-600 px-4 py-2 text-sm font-bold text-white shadow-lg transition-transform focus:translate-y-0">
        Ir para o conteúdo principal
      </a>
      <DemoNotice />
      
      {/* Top Navigation / Perspective Bar */}
      {!isAppLikeExperience && <header className="bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-4 py-3 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 lg:grid-cols-[minmax(0,1fr)_auto_auto] lg:gap-3">
          
          {/* Logo & Mode indicator */}
          <div className="flex min-w-0 items-center">
            <CatracaTroiaLogo size={44} variant="dark" subtitle="Portal dos responsáveis • EMEF Profª. Cecília Meireles" />
          </div>

          {/* Quick controls */}
          <div className="col-span-2 row-start-2 grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-2 lg:col-span-1 lg:col-start-2 lg:row-start-1 lg:flex">
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

          </div>

          {/* Keep perspective switching visible independently from demo controls. */}
          {onSwitchToManagement && (
            <button
              id="btn-switch-to-school-portal"
              onClick={onSwitchToManagement}
              className="col-start-2 row-start-1 px-2 sm:px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 lg:col-start-3"
              title="Abrir o painel da escola"
            >
              <Monitor className="w-3.5 h-3.5 text-orange-400" />
              <span className="sm:hidden">Painel</span>
              <span className="hidden sm:inline">Painel da Escola</span>
            </button>
          )}
        </div>
      </header>}

      {/* Main Container */}
      <main id="parent-app-content" tabIndex={-1} className={`flex-1 min-h-0 flex items-center justify-center relative ${isAppLikeExperience ? 'p-0' : 'p-2 sm:p-6 lg:p-8'}`}>
        {/* Device Container */}
        <div className={`w-full transition-all duration-300 ${isAppLikeExperience
          ? 'h-full bg-slate-900 overflow-hidden relative flex flex-col native-app-shell'
          : deviceMode === 'mobile_frame'
            ? 'max-w-[440px] rounded-[44px] ring-12 ring-slate-900 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] border-4 border-slate-800 bg-slate-900 overflow-hidden relative my-2'
            : 'max-w-3xl rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden'
        }`}>
          
          {/* Smartphone Status Bar (Simulated) */}
          {!isAppLikeExperience && deviceMode === 'mobile_frame' && (
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
            onLogout={onLogout}
          />

          <ParentDataStatus
            isOnline={isOnline}
            states={[accessEventsState, justificationsState, communicationsState]}
            updatedAt={dataUpdatedAt}
            errors={[accessEventsError, justificationsError, communicationsError]}
            onRefresh={onRefreshData}
          />

          {/* Quick Absence Shortcut Bar on Home */}
          {activeTab === 'home' && (
            <div className="bg-slate-900 px-4 py-2 border-b border-slate-800 flex items-center justify-between gap-2">
              <button
                id="btn-parent-open-absence-modal"
                onClick={() => setIsAbsenceModalOpen(true)}
                disabled={!isOnline}
                title={isOnline ? 'Enviar justificativa' : 'Reconecte-se para enviar uma justificativa'}
                className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-98 cursor-pointer disabled:cursor-not-allowed disabled:from-slate-700 disabled:to-slate-700 disabled:text-slate-400"
              >
                <FileText className="w-4 h-4" />
                <span>Notificar Falta / Enviar Atestado</span>
              </button>
            </div>
          )}

          {/* Dynamic Screen Content */}
          <div className={`p-4 sm:p-5 space-y-5 overflow-y-auto bg-slate-950/30 custom-scrollbar ${isAppLikeExperience ? 'flex-1 min-h-0' : 'max-h-[640px]'}`}>
            {activeTab === 'home' && (
              <>
                {/* 1. Status de Presença Atual & Linha do Tempo do Filho Selecionado */}
                <PresenceStatusCard
                  studentName={selectedStudent.name}
                  isAtSchool={isAtSchool}
                  entryTime={latestEntry?.exactTime.slice(0, 5) || '—'}
                  turnstileName={latestAccess?.turnstileName || 'Sem passagem na sessão'}
                  timeline={timeline}
                  onViewTimelineDetails={(event) => {
                    alert(`Evento: ${event.title}\nHorário: ${event.time}\nLocal: ${event.location}\nDetalhes: ${event.detail}`);
                  }}
                />

                {/* 2. Resumo de Comunicados Oficiais */}
                <SchoolNoticesSection
                  notices={notices}
                  onMarkAsRead={handleMarkNoticeAsRead}
                  canMarkAsRead={isOnline}
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
              <>
                {/* 4. Canal de Avisos da Direção Completo */}
                <SchoolNoticesSection
                  notices={notices}
                  onMarkAsRead={handleMarkNoticeAsRead}
                  canMarkAsRead={isOnline}
                />
                <GuardianLinkRequests
                  requests={linkRequests}
                  state={linkRequestsState}
                  error={linkRequestsError}
                  isOnline={isOnline}
                  onCreate={onCreateLinkRequest}
                />
              </>
            )}
          </div>

          {/* Bottom Navigation Bar */}
          <nav aria-label="Navegação do portal dos responsáveis" className={`bg-slate-900 border-t border-slate-800 px-3 py-2 flex items-center justify-around text-xs select-none ${isAppLikeExperience ? 'native-bottom-nav' : ''}`}>
            <button
              id="tab-parent-home"
              onClick={() => setActiveTab('home')}
              aria-current={activeTab === 'home' ? 'page' : undefined}
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
              aria-current={activeTab === 'history' ? 'page' : undefined}
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
              aria-current={activeTab === 'notices' ? 'page' : undefined}
              aria-label={notices.some((notice) => notice.isUnread) ? 'Avisos, há itens não lidos' : 'Avisos'}
              className={`flex flex-col items-center gap-1 py-1.5 px-3 rounded-xl transition-all cursor-pointer relative ${
                activeTab === 'notices'
                  ? 'text-orange-400 font-bold bg-orange-950/50'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Megaphone className="w-5 h-5" />
              <span className="text-[10px]">Avisos</span>
              {notices.some(n => n.isUnread) && (
                <span aria-hidden="true" className="absolute top-1 right-3 w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
              )}
            </button>

            <button
              id="tab-parent-absence"
              onClick={() => setIsAbsenceModalOpen(true)}
              disabled={!isOnline}
              title={isOnline ? 'Enviar justificativa' : 'Reconecte-se para enviar uma justificativa'}
              className="flex flex-col items-center gap-1 py-1.5 px-3 rounded-xl text-slate-400 hover:text-slate-200 transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
            >
              <FileText className="w-5 h-5 text-amber-400" />
              <span className="text-[10px]">Justificar</span>
            </button>
          </nav>

          {/* Smartphone Home Bar Indicator */}
          {!isAppLikeExperience && deviceMode === 'mobile_frame' && (
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
              existingJustifications={sharedJustifications.filter(j => myChildren.some(c => c.id === j.studentId))}
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
              canMarkAsRead={isOnline}
            />
          )}
        </div>
      </main>
    </div>
  );
};
