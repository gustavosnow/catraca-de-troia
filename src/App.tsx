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
import type { AccessEventSyncStatus } from '../shared/contracts/accessEventSync';

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

type ViewMode = 'parent_app' | 'management_dashboard';

const getViewModeFromHash = (): ViewMode =>
  !isParentOnlyBuild && window.location.hash === '#/escola' ? 'management_dashboard' : 'parent_app';

export default function App() {
  const isOnline = useConnectivity();
  const [portalRefreshKey, setPortalRefreshKey] = useState(0);
  // Perspective Mode: 'parent_app' (Requested mobile app for parents) vs 'management_dashboard' (School portal)
  const [viewMode, setViewMode] = useState<ViewMode>(getViewModeFromHash);
  const [authenticatedUser, setAuthenticatedUser] = useState<AuthUser | null>(null);
  const [isRestoringSession, setIsRestoringSession] = useState(authApi.hasStoredSession());

  // School management sub-tab: 'catracas' | 'avisos' | 'alunos'
  const [managementTab, setManagementTab] = useState<'catracas' | 'avisos' | 'alunos' | 'justificativas'>('catracas');

  useEffect(() => {
    const handleHashChange = () => setViewMode(getViewModeFromHash());
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    const endSession = () => {
      setAuthenticatedUser(null);
      setIsAuthModalOpen(true);
    };
    window.addEventListener('catraca:session-ended', endSession);
    if (!authApi.hasStoredSession()) {
      setIsRestoringSession(false);
      setIsAuthModalOpen(true);
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

  const navigateToView = (mode: ViewMode) => {
    if (isParentOnlyBuild && mode === 'management_dashboard') return;
    window.location.hash = mode === 'management_dashboard' ? '/escola' : '/responsaveis';
    setViewMode(mode);
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
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  const [authModalRole, setAuthModalRole] = useState<'parent' | 'staff'>('parent');

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

  // Helper to open AuthModal
  const openAuthModal = (mode: 'login' | 'register' = 'login', role: 'parent' | 'staff' = 'parent') => {
    setAuthModalMode(mode);
    setAuthModalRole(role);
    setIsAuthModalOpen(true);
  };

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

  const parentDataUpdatedAt = [
    accessEventsUpdatedAt,
    justificationsUpdatedAt,
    communicationsUpdatedAt,
  ].filter((value): value is string => Boolean(value)).sort().at(-1);

  // Dynamic calculations for KPI cards
  const totalRegistered = 1240;
  const entriesCount = logs.length + 887; // Base count + live session items
  const presenceRate = Math.min(100, (entriesCount / totalRegistered) * 100);
  const activeAlertsCount = alerts.filter(a => !a.resolved).length;

  if (isRestoringSession) {
    return <div className="min-h-screen bg-slate-950 text-slate-200 flex items-center justify-center text-sm">
      Restaurando sessão segura…
    </div>;
  }

  if (!authenticatedUser) {
    return <div className="min-h-screen bg-slate-950">
      <AuthModal
        isOpen
        onClose={() => undefined}
        initialMode="login"
        initialRole={isParentOnlyBuild || viewMode === 'parent_app' ? 'parent' : 'staff'}
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
        onLoginSuccess={handleLoginSuccess}
        studentsDatabase={students}
      />
    </div>;
  }

  if (viewMode === 'parent_app') {
    return (
      <>
        <ParentAppView 
          onSwitchToManagement={isParentOnlyBuild ? undefined : () => navigateToView('management_dashboard')}
          sharedNotices={notices}
          onUpdateSharedNotices={setNotices}
          sharedNotifications={notifications}
          onUpdateSharedNotifications={setNotifications}
          onMarkNoticeRead={handleMarkNoticeRead}
          onMarkAllNotificationsRead={handleMarkAllNotificationsRead}
          guardiansList={[currentGuardian]}
          currentGuardianExternal={currentGuardian}
          onSelectGuardianExternal={setCurrentGuardian}
          onOpenAuthModal={(mode) => openAuthModal(mode, 'parent')}
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
          onLogout={handleLogout}
        />

        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          initialMode={authModalMode}
          initialRole={authModalRole}
          onLoginSuccess={handleLoginSuccess}
          studentsDatabase={students}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-orange-500 selection:text-white">
      <DemoNotice />
      
      {/* Streamlined Unified Header (Navigation, Brand, Status & Actions in one place) */}
      <Header
        isSimulating={isSimulating}
        onToggleSimulation={() => setIsSimulating(!isSimulating)}
        onTriggerManualTap={() => triggerStudentAccess()}
        onOpenManualRelease={() => setIsManualReleaseOpen(true)}
        onOpenProjectDocs={() => setIsProjectDocsOpen(true)}
        activeTab={managementTab}
        onSelectTab={setManagementTab}
        noticesCount={notices.length}
        pendingJustificationsCount={justifications.filter((item) => item.status === 'Em Análise').length}
        onSwitchToParentApp={() => navigateToView('parent_app')}
        currentStaffUser={currentStaffUser}
        onOpenAuthModal={(mode, role) => openAuthModal(mode, role)}
        onLogout={handleLogout}
      />

      {/* Main Dashboard Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5">
        <div className={`mb-4 rounded-xl border px-4 py-2 text-xs ${
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
                <span>Notificação enviada ao App dos Pais (Push Entregue)</span>
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

      {/* Auth Modal (Login / Cadastro / Recuperação de Senha) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authModalMode}
        initialRole={authModalRole}
        onLoginSuccess={handleLoginSuccess}
        studentsDatabase={students}
      />

    </div>
  );
}
