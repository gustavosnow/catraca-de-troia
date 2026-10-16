import { DemoNotice } from './components/DemoNotice';
import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { MetricCards } from './components/MetricCards';
import { LiveStreamFeed } from './components/LiveStreamFeed';
import { SideActionsPanel } from './components/SideActionsPanel';
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
import { 
  STUDENTS_DATABASE, 
  INITIAL_TURNSTILES, 
  INITIAL_ALERTS,
  PARENT_ACCOUNTS,
  ParentAccount,
  STAFF_ACCOUNTS,
  StaffAccount
} from './data/mockData';
import { AccessDirection, AccessLog, Shift, Student, Turnstile, SecurityAlert, SchoolNotice, ParentNotification, AuthUser, AbsenceJustification } from './types';
import { soundManager } from './utils/sound';
import { isParentOnlyBuild } from './config/runtime';
import { justificationsApi } from './services/justificationsApi';
import { accessEventsApi } from './services/accessEventsApi';
import { authApi } from './services/authApi';
import { toAuthUser } from './services/authUserMapper';
import { communicationsApi } from './services/communicationsApi';
import { useConnectivity } from './hooks/useConnectivity';
import { linkRequestsApi } from './services/linkRequestsApi';
import { auditApi } from './services/auditApi';
import { accountsApi } from './services/accountsApi';
import { notificationDeliveryApi } from './services/notificationDeliveryApi';
import type { AuditLogRecord } from '../shared/contracts/audit';
import type { ManagedAccount } from '../shared/contracts/accountAdministration';
import type { NotificationDeliverySnapshot } from '../shared/contracts/notificationDelivery';
import type { AccessEventSyncStatus } from '../shared/contracts/accessEventSync';
import type {
  GuardianLinkRequestRecord,
  GuardianStudentLinkRecord,
  GuardianRelationship,
  LinkReviewStatus,
} from '../shared/contracts/linkRequests';

import { 
  Bell, 
  ShieldCheck, 
  MessageSquare, 
  CheckCircle2, 
  Info,
  ExternalLink,
  Sparkles,
  Smartphone,
  LayoutDashboard,
  Megaphone,
  Users,
  Activity
} from 'lucide-react';

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

const getAccessModeFromHash = (): AccessMode =>
  window.location.hash.includes('/cadastro') ? 'register' : 'login';

