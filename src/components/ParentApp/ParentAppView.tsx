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
import type {
  Student,
  SchoolNotice,
  ParentNotification,
  AbsenceJustification,
  AccessLog,
  ParentAccount,
} from '../../types';
import {
  buildStudentAccessTimeline,
  buildWeeklyAccessFromLogs,
  getStudentAccessLogs,
  isToday,
} from '../../services/accessHistory';
import type {
  GuardianLinkRequestRecord,
  GuardianRelationship,
} from '../../../shared/contracts/linkRequests';
import { isNativeApp } from '../../config/runtime';
import { Avatar, Callout, cx, firstNameOf, focusMainContent, greetingForNow } from '../ui';

interface ParentAppViewProps {
  /** Responsável da sessão. */
  guardian: ParentAccount;
  schoolName: string;
  /** Estudantes com vínculo aprovado, vindos de /me/students. */
  students: Student[];
  studentsState?: 'loading' | 'persistent' | 'unavailable';
  studentsError?: string;
  onSwitchToManagement?: () => void;
  notices: SchoolNotice[];
  notifications: ParentNotification[];
  onMarkNoticeRead: (id: string) => Promise<void>;
  onMarkAllNotificationsRead: () => Promise<void>;
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
  guardian: currentGuardian,
  schoolName,
  students: myChildren,
  studentsState = 'persistent',
  studentsError,
  onSwitchToManagement,
  notices,
  notifications,
  onMarkNoticeRead,
  onMarkAllNotificationsRead,
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
  // Estudante selecionado entre os vinculados; a escolha sobrevive à troca de aba.
  const [selectedStudentId, setSelectedStudentId] = useState<string | undefined>(myChildren[0]?.id);
  useEffect(() => {
    if (myChildren.length > 0 && !myChildren.some((child) => child.id === selectedStudentId)) {
      setSelectedStudentId(myChildren[0].id);
    }
  }, [myChildren, selectedStudentId]);
  const selectedStudent = myChildren.find((child) => child.id === selectedStudentId) ?? myChildren[0];
  const setSelectedStudent = (child: Student) => setSelectedStudentId(child.id);

  // Movimentações de hoje e semana do estudante selecionado.
  const timeline = useMemo(
    () => (selectedStudent ? buildStudentAccessTimeline(sharedAccessLogs, selectedStudent.id) : []),
    [selectedStudent, sharedAccessLogs],
  );
  const weeklyAccess = useMemo(
    () => (selectedStudent
      ? buildWeeklyAccessFromLogs(sharedAccessLogs, selectedStudent.id, sharedJustifications)
      : []),
    [selectedStudent, sharedAccessLogs, sharedJustifications],
  );
  // Presença considera só o dia de hoje: entrada de ontem sem saída não conta como presente.
  const todayLogs = useMemo(
    () => (selectedStudent
      ? getStudentAccessLogs(sharedAccessLogs, selectedStudent.id).filter((log) => isToday(log.timestamp))
      : []),
    [selectedStudent, sharedAccessLogs],
  );
  const latestAccess = todayLogs.at(-1);
  const isAtSchool = latestAccess?.direction === 'entry';

  // A API já entrega só as notificações desta conta; nenhum filtro adicional no navegador.
  const parentNotifications = notifications;

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

  const handleMarkNoticeAsRead = (id: string) => onMarkNoticeRead(id);
  const handleMarkAllNotificationsAsRead = () => onMarkAllNotificationsRead();

  const hasUnreadNotices = notices.some((notice) => notice.isUnread);
  const guardianFirstName = firstNameOf(currentGuardian.name);
  const hasLinkedStudent = Boolean(selectedStudent);

  const shell = (content: React.ReactNode, showNavigation = true) => (
    <div className={cx('min-h-dvh bg-surface', isNativeApp && 'native-app-shell')}>
      <a href="#parent-app-content" onClick={focusMainContent('parent-app-content')} className="fixed left-3 top-3 z-[100] -translate-y-24 rounded-lg bg-action px-4 py-2 text-sm font-semibold text-white shadow-lg transition-transform focus:translate-y-0">
        Pular para o conteúdo
      </a>
      <ParentHeader
        currentGuardian={currentGuardian}
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
          <span>{schoolName}</span>
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
      <p data-testid="parent-school" className="mt-1 text-xs text-muted">{schoolName}</p>
    </div>
  );

  if (!selectedStudent && studentsState !== 'persistent') {
    return shell(
      <>
        {pageHeading}
        {studentsState === 'loading' ? (
          <Callout tone="info" role="status">Carregando estudantes vinculados…</Callout>
        ) : (
          <Callout tone="warning" role="status">
            <div>
              <p>{studentsError || 'Não foi possível carregar seus vínculos.'}</p>
              <button type="button" className="btn-link mt-2" onClick={onRefreshData} disabled={!isOnline}>Tentar novamente</button>
            </div>
          </Callout>
        )}
      </>,
      false,
    );
  }

  if (!selectedStudent) {
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

        {/* Avisos são da escola (leitura por responsável): o seletor de estudante não muda essa aba. */}
        {activeTab !== 'notices' && (
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
        )}
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
