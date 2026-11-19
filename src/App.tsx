import React, { useState, useEffect, useRef } from 'react';
import { SchoolShell, SCHOOL_SECTIONS, ADMIN_SECTIONS, type SchoolSection } from './components/school/SchoolShell';
import { OverviewPage } from './components/school/OverviewPage';
import { AccessRecordsPage } from './components/school/AccessRecordsPage';
import { ToolsPage } from './components/school/ToolsPage';
import { ManualReleaseModal } from './components/ManualReleaseModal';
import { StudentDetailModal } from './components/StudentDetailModal';
import { AlertsModal } from './components/AlertsModal';
import { ParentAppView } from './components/ParentApp/ParentAppView';
import { ProjectDocsModal } from './components/ProjectDocsModal';
import { SchoolNoticesManager } from './components/SchoolNoticesManager';
import { StudentsManagementList } from './components/StudentsManagementList';
import { AuthModal } from './components/AuthModal';
import { JustificationsManager } from './components/JustificationsManager';
import { LinkRequestsManager } from './components/LinkRequestsManager';
import { AuditLogPanel } from './components/AuditLogPanel';
import { AccountsAdministrationPanel } from './components/AccountsAdministrationPanel';
import { NotificationDeliveryPanel } from './components/NotificationDeliveryPanel';
import { LandingPage } from './components/LandingPage';
import type {
  AccessDirection, AccessLog, Student, Turnstile, SecurityAlert, SchoolNotice,
  ParentNotification, AuthUser, AbsenceJustification, ParentAccount,
} from './types';
import { soundManager } from './utils/sound';
import { isParentOnlyBuild } from './config/runtime';
import { justificationsApi } from './services/justificationsApi';
import { accessEventsApi } from './services/accessEventsApi';
import { accessDevicesApi } from './services/accessDevicesApi';
import { studentsApi } from './services/studentsApi';
import { isToday } from './services/accessHistory';
import { authApi } from './services/authApi';
import { toAuthUser } from './services/authUserMapper';
import { communicationsApi } from './services/communicationsApi';
import { useConnectivity } from './hooks/useConnectivity';
import { linkRequestsApi } from './services/linkRequestsApi';
import { auditApi } from './services/auditApi';
import { accountsApi } from './services/accountsApi';
import { notificationDeliveryApi } from './services/notificationDeliveryApi';
import type { AuditLogRecord } from '../shared/contracts/audit';
import type { AccessDeviceRecord, DenialReason } from '../shared/contracts/accessDevices';
import type { ManagedAccount } from '../shared/contracts/accountAdministration';
import type { NotificationDeliverySnapshot } from '../shared/contracts/notificationDelivery';
import type { AccessEventSyncStatus } from '../shared/contracts/accessEventSync';
import type {
  GuardianLinkRequestRecord,
  GuardianStudentLinkRecord,
  GuardianRelationship,
  LinkReviewStatus,
} from '../shared/contracts/linkRequests';

import { CheckCircle2, Megaphone } from 'lucide-react';

type ViewMode = 'landing' | 'parent_app' | 'management_dashboard';
type AccessMode = 'login' | 'register';

const PresentationAccessModal = React.lazy(async () => {
  const module = await import('./components/PresentationAccessModal');
  return { default: module.PresentationAccessModal };
});

const getViewModeFromHash = (): ViewMode => {
  if (isParentOnlyBuild) return 'parent_app';
  if (window.location.hash.startsWith('#/escola')) return 'management_dashboard';
  if (window.location.hash.startsWith('#/responsaveis')) return 'parent_app';
  return 'landing';
};

const getSectionFromHash = (): SchoolSection => {
  const segment = window.location.hash.split('/')[2] as SchoolSection | undefined;
  return segment && SCHOOL_SECTIONS.includes(segment) ? segment : 'visao-geral';
};

const getAccessModeFromHash = (): AccessMode =>
  window.location.hash.includes('/cadastro') ? 'register' : 'login';

/** Estado antes do login: nenhuma conta ou estudante pré-carregado. */
const EMPTY_GUARDIAN: ParentAccount = { id: '', name: '', phone: '', relation: 'Responsável', childrenIds: [] };
const EMPTY_STAFF: AuthUser = { id: '', name: '', email: '', phone: '', role: 'staff', schoolUnit: '' };

const DENIAL_TITLES: Record<DenialReason, string> = {
  UNKNOWN_FACE: 'Rosto não cadastrado',
  LOW_SCORE: 'Similaridade abaixo do limiar',
  STUDENT_NOT_REGISTERED: 'Estudante fora do cadastro',
};

/** Agrupa as câmeras cadastradas por catraca (entrada e saída). */
const toTurnstiles = (devices: AccessDeviceRecord[]): Turnstile[] => {
  const byId = new Map<string, Turnstile>();
  for (const device of devices) {
    const turnstile = byId.get(device.turnstile.id)
      ?? { id: device.turnstile.id, name: device.turnstile.name, lanes: [] };
    turnstile.lanes.push({
      deviceId: device.id,
      direction: device.direction === 'ENTRY' ? 'entry' : 'exit',
      active: device.active,
      lastSeenAt: device.lastSeenAt,
    });
    byId.set(turnstile.id, turnstile);
  }
  return [...byId.values()];
};