export default function App() {
  const isOnline = useConnectivity();
  const [portalRefreshKey, setPortalRefreshKey] = useState(0);
  // Perspective Mode: 'parent_app' (Requested mobile app for parents) vs 'management_dashboard' (School portal)
  const [viewMode, setViewMode] = useState<ViewMode>(getViewModeFromHash);
  const [authenticatedUser, setAuthenticatedUser] = useState<AuthUser | null>(null);
  const [isRestoringSession, setIsRestoringSession] = useState(authApi.hasStoredSession());

  // School management sub-tab: 'catracas' | 'avisos' | 'alunos'
  const [managementTab, setManagementTab] = useState<'catracas' | 'avisos' | 'alunos' | 'justificativas' | 'auditoria'>('catracas');

  useEffect(() => {
    const handleHashChange = () => {
      const nextView = getViewModeFromHash();
      setViewMode(nextView);
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
    window.location.hash = accessMode
      ? `${basePath}/${accessMode === 'register' ? 'cadastro' : 'login'}`
      : basePath;
    setViewMode(mode);
  };

  const navigateToLanding = () => {
    if (isParentOnlyBuild) return;
    window.location.hash = '/apresentacao';
    setViewMode('landing');
    setIsAuthModalOpen(false);
  };

  // Auth & Accounts State
  const [guardiansList, setGuardiansList] = useState<ParentAccount[]>(PARENT_ACCOUNTS);
  const [currentGuardian, setCurrentGuardian] = useState<ParentAccount>(PARENT_ACCOUNTS[0]);
  const [currentStaffUser, setCurrentStaffUser] = useState<AuthUser>({
    id: STAFF_ACCOUNTS[0].id,
    name: STAFF_ACCOUNTS[0].name,
    email: STAFF_ACCOUNTS[0].email,
    phone: STAFF_ACCOUNTS[0].phone,
    role: 'staff',
    staffRole: STAFF_ACCOUNTS[0].role,
    functionalRegistry: STAFF_ACCOUNTS[0].functionalRegistry,
    schoolUnit: STAFF_ACCOUNTS[0].schoolUnit,
    avatar: STAFF_ACCOUNTS[0].avatar,
  });

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

  const [students, setStudents] = useState<Student[]>(STUDENTS_DATABASE);
  const [logs, setLogs] = useState<AccessLog[]>([]);
  const [accessEventsState, setAccessEventsState] = useState<'loading' | 'persistent' | 'unavailable'>('loading');
  const [accessEventsError, setAccessEventsError] = useState<string>();
  const [accessEventsUpdatedAt, setAccessEventsUpdatedAt] = useState<string>();
  const [syncStatus, setSyncStatus] = useState<AccessEventSyncStatus | null>(null);
  const [syncStatusState, setSyncStatusState] = useState<'loading' | 'available' | 'unavailable'>('loading');
  const [syncStatusError, setSyncStatusError] = useState<string>();
  const [isRetryingSyncConflicts, setIsRetryingSyncConflicts] = useState(false);
  const [turnstiles, setTurnstiles] = useState<Turnstile[]>(INITIAL_TURNSTILES);
  const [alerts, setAlerts] = useState<SecurityAlert[]>(INITIAL_ALERTS);

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
      let matchedGuardian = guardiansList.find(g => g.id === user.id);
      if (!matchedGuardian) {
        matchedGuardian = {
          id: user.id,
          name: user.name,
          phone: user.phone || '(11) 98765-4321',
          relation: user.guardianRelation || 'Responsável',
          childrenIds: user.childrenIds || [],
        };
        setGuardiansList(prev => [matchedGuardian!, ...prev]);
      }
      setCurrentGuardian(matchedGuardian);
      navigateToView('parent_app');
    } else {
      setCurrentStaffUser(user);
      navigateToView('management_dashboard');
    }
  };

  const handleLogout = async () => {
    await authApi.logout().catch(() => authApi.clear());
    setAuthenticatedUser(null);
    setAuthModalRole(viewMode === 'parent_app' ? 'parent' : 'staff');
    setAuthModalMode('login');
    setIsAuthModalOpen(true);
  };

  const handleSwitchAccess = async (target: Exclude<ViewMode, 'landing'>) => {
    await authApi.logout().catch(() => authApi.clear());
    setAuthenticatedUser(null);
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
        const [requests, linkedStudents, managedLinks] = await Promise.all([
          linkRequestsApi.list(),
          authenticatedUser.role === 'parent'
            ? justificationsApi.listLinkedStudents()
            : Promise.resolve(undefined),
          authenticatedUser.role === 'staff' && canReviewLinks
            ? linkRequestsApi.listLinks()
            : Promise.resolve(undefined),
        ]);
        if (!active) return;
        setLinkRequests(requests);
        if (managedLinks) setGuardianLinks(managedLinks);
        if (linkedStudents) {
          const childrenIds = linkedStudents.map((student) => student.id);
          setCurrentGuardian((current) => ({ ...current, childrenIds }));
        }
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

  useEffect(() => {
    if (!authenticatedUser || !canReviewLinks || managementTab !== 'auditoria') return;
    if (!isOnline) {
      setAuditState('unavailable');
      setAuditError('Dispositivo sem conexão.');
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
  }, [authenticatedUser, auditRefreshKey, canReviewLinks, isOnline, managementTab]);

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
      ? justificationsApi.listForGuardian()
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
  }, [authenticatedUser, currentGuardian.id, currentStaffUser.id, isOnline, portalRefreshKey, viewMode]);

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
  }, [authenticatedUser, currentGuardian.id, currentStaffUser.id, isOnline, portalRefreshKey, viewMode]);

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
  }, [authenticatedUser, currentGuardian.id, currentStaffUser.id, isOnline, portalRefreshKey, students, viewMode]);

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
  }, [authenticatedUser, currentStaffUser.id, isOnline, portalRefreshKey, viewMode]);

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

  // Real-time live simulation state
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [selectedTurno, setSelectedTurno] = useState<Shift>('Todos');
  const [selectedTurma, setSelectedTurma] = useState<string>('Todas');

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

  const studentPoolIndex = useRef(0);

  // Helper to trigger a new student access
  const triggerStudentAccess = async (customStudent?: Student, direction: AccessDirection = 'entry') => {
    const student = customStudent || students[studentPoolIndex.current % students.length];
    studentPoolIndex.current += 1;

    const turnstile = turnstiles[Math.floor(Math.random() * turnstiles.length)];
    let newLog: AccessLog;
    try {
      newLog = await accessEventsApi.create(
        student,
        direction,
        turnstile,
        students,
      );
      newLog = { ...newLog, relativeTime: 'Agora', isNew: true };
      setAccessEventsState('persistent');
      setAccessEventsError(undefined);
      setAccessEventsUpdatedAt(new Date().toISOString());
    } catch (error) {
      setAccessEventsState('unavailable');
      setAccessEventsError(error instanceof Error ? error.message : 'Não foi possível registrar o evento.');
      return;
    }

    const exactTime = newLog.exactTime;
    // Play pleasant chime
    soundManager.playAccessGranted();

    // Update Logs
    setLogs((prev) => [newLog, ...prev.slice(0, 49)]);

    // Update turnstiles count
    setTurnstiles((prev) => 
      prev.map(t => t.id === turnstile.id ? { ...t, passesToday: t.passesToday + 1 } : t)
    );

    // Show temporary live toast in dashboard
    setToastMessage({
      id: newLog.id,
      title: direction === 'entry' ? 'Entrada Registrada' : 'Saída Registrada',
      studentName: student.name,
      time: exactTime,
      phone: student.guardianPhone,
    });

    setTimeout(() => {
      setToastMessage((current) => current?.id === newLog.id ? null : current);
    }, 4500);
  };

  // Automatic Simulation Loop
  useEffect(() => {
    if (!isSimulating) return;

    const interval = setInterval(() => {
      triggerStudentAccess();
    }, 9000); // Trigger a new student entrance every 9 seconds

    return () => clearInterval(interval);
  }, [currentStaffUser.id, isSimulating, students, turnstiles, viewMode]);

  // Handle manual turnstile authorization
  const handleConfirmManualRelease = async (data: {
    turnstileId: string;
    studentId?: string;
    visitorName?: string;
    reason: string;
    sendWhatsapp: boolean;
  }) => {
    const turnstile = turnstiles.find(t => t.id === data.turnstileId) || turnstiles[0];
    const now = new Date();
    let exactTime = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    let studentName = data.visitorName || 'Visitante Autorizado';
    let turma = 'Visitante / Secretaria';
    let shift: 'Manhã' | 'Tarde' | 'Integral' = 'Manhã';
    let avatar = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80';
    let matricula = 'VIS-' + Math.floor(1000 + Math.random() * 9000);
    let guardianPhone = '(11) 98888-0000';
    let foundStudent: Student | undefined;

    if (data.studentId) {
      foundStudent = students.find(s => s.id === data.studentId);
      if (foundStudent) {
        studentName = foundStudent.name;
        turma = foundStudent.turma;
        shift = foundStudent.shift;
        avatar = foundStudent.avatar;
        matricula = foundStudent.matricula;
        guardianPhone = foundStudent.guardianPhone;
      }
    }

    let manualLog: AccessLog = {
      id: `manual-log-${Date.now()}`,
      studentId: data.studentId || 'visitor',
      studentName: studentName,
      matricula: matricula,
      avatar: avatar,
      turma: turma,
      shift: shift,
      timestamp: now.toISOString(),
      exactTime: exactTime,
      relativeTime: 'Agora',
      direction: 'entry',
      turnstileId: turnstile.id,
      turnstileName: turnstile.name.split(' - ')[0],
      status: 'LiberacaoManual',
      method: 'Manual',
      reason: data.reason,
      operator: currentStaffUser.name,
      notification: {
        whatsapp: data.sendWhatsapp ? 'Entregue' : 'Pendente',
        pushApp: 'Entregue',
        sentAt: exactTime,
        phoneTarget: guardianPhone,
      },
      isNew: true,
    };

    if (foundStudent) {
      try {
        const persisted = await accessEventsApi.create(
          foundStudent,
          'entry',
          turnstile,
          students,
          {
            status: 'MANUAL_RELEASE',
            method: 'MANUAL',
            whatsappStatus: data.sendWhatsapp ? 'DELIVERED' : 'PENDING',
            pushStatus: 'DELIVERED',
            reason: data.reason,
          },
        );
        exactTime = persisted.exactTime;
        manualLog = {
          ...persisted,
          reason: data.reason,
          operator: currentStaffUser.name,
          relativeTime: 'Agora',
          isNew: true,
        };
        setAccessEventsState('persistent');
        setAccessEventsError(undefined);
        setAccessEventsUpdatedAt(new Date().toISOString());
      } catch (error) {
        setAccessEventsState('unavailable');
        setAccessEventsError(error instanceof Error ? error.message : 'Não foi possível registrar a liberação.');
        throw error;
      }
    }

    setLogs((prev) => [manualLog, ...prev]);
    setTurnstiles((prev) =>
      prev.map(t => t.id === turnstile.id ? { ...t, passesToday: t.passesToday + 1 } : t)
    );

  };

  const handleSelectStudent = (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    if (student) {
      setSelectedStudent(student);
    }
  };

  const handleResolveAlert = (alertId: string) => {
    setAlerts((prev) => prev.map(a => a.id === alertId ? { ...a, resolved: true } : a));
  };

  // Direct WhatsApp Contact from School Staff with Parent
  const handleDirectWhatsapp = (phone: string, studentName: string, templateType?: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    let msg = `Olá, aqui é da equipe de Gestão Escolar da E.E. Tróia Educação Integrada. Entramos em contato a respeito do(a) estudante ${studentName}.`;
    
    if (templateType === 'atraso') {
      msg = `Olá, informamos que o(a) estudante ${studentName} registrou entrada após o horário regular de tolerância na E.E. Tróia. Ficamos à disposição para quaisquer esclarecimentos.`;
    } else if (templateType === 'documento') {
      msg = `Olá, solicitamos a gentileza de encaminhar a justificativa ou atestado médico referente à ausência recente do(a) estudante ${studentName} pelo App ou secretaria escolar.`;
    }

    const text = encodeURIComponent(msg);
    window.open(`https://wa.me/55${cleanPhone}?text=${text}`, '_blank');
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
    attachment?: File,
  ) => {
    const created = await justificationsApi.create(justification, attachment);
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

  // Dynamic calculations for KPI cards
  const totalRegistered = students.length;
  const entriesCount = logs.filter((log) => log.direction === 'entry').length;
  const latestDirectionByStudent = new Map<string, AccessDirection>();
  [...logs]
    .sort((left, right) => new Date(left.timestamp).getTime() - new Date(right.timestamp).getTime())
    .forEach((log) => latestDirectionByStudent.set(log.studentId, log.direction));
  const studentsOnCampus = [...latestDirectionByStudent.values()].filter((direction) => direction === 'entry').length;
  const presenceRate = totalRegistered === 0 ? 0 : Math.min(100, (studentsOnCampus / totalRegistered) * 100);
  const activeAlertsCount = alerts.filter(a => !a.resolved).length;

  if (isRestoringSession) {
    return <div className="min-h-screen bg-slate-950 text-slate-200 flex items-center justify-center text-sm">
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
    return <div className="min-h-screen bg-slate-950">
      <AuthModal
        isOpen
        onClose={navigateToLanding}
        initialMode={authModalMode}
        initialRole={authModalRole}
        allowedRole={isParentOnlyBuild || viewMode === 'parent_app' ? 'parent' : 'staff'}
        dismissible={!isParentOnlyBuild}
        onSwitchAccess={isParentOnlyBuild ? undefined : () => openAccess(viewMode === 'parent_app' ? 'staff' : 'parent')}
        onLoginSuccess={handleLoginSuccess}
        studentsDatabase={students}
      />
    </div>;
  }

  const requiredRole = viewMode === 'parent_app' ? 'parent' : 'staff';
  if (authenticatedUser.role !== requiredRole) {
    return <div className="min-h-screen bg-slate-950">
      <AuthModal
        isOpen
        onClose={() => navigateToView(authenticatedUser.role === 'parent' ? 'parent_app' : 'management_dashboard')}
        initialMode="login"
        initialRole={requiredRole}
        allowedRole={requiredRole}
        dismissible
        onSwitchAccess={() => navigateToView(authenticatedUser.role === 'parent' ? 'parent_app' : 'management_dashboard')}
        onLoginSuccess={handleLoginSuccess}
        studentsDatabase={students}
      />
    </div>;
  }

  if (viewMode === 'parent_app') {
    return (
      <>
        <ParentAppView 
          onSwitchToManagement={isParentOnlyBuild ? undefined : () => void handleSwitchAccess('management_dashboard')}
          sharedNotices={notices}
          onUpdateSharedNotices={setNotices}
          sharedNotifications={notifications}
          onUpdateSharedNotifications={setNotifications}
          onMarkNoticeRead={handleMarkNoticeRead}
          onMarkAllNotificationsRead={handleMarkAllNotificationsRead}
          guardiansList={[currentGuardian]}
          currentGuardianExternal={currentGuardian}
          onSelectGuardianExternal={setCurrentGuardian}
          studentsList={students}
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
          studentsDatabase={students}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-orange-500 selection:text-white">
      <a href="#school-main-content" className="fixed left-3 top-3 z-[100] -translate-y-24 rounded-lg bg-orange-600 px-4 py-2 text-sm font-bold text-white shadow-lg transition-transform focus:translate-y-0">
        Ir para o conteúdo principal
      </a>
      <DemoNotice />
      
      {/* Streamlined Unified Header (Navigation, Brand, Status & Actions in one place) */}
      <Header
        isSimulating={isSimulating}
        onToggleSimulation={() => setIsSimulating(!isSimulating)}
        onTriggerManualTap={() => triggerStudentAccess()}
        onOpenManualRelease={() => setIsManualReleaseOpen(true)}
        onOpenProjectDocs={() => setIsProjectDocsOpen(true)}
        onOpenPresentationAccess={() => setIsPresentationAccessOpen(true)}
        activeTab={managementTab}
        onSelectTab={setManagementTab}
        noticesCount={notices.length}
        pendingJustificationsCount={justifications.filter((item) => item.status === 'Em Análise').length}
        onSwitchToParentApp={() => void handleSwitchAccess('parent_app')}
        currentStaffUser={currentStaffUser}
        onLogout={handleLogout}
        canViewAudit={canReviewLinks}
      />

      {/* Main Dashboard Container */}
      <main id="school-main-content" tabIndex={-1} className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5">
        <div role="status" aria-live="polite" className={`mb-4 rounded-xl border px-4 py-2 text-xs ${
          accessEventsState === 'persistent'
            ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
            : accessEventsState === 'loading'
              ? 'border-blue-200 bg-blue-50 text-blue-800'
              : 'border-amber-200 bg-amber-50 text-amber-900'
        }`}>
          {accessEventsState === 'persistent'
            ? 'Eventos de entrada/saída sincronizados com a API local demonstrativa.'
            : accessEventsState === 'loading'
              ? 'Sincronizando eventos de acesso…'
              : `Eventos sem sincronização: ${accessEventsError || 'API local indisponível.'}`}
        </div>
        
        {/* VIEW TAB 1: Monitoramento de Catracas */}
        {managementTab === 'catracas' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            {/* Top Metric Cards */}
            <MetricCards
              totalStudents={totalRegistered}
              entriesToday={entriesCount}
              studentsOnCampus={studentsOnCampus}
              presencePercentage={presenceRate}
              alertsCount={activeAlertsCount}
              onOpenAlerts={() => setIsAlertsOpen(true)}
            />

            {/* Main Two-Column Layout: Live Stream Feed (Left) & Side Actions Panel (Right) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              
              {/* Left / Center: Live Access Stream Feed (Takes 2 Columns on Desktop) */}
              <div className="lg:col-span-2 space-y-4">
                <LiveStreamFeed
                  logs={logs}
                  onSelectStudent={handleSelectStudent}
                  onResendNotification={(logId) => {
                    const log = logs.find(l => l.id === logId);
                    if (log) {
                      handleDirectWhatsapp(log.notification.phoneTarget, log.studentName);
                    }
                  }}
                  selectedTurno={selectedTurno}
                  selectedTurma={selectedTurma}
                />
              </div>

              {/* Right: Quick Action Controls, Manual Unlock, Filters, Hardware Status (Takes 1 Column) */}
              <div className="lg:col-span-1">
                <SideActionsPanel
                  onOpenManualRelease={() => setIsManualReleaseOpen(true)}
                  onSelectStudent={handleSelectStudent}
                  students={students}
                  turnstiles={turnstiles}
                  selectedTurno={selectedTurno}
                  onSelectTurno={setSelectedTurno}
                  selectedTurma={selectedTurma}
                  onSelectTurma={setSelectedTurma}
                  onTriggerManualTap={() => triggerStudentAccess()}
                  syncStatus={syncStatus}
                  syncStatusState={syncStatusState}
                  syncStatusError={syncStatusError}
                  canRetrySyncConflicts={currentStaffUser.staffRole === 'Coordenação Pedagógica'
                    || currentStaffUser.staffRole === 'Direção Escolar'}
                  isRetryingSyncConflicts={isRetryingSyncConflicts}
                  onRetrySyncConflicts={handleRetrySyncConflicts}
                />
              </div>

            </div>
          </div>
        )}

        {/* VIEW TAB 2: Avisos & Comunicados da Gestão Escolar */}
        {managementTab === 'avisos' && (
          <div className="animate-in fade-in duration-150">
            <SchoolNoticesManager
              notices={notices}
              onAddNotice={handleAddNotice}
              onUpdateNotice={handleUpdateNotice}
              onDeleteNotice={handleDeleteNotice}
              onBroadcastPush={handleBroadcastPushNotice}
              canManage={['Coordenação Pedagógica', 'Direção Escolar'].includes(currentStaffUser.staffRole || '')}
              persistenceState={communicationsState}
              persistenceError={communicationsError}
            />
          </div>
        )}

        {/* VIEW TAB 3: Diretório de Alunos & Contato WhatsApp */}
        {managementTab === 'alunos' && (
          <div className="animate-in fade-in duration-150">
            {canReviewLinks && (
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
            <StudentsManagementList
              students={students}
              onSelectStudent={handleSelectStudent}
              onSendWhatsappDirect={handleDirectWhatsapp}
            />
          </div>
        )}

        {managementTab === 'justificativas' && (
          <div className="animate-in fade-in duration-150">
            <JustificationsManager
              justifications={justifications}
              onUpdateStatus={handleUpdateJustificationStatus}
              persistenceState={justificationsState}
              persistenceError={justificationsError}
              canReview={['Coordenação Pedagógica', 'Direção Escolar'].includes(currentStaffUser.staffRole || '')}
            />
          </div>
        )}

        {managementTab === 'auditoria' && canReviewLinks && (
          <div className="space-y-5 animate-in fade-in duration-150">
            <AccountsAdministrationPanel
              accounts={managedAccounts}
              currentUserId={authenticatedUser.id}
              state={accountsState}
              error={accountsError}
              onRefresh={() => setAuditRefreshKey((current) => current + 1)}
              onUpdateStatus={handleUpdateAccountStatus}
              onRevokeSessions={handleRevokeAccountSessions}
            />
            <NotificationDeliveryPanel
              snapshot={deliverySnapshot}
              state={deliveryState}
              error={deliveryError}
              busy={deliveryBusy}
              onRefresh={() => setAuditRefreshKey((current) => current + 1)}
              onProcess={(outcome) => void handleProcessDeliveries(outcome)}
              onRetry={() => void handleRetryDeliveries()}
            />
            <AuditLogPanel
              records={auditRecords}
              state={auditState}
              error={auditError}
              onRefresh={() => setAuditRefreshKey((current) => current + 1)}
            />
          </div>
        )}

      </main>

      {/* Floating Real-Time Entrance Toast */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-40 max-w-sm w-full bg-white rounded-2xl shadow-xl border border-slate-200 p-4 animate-in slide-in-from-bottom-5 duration-300">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-900">{toastMessage.title}</h4>
                <span className="text-[11px] font-mono text-slate-400 font-bold">{toastMessage.time}</span>
              </div>
              <p className="text-xs font-semibold text-slate-800 truncate mt-0.5">
                {toastMessage.studentName}
              </p>
              <div className="flex items-center gap-1.5 text-[11px] text-sky-700 font-medium mt-1">
                <Smartphone className="w-3.5 h-3.5 text-sky-600" />
                <span>Notificação interna registrada nesta demonstração</span>
              </div>
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
        onConfirmRelease={handleConfirmManualRelease}
      />

      <StudentDetailModal
        student={selectedStudent}
        logs={logs}
        isOpen={!!selectedStudent}
        onClose={() => setSelectedStudent(null)}
        onSendWhatsappDirect={handleDirectWhatsapp}
      />

      <AlertsModal
        alerts={alerts}
        isOpen={isAlertsOpen}
        onClose={() => setIsAlertsOpen(false)}
        onResolveAlert={handleResolveAlert}
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
        studentsDatabase={students}
      />

    </div>
  );
}
