import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, FileText, ListChecks, LogOut, ShieldCheck } from 'lucide-react';
import { ParentHeader, type ParentTab } from './ParentHeader';
import { PresenceStatusCard, TodayMovements } from './PresenceStatusCard';
import { WeeklyAccessHistory } from './WeeklyAccessHistory';
import { SchoolNoticesSection } from './SchoolNoticesSection';
import { AbsenceJustificationModal } from './AbsenceJustificationModal';
import { InAppNotificationDrawer } from './InAppNotificationDrawer';
import { InstallAppBanner } from './InstallAppBanner';
import { ParentDataStatus } from './ParentDataStatus';
import { GuardianLinkRequests } from './GuardianLinkRequests';
import {
  Student,
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
import { Avatar, cx, firstNameOf, focusMainContent, greetingForNow } from '../ui';

const SCHOOL_NAME = 'EMEF Profª. Cecília Meireles';

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

  const [activeTab, setActiveTab] = useState<ParentTab>('home');
  const [absenceModal, setAbsenceModal] = useState<'nova' | 'historico' | null>(null);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [scrollTarget, setScrollTarget] = useState<string | null>(null);
  const [isCompactViewport, setIsCompactViewport] = useState(() => window.matchMedia('(max-width: 639px)').matches);

  useEffect(() => {
    const media = window.matchMedia('(max-width: 639px)');
    const update = () => setIsCompactViewport(media.matches);
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    if (scrollTarget) {
      document.getElementById(scrollTarget)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setScrollTarget(null);
    } else {
      window.scrollTo({ top: 0 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const goToLinks = () => {
    setScrollTarget('vinculos');
    setActiveTab('notices');
  };

  const unreadCount = parentNotifications.filter(n => !n.isRead).length;

  // Handler for adding a new absence justification
  const handleAddJustification = (
    newJust: Omit<AbsenceJustification, 'id' | 'submittedAt' | 'status'>,
  ) => onSubmitJustification(newJust);

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

  const hasUnreadNotices = notices.some((notice) => notice.isUnread);
  const guardianFirstName = firstNameOf(currentGuardian.name);
  const hasLinkedStudent = myChildren.length > 0 && myChildren.some((child) => child.id === selectedStudent.id);

  const shell = (content: React.ReactNode, showNavigation = true) => (
    <div className={cx('min-h-dvh bg-surface', isNativeApp && 'native-app-shell')}>
      <a href="#parent-app-content" onClick={focusMainContent('parent-app-content')} className="fixed left-3 top-3 z-[100] -translate-y-24 rounded-lg bg-action px-4 py-2 text-sm font-semibold text-white shadow-lg transition-transform focus:translate-y-0">
        Pular para o conteúdo
      </a>
      <ParentHeader
        currentGuardian={currentGuardian}
        allGuardians={guardiansList}
        onSelectGuardian={handleSelectGuardian}
        unreadNotificationsCount={unreadCount}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        hasUnreadNotices={hasUnreadNotices}
        onOpenAbsence={() => setAbsenceModal('nova')}
        canSubmitAbsence={isOnline && hasLinkedStudent}
        onSwitchToManagement={onSwitchToManagement}
        onLogout={onLogout}
        showNavigation={showNavigation}
      />
      <main id="parent-app-content" tabIndex={-1} className={cx('mx-auto w-full max-w-5xl px-4 pt-8 outline-none sm:px-6', showNavigation ? 'pb-28 md:pb-16' : 'pb-16')}>
        {content}
        <footer className="mt-12 flex flex-col gap-1 border-t border-line pt-5 text-xs text-muted sm:flex-row sm:justify-between">
          <span>{SCHOOL_NAME} · Escola fictícia</span>
          <span>Catraca de Troia · Portal dos responsáveis</span>
        </footer>
      </main>
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
  );

  const pageHeading = (
    <div className="mb-6">
      <h1 className="display-title text-[28px] sm:text-[32px]">{greetingForNow()}, {guardianFirstName}.</h1>
      <p className="mt-2 text-sm text-muted">Mais perto da rotina de quem você ama.</p>
      <p data-testid="parent-school" className="mt-1 text-xs text-muted">{SCHOOL_NAME} · Rede pública</p>
    </div>
  );

  if (!hasLinkedStudent) {
    return shell(
      <>
        {pageHeading}
        <section className="card mb-6 p-6" aria-labelledby="no-student-title">
          <h2 id="no-student-title" className="card-title">Nenhum estudante vinculado</h2>
          <p className="card-subtitle max-w-xl">Solicite o vínculo abaixo. Nenhum registro estudantil é liberado antes da aprovação da escola.</p>
          {onLogout && (
            <button type="button" className="btn btn-secondary btn-sm mt-4" onClick={onLogout}>
              <LogOut aria-hidden="true" />
              Sair
            </button>
          )}
        </section>
        <GuardianLinkRequests
          requests={linkRequests}
          state={linkRequestsState}
          error={linkRequestsError}
          isOnline={isOnline}
          onCreate={onCreateLinkRequest}
        />
        <div className="mt-6"><InstallAppBanner /></div>
      </>,
      false,
    );
  }

  return shell(
    <>
      {pageHeading}

      <div className="mb-6 space-y-4">
        <ParentDataStatus
          isOnline={isOnline}
          states={[accessEventsState, justificationsState, communicationsState]}
          updatedAt={dataUpdatedAt}
          errors={[accessEventsError, justificationsError, communicationsError]}
          onRefresh={onRefreshData}
        />

        <section className="card px-5 py-4" aria-labelledby="selected-student-label">
          <p id="selected-student-label" className="eyebrow-muted mb-3">{myChildren.length > 1 ? 'Estudantes vinculados' : 'Estudante selecionado'}</p>
          <div data-testid="parent-students" className="grid gap-2 sm:grid-cols-2">
            {myChildren.map((child) => {
              const selected = child.id === selectedStudent.id;
              return (
                <button
                  key={child.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setSelectedStudent(child)}
                  className={cx(
                    'flex min-w-0 items-center gap-3 rounded-[10px] border px-3 py-2.5 text-left transition-colors',
                    selected ? 'border-brand bg-[#fffaf5] shadow-[0_0_0_1px_var(--color-brand)]' : 'border-line hover:border-line-strong hover:bg-surface',
                  )}
                >
                  <Avatar name={child.name} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold leading-snug text-ink">{child.name}</span>
                    <span className="block text-xs text-muted">{child.turma.split(' - ')[0]} · {child.shift} · Vínculo aprovado</span>
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      </div>

      {activeTab === 'home' && (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="min-w-0 space-y-6">
            <PresenceStatusCard studentName={selectedStudent.name} latestAccess={latestAccess} />
            <TodayMovements timeline={timeline} isAtSchool={isAtSchool} onOpenHistory={() => setActiveTab('history')} />
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                id="btn-parent-open-absence-modal"
                type="button"
                className="btn btn-secondary btn-lg"
                onClick={() => setAbsenceModal('nova')}
                disabled={!isOnline}
                title={isOnline ? 'Enviar justificativa' : 'Reconecte-se para enviar uma justificativa'}
              >
                <FileText aria-hidden="true" />
                Justificar ausência
              </button>
              <button type="button" className="btn btn-secondary btn-lg" onClick={() => setAbsenceModal('historico')}>
                <ListChecks aria-hidden="true" />
                Minhas justificativas
              </button>
            </div>
          </div>
          <aside className="space-y-6" aria-label="Avisos e vínculos">
            <SchoolNoticesSection
              variant="summary"
              notices={notices}
              onMarkAsRead={handleMarkNoticeAsRead}
              canMarkAsRead={isOnline}
              onViewAll={() => setActiveTab('notices')}
            />
            <section className="card p-6" aria-labelledby="trust-title">
              <h2 id="trust-title" className="flex items-center gap-2.5 card-title">
                <ShieldCheck aria-hidden="true" className="h-5 w-5 text-ink-2" />
                Um vínculo de confiança
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-2">Você consulta apenas estudantes com vínculo aprovado pela escola.</p>
              <button type="button" className="btn-link mt-4" onClick={goToLinks}>
                <ArrowRight aria-hidden="true" />
                Gerenciar meus vínculos
              </button>
            </section>
          </aside>
        </div>
      )}

      {activeTab === 'history' && (
        <WeeklyAccessHistory days={weeklyAccess} studentName={selectedStudent.name} />
      )}

      {activeTab === 'notices' && (
        <div className="space-y-8">
          <SchoolNoticesSection notices={notices} onMarkAsRead={handleMarkNoticeAsRead} canMarkAsRead={isOnline} />
          <GuardianLinkRequests
            requests={linkRequests}
            state={linkRequestsState}
            error={linkRequestsError}
            isOnline={isOnline}
            onCreate={onCreateLinkRequest}
          />
        </div>
      )}

      <div className="mt-8"><InstallAppBanner /></div>

      {absenceModal && (
        <AbsenceJustificationModal
          isOpen
          onClose={() => setAbsenceModal(null)}
          student={selectedStudent}
          existingJustifications={sharedJustifications.filter((item) => myChildren.some((child) => child.id === item.studentId))}
          onSubmitJustification={handleAddJustification}
          compact={isNativeApp || isCompactViewport}
          initialTab={absenceModal}
        />
      )}
    </>,
  );
};