export default function App() {
  const isOnline = useConnectivity();
  const [portalRefreshKey, setPortalRefreshKey] = useState(0);
  // Perspective Mode: 'parent_app' (Requested mobile app for parents) vs 'management_dashboard' (School portal)
  const [viewMode, setViewMode] = useState<ViewMode>(getViewModeFromHash);
  const [authenticatedUser, setAuthenticatedUser] = useState<AuthUser | null>(null);
  const [isRestoringSession, setIsRestoringSession] = useState(authApi.hasStoredSession());

  // Seção do painel escolar, refletida na URL (#/escola/<seção>).
  const [section, setSection] = useState<SchoolSection>(getSectionFromHash);

  useEffect(() => {
    const handleHashChange = () => {
      const nextView = getViewModeFromHash();
      setViewMode(nextView);
      if (nextView === 'management_dashboard') setSection(getSectionFromHash());
      if (nextView === 'landing') {
        setIsAuthModalOpen(false);
        return;
      }
      setAuthModalMode(getAccessModeFromHash());
      setAuthModalRole(nextView === 'parent_app' ? 'parent' : 'staff');
      if (!authApi.hasStoredSession()) setIsAuthModalOpen(true);
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    const endSession = () => {
      setAuthenticatedUser(null);
      setIsAuthModalOpen(true);
    };
    window.addEventListener('catraca:session-ended', endSession);
    if (!isParentOnlyBuild && viewMode === 'landing') {
      setIsRestoringSession(false);
      return () => window.removeEventListener('catraca:session-ended', endSession);
    }
    if (!authApi.hasStoredSession()) {
      setIsRestoringSession(false);
      setIsAuthModalOpen(viewMode !== 'landing');
      return () => window.removeEventListener('catraca:session-ended', endSession);
    }
    authApi.restore()
      .then((user) => handleLoginSuccess(toAuthUser(user)))
      .catch(() => {
        authApi.clear();
        setAuthenticatedUser(null);
        setIsAuthModalOpen(true);
      })
      .finally(() => setIsRestoringSession(false));
    return () => window.removeEventListener('catraca:session-ended', endSession);
  }, []);

  const navigateToView = (mode: Exclude<ViewMode, 'landing'>, accessMode?: AccessMode) => {
    if (isParentOnlyBuild && mode === 'management_dashboard') return;
    const basePath = mode === 'management_dashboard' ? '/escola' : '/responsaveis';
    // Preserva a seção atual (ex.: #/escola/estudantes) ao restaurar a sessão.
    const alreadyInside = !accessMode
      && window.location.hash.startsWith(`#${basePath}`)
      && !/\/(login|cadastro)$/.test(window.location.hash);
    if (alreadyInside) {
      setViewMode(mode);
      return;
    }
    window.location.hash = accessMode
      ? `${basePath}/${accessMode === 'register' ? 'cadastro' : 'login'}`
      : basePath;
    setViewMode(mode);
  };

  const navigateToLanding = () => {
    if (isParentOnlyBuild) return;
    const landingUrl = `${window.location.pathname}${window.location.search}#/apresentacao`;
    window.history.replaceState(null, '', landingUrl);
    setViewMode('landing');
    setIsAuthModalOpen(false);
  };

  // Usuário da sessão: tudo vem da API, nenhum dado de conta é local.
  const [currentGuardian, setCurrentGuardian] = useState<ParentAccount>(EMPTY_GUARDIAN);
  const [currentStaffUser, setCurrentStaffUser] = useState<AuthUser>(EMPTY_STAFF);

  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<AccessMode>(getAccessModeFromHash);
  const [authModalRole, setAuthModalRole] = useState<'parent' | 'staff'>(() =>
    getViewModeFromHash() === 'management_dashboard' ? 'staff' : 'parent',
  );

  const openAccess = (role: 'parent' | 'staff', mode: AccessMode = 'login') => {
    setAuthModalRole(role);
    setAuthModalMode(mode);
    navigateToView(role === 'parent' ? 'parent_app' : 'management_dashboard', mode);
    setIsAuthModalOpen(true);
  };

  const [students, setStudents] = useState<Student[]>([]);
  const [studentsState, setStudentsState] = useState<'loading' | 'persistent' | 'unavailable'>('loading');
  const [studentsError, setStudentsError] = useState<string>();
  // Recarrega eventos e justificativas só quando o conjunto de estudantes muda, não a cada consulta.
  const studentIdsKey = students.map((student) => student.id).join(',');
  const [logs, setLogs] = useState<AccessLog[]>([]);
  const [accessEventsState, setAccessEventsState] = useState<'loading' | 'persistent' | 'unavailable'>('loading');
  const [accessEventsError, setAccessEventsError] = useState<string>();
  const [accessEventsUpdatedAt, setAccessEventsUpdatedAt] = useState<string>();
  const [syncStatus, setSyncStatus] = useState<AccessEventSyncStatus | null>(null);
  const [syncStatusState, setSyncStatusState] = useState<'loading' | 'available' | 'unavailable'>('loading');
  const [syncStatusError, setSyncStatusError] = useState<string>();
  const [isRetryingSyncConflicts, setIsRetryingSyncConflicts] = useState(false);
  const [turnstiles, setTurnstiles] = useState<Turnstile[]>([]);
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);

  // Handle successful login
  const handleLoginSuccess = (user: AuthUser) => {
    if (isParentOnlyBuild && user.role === 'staff') {
      void authApi.logout().catch(() => authApi.clear());
      setAuthenticatedUser(null);
      setAuthModalRole('parent');
      setIsAuthModalOpen(true);
      return;
    }
    setAuthenticatedUser(user);
    setIsAuthModalOpen(false);
    setAuthModalMode('login');
    if (user.role === 'parent') {
      setCurrentGuardian({
        id: user.id,
        name: user.name,
        phone: user.phone,
        relation: 'Responsável',
        childrenIds: user.childrenIds || [],
      });
      navigateToView('parent_app');
    } else {
      setCurrentStaffUser(user);
      navigateToView('management_dashboard');
    }
  };

  const handleLogout = async () => {
    await authApi.logout().catch(() => authApi.clear());
    setAuthenticatedUser(null);
    resetSessionData();
    setAuthModalRole(viewMode === 'parent_app' ? 'parent' : 'staff');
    setAuthModalMode('login');
    setIsAuthModalOpen(true);
  };

  const handleSwitchAccess = async (target: Exclude<ViewMode, 'landing'>) => {
    await authApi.logout().catch(() => authApi.clear());
    setAuthenticatedUser(null);
    resetSessionData();
    setAuthModalMode('login');
    setAuthModalRole(target === 'parent_app' ? 'parent' : 'staff');
    navigateToView(target);
    setIsAuthModalOpen(true);
  };

  
  // Shared Notices and Notifications across Management and Parent App
  const [notices, setNotices] = useState<SchoolNotice[]>([]);
  const [notifications, setNotifications] = useState<ParentNotification[]>([]);
  const [communicationsState, setCommunicationsState] = useState<'loading' | 'persistent' | 'unavailable'>('loading');
  const [communicationsError, setCommunicationsError] = useState<string>();
  const [communicationsUpdatedAt, setCommunicationsUpdatedAt] = useState<string>();
  const [justifications, setJustifications] = useState<AbsenceJustification[]>([]);
  const [justificationsState, setJustificationsState] = useState<'loading' | 'persistent' | 'unavailable'>('loading');
  const [justificationsError, setJustificationsError] = useState<string>();
  const [justificationsUpdatedAt, setJustificationsUpdatedAt] = useState<string>();
  const [linkRequests, setLinkRequests] = useState<GuardianLinkRequestRecord[]>([]);
  const [linkRequestsState, setLinkRequestsState] = useState<'loading' | 'persistent' | 'unavailable'>('loading');
  const [linkRequestsError, setLinkRequestsError] = useState<string>();
  const [guardianLinks, setGuardianLinks] = useState<GuardianStudentLinkRecord[]>([]);
  const [auditRecords, setAuditRecords] = useState<AuditLogRecord[]>([]);
  const [auditState, setAuditState] = useState<'loading' | 'persistent' | 'unavailable'>('loading');
  const [auditError, setAuditError] = useState<string>();
  const [auditRefreshKey, setAuditRefreshKey] = useState(0);
  const [managedAccounts, setManagedAccounts] = useState<ManagedAccount[]>([]);
  const [accountsState, setAccountsState] = useState<'loading' | 'persistent' | 'unavailable'>('loading');
  const [accountsError, setAccountsError] = useState<string>();
  const [deliverySnapshot, setDeliverySnapshot] = useState<NotificationDeliverySnapshot>();
  const [deliveryState, setDeliveryState] = useState<'loading' | 'persistent' | 'unavailable'>('loading');
  const [deliveryError, setDeliveryError] = useState<string>();
  const [deliveryBusy, setDeliveryBusy] = useState(false);
  const [isPresentationAccessOpen, setIsPresentationAccessOpen] = useState(false);

  const canReviewLinks = authenticatedUser?.role === 'staff'
    && ['Coordenação Pedagógica', 'Direção Escolar'].includes(currentStaffUser.staffRole || '');

  useEffect(() => {
    if (!authenticatedUser) return;
    if (authenticatedUser.role === 'staff' && !canReviewLinks) {
      setLinkRequests([]);
      setLinkRequestsState('persistent');
      setLinkRequestsError(undefined);
      return;
    }
    if (!isOnline) {
      setLinkRequestsState('unavailable');
      setLinkRequestsError('Dispositivo sem conexão.');
      return;
    }
    let active = true;
    setLinkRequestsState('loading');
    const load = async () => {
      try {
        const [requests, managedLinks] = await Promise.all([
          linkRequestsApi.list(),
          authenticatedUser.role === 'staff' && canReviewLinks
            ? linkRequestsApi.listLinks()
            : Promise.resolve(undefined),
        ]);
        if (!active) return;
        setLinkRequests(requests);
        if (managedLinks) setGuardianLinks(managedLinks);
        setLinkRequestsState('persistent');
        setLinkRequestsError(undefined);
      } catch (error) {
        if (!active) return;
        setLinkRequestsState('unavailable');
        setLinkRequestsError(error instanceof Error ? error.message : 'Solicitações de vínculo indisponíveis.');
      }
    };
    void load();
    const interval = window.setInterval(() => void load(), 5000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [authenticatedUser, canReviewLinks, isOnline, portalRefreshKey]);

  const needsAdministrationData = ['contas', 'auditoria', 'ferramentas'].includes(section);

  // Estudantes da sessão: unidade inteira para a equipe, só vínculos aprovados no portal.
  useEffect(() => {
    if (!authenticatedUser) return;
    if (viewMode === 'parent_app' && authenticatedUser.role !== 'parent') return;
    if (viewMode === 'management_dashboard' && authenticatedUser.role !== 'staff') return;
    if (!isOnline) {
      setStudentsState('unavailable');
      setStudentsError('Dispositivo sem conexão.');
      return;
    }
    let active = true;
    const load = async () => {
      try {
        const loaded = authenticatedUser.role === 'parent'
          ? await studentsApi.listMine()
          : await studentsApi.listForSchool();
        if (!active) return;
        setStudents(loaded);
        setStudentsState('persistent');
        setStudentsError(undefined);
        if (authenticatedUser.role === 'parent') {
          setCurrentGuardian((current) => ({
            ...current,
            childrenIds: loaded.map((student) => student.id),
            relation: loaded[0]?.guardianRelation || 'Responsável',
          }));
        }
      } catch (error) {
        if (!active) return;
        setStudentsState('unavailable');
        setStudentsError(error instanceof Error ? error.message : 'Estudantes indisponíveis.');
      }
    };
    void load();
    // Vínculo aprovado pela escola aparece no portal sem recarregar a página.
    const interval = window.setInterval(() => void load(), 15000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [authenticatedUser, isOnline, portalRefreshKey, viewMode]);

  // Catracas (câmeras cadastradas) e pontos de atenção (leituras negadas de hoje).
  useEffect(() => {
    if (!authenticatedUser || authenticatedUser.role !== 'staff' || viewMode !== 'management_dashboard' || !isOnline) return;
    let active = true;
    const load = async () => {
      try {
        const [devices, denials] = await Promise.all([
          accessDevicesApi.listDevices(),
          accessDevicesApi.listDenials(50),
        ]);
        if (!active) return;
        setTurnstiles(toTurnstiles(devices));
        setAlerts(denials
          .filter((denial) => isToday(denial.occurredAt))
          .map((denial) => ({
            id: denial.id,
            title: DENIAL_TITLES[denial.reason],
            turnstileName: denial.turnstile.name,
            direction: denial.direction === 'ENTRY' ? 'entry' : 'exit',
            occurredAt: denial.occurredAt,
          })));
      } catch {
        // Mantém o último estado; o indicador de conexão já mostra a falha da API.
      }
    };
    void load();
    const interval = window.setInterval(() => void load(), 10000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [authenticatedUser, isOnline, viewMode]);

  useEffect(() => {
    if (!authenticatedUser || !canReviewLinks || !needsAdministrationData) return;
    if (!isOnline) {
      setAuditState('unavailable');
      setAuditError('Dispositivo sem conexão.');
      setAccountsState('unavailable');
      setAccountsError('Dispositivo sem conexão.');
      setDeliveryState('unavailable');
      setDeliveryError('Dispositivo sem conexão.');
      return;
    }
    let active = true;
    setAuditState('loading');
    setAccountsState('loading');
    setDeliveryState('loading');
    Promise.allSettled([auditApi.list(), accountsApi.list(), notificationDeliveryApi.snapshot()]).then(([auditResult, accountsResult, deliveryResult]) => {
      if (!active) return;
      if (auditResult.status === 'fulfilled') {
        setAuditRecords(auditResult.value);
        setAuditState('persistent');
        setAuditError(undefined);
      } else {
        setAuditState('unavailable');
        setAuditError(auditResult.reason instanceof Error ? auditResult.reason.message : 'Auditoria indisponível.');
      }
      if (accountsResult.status === 'fulfilled') {
        setManagedAccounts(accountsResult.value);
        setAccountsState('persistent');
        setAccountsError(undefined);
      } else {
        setAccountsState('unavailable');
        setAccountsError(accountsResult.reason instanceof Error ? accountsResult.reason.message : 'Contas indisponíveis.');
      }
      if (deliveryResult.status === 'fulfilled') {
        setDeliverySnapshot(deliveryResult.value);
        setDeliveryState('persistent');
        setDeliveryError(undefined);
      } else {
        setDeliveryState('unavailable');
        setDeliveryError(deliveryResult.reason instanceof Error ? deliveryResult.reason.message : 'Fila de entrega indisponível.');
      }
    });
    return () => { active = false; };
  }, [authenticatedUser, auditRefreshKey, canReviewLinks, isOnline, needsAdministrationData]);

  const handleUpdateAccountStatus = async (account: ManagedAccount, reason: string) => {
    const updated = await accountsApi.updateStatus(account.id, {
      status: account.status === 'ACTIVE' ? 'BLOCKED' : 'ACTIVE',
      expectedVersion: account.version,
      reason,
    });
    setManagedAccounts((current) => current.map((item) => item.id === updated.id ? updated : item));
    setAuditRefreshKey((current) => current + 1);
  };

  const handleRevokeAccountSessions = async (account: ManagedAccount, reason: string) => {
    await accountsApi.revokeSessions(account.id, { reason });
    setManagedAccounts((current) => current.map((item) => item.id === account.id ? { ...item, activeSessionCount: 0 } : item));
    setAuditRefreshKey((current) => current + 1);
  };

  const handleProcessDeliveries = async (outcome: 'DELIVER' | 'FAIL_RETRY') => {
    setDeliveryBusy(true);
    setDeliveryError(undefined);
    try {
      await notificationDeliveryApi.process({ outcome });
      setDeliverySnapshot(await notificationDeliveryApi.snapshot());
      setDeliveryState('persistent');
      setAuditRefreshKey((current) => current + 1);
    } catch (error) {
      setDeliveryState('unavailable');
      setDeliveryError(error instanceof Error ? error.message : 'Não foi possível processar a fila.');
    } finally {
      setDeliveryBusy(false);
    }
  };

  const handleRetryDeliveries = async () => {
    setDeliveryBusy(true);
    try {
      await notificationDeliveryApi.retry();
      setDeliverySnapshot(await notificationDeliveryApi.snapshot());
      setDeliveryState('persistent');
      setDeliveryError(undefined);
    } catch (error) {
      setDeliveryState('unavailable');
      setDeliveryError(error instanceof Error ? error.message : 'Não foi possível reenfileirar as entregas.');
    } finally {
      setDeliveryBusy(false);
    }
  };

  useEffect(() => {
    if (!authenticatedUser) return;
    if (viewMode === 'parent_app' && authenticatedUser.role !== 'parent') return;
    if (viewMode === 'management_dashboard' && authenticatedUser.role !== 'staff') return;
    if (!isOnline) {
      setJustificationsState('unavailable');
      setJustificationsError('Dispositivo sem conexão.');
      return;
    }
    let active = true;
    setJustificationsState('loading');
    setJustificationsError(undefined);

    const load = viewMode === 'parent_app'
      ? justificationsApi.listForGuardian(students)
      : justificationsApi.listForSchool();

    load.then((records) => {
      if (!active) return;
      setJustifications(records);
      setJustificationsState('persistent');
      setJustificationsUpdatedAt(new Date().toISOString());
    }).catch((error: unknown) => {
      if (!active) return;
      setJustificationsState('unavailable');
      setJustificationsError(error instanceof Error ? error.message : 'API de justificativas indisponível.');
    });

    return () => { active = false; };
  }, [authenticatedUser, isOnline, portalRefreshKey, studentIdsKey, viewMode]);

  useEffect(() => {
    if (!authenticatedUser) return;
    if (viewMode === 'parent_app' && authenticatedUser.role !== 'parent') return;
    if (viewMode === 'management_dashboard' && authenticatedUser.role !== 'staff') return;
    if (!isOnline) {
      setCommunicationsState('unavailable');
      setCommunicationsError('Dispositivo sem conexão.');
      return;
    }
    let active = true;
    const loadCommunications = async () => {
      try {
        const [loadedNotices, loadedNotifications] = await Promise.all([
          communicationsApi.listNotices(),
          authenticatedUser.role === 'parent' ? communicationsApi.listNotifications() : Promise.resolve([]),
        ]);
        if (!active) return;
        setNotices(loadedNotices);
        setNotifications(loadedNotifications);
        setCommunicationsState('persistent');
        setCommunicationsError(undefined);
        setCommunicationsUpdatedAt(new Date().toISOString());
      } catch (error) {
        if (!active) return;
        setCommunicationsState('unavailable');
        setCommunicationsError(error instanceof Error ? error.message : 'API de comunicados indisponível.');
      }
    };
    setCommunicationsState('loading');
    void loadCommunications();
    const interval = window.setInterval(() => void loadCommunications(), 5000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [authenticatedUser, isOnline, portalRefreshKey, viewMode]);

  useEffect(() => {
    if (!authenticatedUser) return;
    if (viewMode === 'parent_app' && authenticatedUser.role !== 'parent') return;
    if (viewMode === 'management_dashboard' && authenticatedUser.role !== 'staff') return;
    if (!isOnline) {
      setAccessEventsState('unavailable');
      setAccessEventsError('Dispositivo sem conexão.');
      return;
    }
    let active = true;

    const loadAccessEvents = async (showLoading = false) => {
      if (showLoading) setAccessEventsState('loading');
      try {
        const records = viewMode === 'parent_app'
          ? await accessEventsApi.listForGuardian(students)
          : await accessEventsApi.listForSchool(students);
        if (!active) return;
        if (viewMode === 'management_dashboard') announceNewCameraEvents(records);
        setLogs(records);
        setAccessEventsState('persistent');
        setAccessEventsError(undefined);
        setAccessEventsUpdatedAt(new Date().toISOString());
      } catch (error) {
        if (!active) return;
        setAccessEventsState('unavailable');
        setAccessEventsError(error instanceof Error ? error.message : 'API de eventos indisponível.');
      }
    };

    void loadAccessEvents(true);
    const interval = window.setInterval(() => void loadAccessEvents(), 5000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [authenticatedUser, isOnline, portalRefreshKey, studentIdsKey, viewMode]);

  useEffect(() => {
    if (!authenticatedUser || authenticatedUser.role !== 'staff' || viewMode !== 'management_dashboard') {
      setSyncStatus(null);
      return;
    }
    if (!isOnline) {
      setSyncStatusState('unavailable');
      setSyncStatusError('Dispositivo sem conexão.');
      return;
    }
    let active = true;
    const loadSyncStatus = async () => {
      try {
        const status = await accessEventsApi.getSyncStatus();
        if (!active) return;
        setSyncStatus(status);
        setSyncStatusState('available');
        setSyncStatusError(undefined);
      } catch (error) {
        if (!active) return;
        setSyncStatusState('unavailable');
        setSyncStatusError(error instanceof Error ? error.message : 'Estado da fila indisponível.');
      }
    };
    setSyncStatusState('loading');
    void loadSyncStatus();
    const interval = window.setInterval(() => void loadSyncStatus(), 5000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [authenticatedUser, isOnline, portalRefreshKey, viewMode]);

  const handleRetrySyncConflicts = async () => {
    setIsRetryingSyncConflicts(true);
    try {
      await accessEventsApi.retrySyncConflicts();
      setSyncStatus(await accessEventsApi.getSyncStatus());
      setSyncStatusState('available');
      setSyncStatusError(undefined);
    } catch (error) {
      setSyncStatusState('unavailable');
      setSyncStatusError(error instanceof Error ? error.message : 'Não foi possível reenfileirar os conflitos.');
    } finally {
      setIsRetryingSyncConflicts(false);
    }
  };

  // Eventos da câmera chegam pela consulta periódica; avisa no painel os que ainda não foram vistos.
  const seenCameraEventIds = useRef<Set<string> | null>(null);
  function announceNewCameraEvents(records: AccessLog[]) {
    const cameraEvents = records.filter((record) => record.source === 'camera');
    const seen = seenCameraEventIds.current;
    seenCameraEventIds.current = new Set(cameraEvents.map((record) => record.id));
    if (!seen) return;
    const latest = cameraEvents.find((record) => !seen.has(record.id));
    if (!latest) return;
    soundManager.playAccessGranted();
    setToastMessage({
      id: latest.id,
      title: latest.direction === 'entry' ? 'Entrada pelo protótipo facial' : 'Saída pelo protótipo facial',
      studentName: latest.studentName,
      time: latest.exactTime,
      phone: latest.notification.phoneTarget,
    });
    setTimeout(() => {
      setToastMessage((current) => current?.id === latest.id ? null : current);
    }, 4500);
  }

  // Modals state
  const [isManualReleaseOpen, setIsManualReleaseOpen] = useState<boolean>(false);
  const [isAlertsOpen, setIsAlertsOpen] = useState<boolean>(false);
  const [isProjectDocsOpen, setIsProjectDocsOpen] = useState<boolean>(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // Toast notification banner
  const [toastMessage, setToastMessage] = useState<{
    id: string;
    title: string;
    studentName: string;
    time: string;
    phone: string;
  } | null>(null);

  // Passagem assistida: entrada ou saída registrada pela equipe, com motivo e sequência conferidos pela API.
  const handleConfirmManualRelease = async (data: {
    turnstileId: string; studentId: string; direction: AccessDirection; reason: string;
  }) => {
    const student = students.find(item => item.id === data.studentId);
    const turnstile = turnstiles.find(item => item.id === data.turnstileId);
    if (!student || !turnstile) throw new Error('Selecione um estudante e uma catraca válidos.');
    const persisted = await accessEventsApi.createAssisted(student, data.direction, turnstile, data.reason, students);
    setLogs(current => [{ ...persisted, operator: currentStaffUser.name, isNew: true }, ...current]);
    setAccessEventsState('persistent');
    setAccessEventsError(undefined);
    setAccessEventsUpdatedAt(new Date().toISOString());
    soundManager.playAccessGranted();
  };

  const handleSelectStudent = (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    if (student) {
      setSelectedStudent(student);
    }
  };

  /** Ao sair, nada da sessão anterior permanece na tela da próxima conta. */
  const resetSessionData = () => {
    setCurrentGuardian(EMPTY_GUARDIAN);
    setCurrentStaffUser(EMPTY_STAFF);
    setStudents([]);
    setLogs([]);
    setJustifications([]);
    setNotices([]);
    setNotifications([]);
    setLinkRequests([]);
    setGuardianLinks([]);
    setTurnstiles([]);
    setAlerts([]);
    setSelectedStudent(null);
  };


  // Add Notice from Management Hub
  const handleAddNotice = async (noticeData: Omit<SchoolNotice, 'id'>, notifyGuardians: boolean) => {
    const newNotice = await communicationsApi.createNotice(noticeData, notifyGuardians);
    setNotices((current) => [newNotice, ...current]);
    setCommunicationsState('persistent');
    setCommunicationsError(undefined);
    setCommunicationsUpdatedAt(new Date().toISOString());

    // Show temporary toast
    setToastMessage({
      id: newNotice.id,
      title: 'Comunicado Publicado',
      studentName: notifyGuardians
        ? `${newNotice.title} (notificação interna gerada)`
        : newNotice.title,
      time: newNotice.time,
      phone: 'Todos os Responsáveis',
    });
  };

  const handleUpdateNotice = async (updatedNotice: SchoolNotice) => {
    const persisted = await communicationsApi.updateNotice(updatedNotice);
    setNotices((current) => current.map(n => n.id === persisted.id ? persisted : n));
    setCommunicationsUpdatedAt(new Date().toISOString());
  };

  const handleDeleteNotice = async (id: string) => {
    await communicationsApi.deleteNotice(id);
    setNotices((current) => current.filter(n => n.id !== id));
    setCommunicationsUpdatedAt(new Date().toISOString());
  };

  const handleBroadcastPushNotice = async (notice: SchoolNotice) => {
    await communicationsApi.broadcastNotice(notice.id);
    setCommunicationsUpdatedAt(new Date().toISOString());
  };

  const handleAddJustification = async (
    justification: Omit<AbsenceJustification, 'id' | 'submittedAt' | 'status'>,
  ) => {
    const created = await justificationsApi.create(justification);
    setJustifications((current) => [created, ...current]);
    setJustificationsState('persistent');
    setJustificationsError(undefined);
    setJustificationsUpdatedAt(new Date().toISOString());

    setNotifications(await communicationsApi.listNotifications());
    setCommunicationsUpdatedAt(new Date().toISOString());
  };

  const handleUpdateJustificationStatus = async (
    id: string,
    status: Extract<AbsenceJustification['status'], 'Aprovado pela Coordenação' | 'Recusado'>,
  ) => {
    const justification = justifications.find((item) => item.id === id);
    if (!justification) return;

    const updated = await justificationsApi.review(justification, status);
    setJustifications((current) => current.map((item) =>
      item.id === id ? { ...updated, reviewedBy: currentStaffUser.name } : item,
    ));
    setJustificationsState('persistent');
    setJustificationsError(undefined);
    setJustificationsUpdatedAt(new Date().toISOString());
  };

  const handleMarkNoticeRead = async (id: string) => {
    await communicationsApi.markNoticeRead(id);
    setNotices((current) => current.map((notice) =>
      notice.id === id ? { ...notice, isUnread: false } : notice,
    ));
    setCommunicationsUpdatedAt(new Date().toISOString());
  };

  const handleMarkAllNotificationsRead = async () => {
    await communicationsApi.markAllNotificationsRead();
    setNotifications((current) => current.map((notification) => ({ ...notification, isRead: true })));
    setCommunicationsUpdatedAt(new Date().toISOString());
  };

  const handleCreateLinkRequest = async (enrollment: string, relationship: GuardianRelationship) => {
    const created = await linkRequestsApi.create({ studentEnrollment: enrollment, relationship });
    setLinkRequests((current) => [created, ...current]);
    setLinkRequestsState('persistent');
    setLinkRequestsError(undefined);
  };

  const handleReviewLinkRequest = async (
    request: GuardianLinkRequestRecord,
    status: LinkReviewStatus,
    reviewNote?: string,
  ) => {
    const reviewed = await linkRequestsApi.review(request.id, {
      status,
      expectedVersion: request.version,
      reviewNote,
    });
    setLinkRequests((current) => current.map((item) => item.id === reviewed.id ? reviewed : item));
    if (status === 'APPROVED') setGuardianLinks(await linkRequestsApi.listLinks());
    setLinkRequestsState('persistent');
    setLinkRequestsError(undefined);
    setAuditRefreshKey((current) => current + 1);
  };

  const handleRevokeLink = async (link: GuardianStudentLinkRecord, reason: string) => {
    const revoked = await linkRequestsApi.revoke(link.guardian.id, link.student.id, {
      expectedVersion: link.version,
      reason,
    });
    setGuardianLinks((current) => current.map((item) =>
      item.guardian.id === revoked.guardian.id && item.student.id === revoked.student.id
        ? revoked
        : item,
    ));
    setLinkRequestsState('persistent');
    setLinkRequestsError(undefined);
    setAuditRefreshKey((current) => current + 1);
  };

  const parentDataUpdatedAt = [
    accessEventsUpdatedAt,
    justificationsUpdatedAt,
    communicationsUpdatedAt,
  ].filter((value): value is string => Boolean(value)).sort().at(-1);

  const activeAlertsCount = alerts.length;
  const pendingJustificationsCount = justifications.filter((item) => item.status === 'Em Análise').length;
  const pendingLinksCount = linkRequests.filter((request) => request.status === 'PENDING').length;
  const canManageSchool = ['Coordenação Pedagógica', 'Direção Escolar'].includes(currentStaffUser.staffRole || '');
  const activeSection: SchoolSection = ADMIN_SECTIONS.includes(section) && !canReviewLinks ? 'visao-geral' : section;
  const navigateSection = (target: SchoolSection) => {
    setSection(target);
    window.location.hash = `/escola/${target}`;
    document.getElementById('school-main-content')?.focus({ preventScroll: true });
    window.scrollTo({ top: 0 });
  };
  const connection = accessEventsState === 'persistent'
    ? { tone: 'positive' as const, label: 'API local conectada' }
    : accessEventsState === 'loading'
      ? { tone: 'neutral' as const, label: 'Sincronizando…' }
      : { tone: 'warning' as const, label: 'Sem sincronização' };

  if (isRestoringSession) {
    return <div role="status" className="flex min-h-screen items-center justify-center bg-surface text-sm text-muted">
      Restaurando sessão segura…
    </div>;
  }

  if (viewMode === 'landing') {
    return <LandingPage
      onParentLogin={() => openAccess('parent', 'login')}
      onParentRegister={() => openAccess('parent', 'register')}
      onSchoolLogin={() => openAccess('staff', 'login')}
    />;
  }

  if (!authenticatedUser) {
    return <div className="min-h-screen bg-white">
      <AuthModal
        isOpen
        onClose={navigateToLanding}
        initialMode={authModalMode}
        initialRole={authModalRole}
        allowedRole={isParentOnlyBuild || viewMode === 'parent_app' ? 'parent' : 'staff'}
        dismissible={!isParentOnlyBuild}
        onSwitchAccess={isParentOnlyBuild ? undefined : () => openAccess(viewMode === 'parent_app' ? 'staff' : 'parent')}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>;
  }

  const requiredRole = viewMode === 'parent_app' ? 'parent' : 'staff';
  if (authenticatedUser.role !== requiredRole) {
    return <div className="min-h-screen bg-white">
      <AuthModal
        isOpen
        onClose={() => navigateToView(authenticatedUser.role === 'parent' ? 'parent_app' : 'management_dashboard')}
        initialMode="login"
        initialRole={requiredRole}
        allowedRole={requiredRole}
        dismissible
        onSwitchAccess={() => navigateToView(authenticatedUser.role === 'parent' ? 'parent_app' : 'management_dashboard')}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>;
  }

  if (viewMode === 'parent_app') {
    return (
      <>
        <ParentAppView
          guardian={currentGuardian}
          schoolName={authenticatedUser.schoolUnit}
          students={students}
          onSwitchToManagement={isParentOnlyBuild ? undefined : () => void handleSwitchAccess('management_dashboard')}
          notices={notices}
          notifications={notifications}
          onMarkNoticeRead={handleMarkNoticeRead}
          onMarkAllNotificationsRead={handleMarkAllNotificationsRead}
          sharedAccessLogs={logs}
          sharedJustifications={justifications}
          onSubmitJustification={handleAddJustification}
          justificationsState={justificationsState}
          justificationsError={justificationsError}
          accessEventsState={accessEventsState}
          accessEventsError={accessEventsError}
          communicationsState={communicationsState}
          communicationsError={communicationsError}
          isOnline={isOnline}
          dataUpdatedAt={parentDataUpdatedAt}
          onRefreshData={() => setPortalRefreshKey((current) => current + 1)}
          linkRequests={linkRequests}
          linkRequestsState={linkRequestsState}
          linkRequestsError={linkRequestsError}
          onCreateLinkRequest={handleCreateLinkRequest}
          onLogout={handleLogout}
        />

        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          initialMode={authModalMode}
          initialRole={authModalRole}
          allowedRole="parent"
          onLoginSuccess={handleLoginSuccess}
        />
      </>
    );
  }

  return (
    <>
      <SchoolShell
        section={activeSection}
        onNavigate={navigateSection}
        canAdminister={canReviewLinks}
        user={currentStaffUser}
        counts={{
          notices: notices.length,
          pendingJustifications: pendingJustificationsCount,
          pendingLinks: pendingLinksCount,
          activeAlerts: activeAlertsCount,
        }}
        onOpenAlerts={() => setIsAlertsOpen(true)}
        onOpenProjectDocs={() => setIsProjectDocsOpen(true)}
        onSwitchToParentApp={() => void handleSwitchAccess('parent_app')}
        onLogout={() => void handleLogout()}
        connection={connection}
      >
        {activeSection === 'visao-geral' && (
          <OverviewPage
            userName={currentStaffUser.name}
            totalStudents={students.length}
            logs={logs}
            logsState={accessEventsState}
            logsError={accessEventsError}
            turnstiles={turnstiles}
            alerts={alerts}
            pendingJustifications={pendingJustificationsCount}
            pendingLinks={pendingLinksCount}
            noticesCount={notices.length}
            canAdminister={canReviewLinks}
            syncStatus={syncStatus}
            syncStatusState={syncStatusState}
            syncStatusError={syncStatusError}
            canRetrySyncConflicts={canManageSchool}
            isRetryingSyncConflicts={isRetryingSyncConflicts}
            onRetrySyncConflicts={handleRetrySyncConflicts}
            onOpenManualRelease={() => setIsManualReleaseOpen(true)}
            onOpenAlerts={() => setIsAlertsOpen(true)}
            onNavigate={navigateSection}
            onSelectStudent={handleSelectStudent}
          />
        )}

        {activeSection === 'registros' && (
          <AccessRecordsPage
            logs={logs}
            state={accessEventsState}
            error={accessEventsError}
            updatedAt={accessEventsUpdatedAt}
            onSelectStudent={handleSelectStudent}
            onOpenManualRelease={() => setIsManualReleaseOpen(true)}
          />
        )}

        {activeSection === 'estudantes' && (
          <StudentsManagementList students={students} state={studentsState} error={studentsError} onSelectStudent={handleSelectStudent} />
        )}

        {activeSection === 'comunicados' && (
          <SchoolNoticesManager
            notices={notices}
            onAddNotice={handleAddNotice}
            onUpdateNotice={handleUpdateNotice}
            onDeleteNotice={handleDeleteNotice}
            onBroadcastPush={handleBroadcastPushNotice}
            canManage={canManageSchool}
            persistenceState={communicationsState}
            persistenceError={communicationsError}
          />
        )}

        {activeSection === 'justificativas' && (
          <JustificationsManager
            justifications={justifications}
            onUpdateStatus={handleUpdateJustificationStatus}
            persistenceState={justificationsState}
            persistenceError={justificationsError}
            canReview={canManageSchool}
          />
        )}

        {activeSection === 'vinculos' && (
          <LinkRequestsManager
            requests={linkRequests}
            links={guardianLinks}
            state={linkRequestsState}
            error={linkRequestsError}
            canReview={canReviewLinks}
            onReview={handleReviewLinkRequest}
            onRevoke={handleRevokeLink}
          />
        )}

        {activeSection === 'contas' && (
          <AccountsAdministrationPanel
            accounts={managedAccounts}
            currentUserId={authenticatedUser.id}
            state={accountsState}
            error={accountsError}
            onRefresh={() => setAuditRefreshKey((current) => current + 1)}
            onUpdateStatus={handleUpdateAccountStatus}
            onRevokeSessions={handleRevokeAccountSessions}
          />
        )}

        {activeSection === 'auditoria' && (
          <AuditLogPanel
            records={auditRecords}
            state={auditState}
            error={auditError}
            onRefresh={() => setAuditRefreshKey((current) => current + 1)}
          />
        )}

        {activeSection === 'ferramentas' && (
          <ToolsPage
            onOpenManualRelease={() => setIsManualReleaseOpen(true)}
            onOpenPresentationAccess={() => setIsPresentationAccessOpen(true)}
            canManageBiometrics={canManageSchool}
            students={students}
            isOnline={isOnline}
            delivery={canReviewLinks ? (
              <NotificationDeliveryPanel
                snapshot={deliverySnapshot}
                state={deliveryState}
                error={deliveryError}
                busy={deliveryBusy}
                onRefresh={() => setAuditRefreshKey((current) => current + 1)}
                onProcess={(outcome) => void handleProcessDeliveries(outcome)}
                onRetry={() => void handleRetryDeliveries()}
              />
            ) : null}
          />
        )}
      </SchoolShell>

      {toastMessage && (
        <div role="status" aria-live="polite" className="toast fixed bottom-5 right-5 z-50 w-[calc(100%-2.5rem)] max-w-sm rounded-xl border border-line bg-white p-4 shadow-[var(--shadow-pop)]">
          <div className="flex items-start gap-3">
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-positive-soft text-positive">
              {toastMessage.phone === 'Todos os Responsáveis' ? <Megaphone aria-hidden="true" className="h-4 w-4" /> : <CheckCircle2 aria-hidden="true" className="h-4 w-4" />}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-[13px] font-semibold text-ink">{toastMessage.title}</p>
                <span className="tabular text-xs text-muted">{toastMessage.time}</span>
              </div>
              <p className="mt-0.5 truncate text-[13px] text-ink-2">{toastMessage.studentName}</p>
              <p className="mt-1 text-xs text-muted">Notificação interna registrada nesta demonstração.</p>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <ManualReleaseModal
        isOpen={isManualReleaseOpen}
        onClose={() => setIsManualReleaseOpen(false)}
        turnstiles={turnstiles}
        students={students}
        logs={logs}
        onConfirmRelease={handleConfirmManualRelease}
      />

      <StudentDetailModal
        student={selectedStudent}
        logs={logs}
        isOpen={!!selectedStudent}
        onClose={() => setSelectedStudent(null)}
      />

      <AlertsModal
        alerts={alerts}
        isOpen={isAlertsOpen}
        onClose={() => setIsAlertsOpen(false)}
      />

      <ProjectDocsModal
        isOpen={isProjectDocsOpen}
        onClose={() => setIsProjectDocsOpen(false)}
      />

      {isPresentationAccessOpen && (
        <React.Suspense fallback={null}>
          <PresentationAccessModal
            isOpen
            onClose={() => setIsPresentationAccessOpen(false)}
          />
        </React.Suspense>
      )}

      {/* Auth Modal (Login / Cadastro / Recuperação de Senha) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authModalMode}
        initialRole={authModalRole}
        allowedRole="staff"
        onLoginSuccess={handleLoginSuccess}
      />
    </>
  );
}
