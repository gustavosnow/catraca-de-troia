import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CheckCircle2,
  Eye,
  EyeOff,
  FlaskConical,
  KeyRound,
  LogIn,
  ShieldCheck,
  Smartphone,
  UserPlus,
  Users,
  ScrollText,
} from 'lucide-react';
import { AuthUser, Student } from '../types';
import { STUDENTS_DATABASE } from '../data/mockData';
import { authApi } from '../services/authApi';
import { toAuthUser } from '../services/authUserMapper';
import { BrandLockup } from './brand/BrandMark';
import { GateScene } from './brand/Illustrations';
import { Avatar, Callout, Field } from './ui';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
  initialRole?: 'parent' | 'staff';
  allowedRole?: 'parent' | 'staff';
  dismissible?: boolean;
  onSwitchAccess?: () => void;
  onLoginSuccess: (user: AuthUser) => void;
  studentsDatabase?: Student[];
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'login',
  initialRole = 'parent',
  allowedRole,
  dismissible = true,
  onSwitchAccess,
  onLoginSuccess,
  studentsDatabase = STUDENTS_DATABASE,
}) => {
  const loginIdentifierRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<'login' | 'register' | 'forgot_password'>(initialMode);
  const [role, setRole] = useState<'parent' | 'staff'>(initialRole);

  // Form states - Login
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loginError, setLoginError] = useState('');
  const [loginSuccess, setLoginSuccess] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Form states - Register Parent
  const [parentName, setParentName] = useState('');
  const [parentCpf, setParentCpf] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [parentRelation, setParentRelation] = useState<'Mãe' | 'Pai' | 'Avó / Avô' | 'Tutor(a) Legal' | 'Responsável'>('Mãe');
  const [requestedEnrollment, setRequestedEnrollment] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerPasswordConfirm, setRegisterPasswordConfirm] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);

  // Form states - Register Staff
  const [staffName, setStaffName] = useState('');
  const [staffMatricula, setStaffMatricula] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffPhone, setStaffPhone] = useState('');
  const [staffRole, setStaffRole] = useState<'Operador de Portaria & Inspetor' | 'Coordenação Pedagógica' | 'Direção Escolar' | 'Segurança Patrimonial'>('Operador de Portaria & Inspetor');
  const [schoolAuthKey, setSchoolAuthKey] = useState('');

  // Forgot password states
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [forgotStep, setForgotStep] = useState<'request' | 'code' | 'new_password' | 'done'>('request');
  const [recoveryCode, setRecoveryCode] = useState('');
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setMode(initialMode);
    setRole(allowedRole ?? initialRole);
    setLoginError('');
    setLoginSuccess('');
  }, [allowedRole, initialMode, initialRole, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const focusTimer = window.setTimeout(() => loginIdentifierRef.current?.focus(), 0);
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && dismissible) onClose();
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      window.clearTimeout(focusTimer);
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [dismissible, isOpen, onClose]);

  if (!isOpen) return null;

  // Mask CPF
  const handleCpfChange = (val: string) => {
    const clean = val.replace(/\D/g, '').slice(0, 11);
    let formatted = clean;
    if (clean.length > 3) formatted = `${clean.slice(0, 3)}.${clean.slice(3)}`;
    if (clean.length > 6) formatted = `${clean.slice(0, 3)}.${clean.slice(3, 6)}.${clean.slice(6)}`;
    if (clean.length > 9) formatted = `${clean.slice(0, 3)}.${clean.slice(3, 6)}.${clean.slice(6, 9)}-${clean.slice(9)}`;
    setParentCpf(formatted);
  };

  // Mask Phone
  const handlePhoneChange = (val: string, setter: (s: string) => void) => {
    const clean = val.replace(/\D/g, '').slice(0, 11);
    let formatted = clean;
    if (clean.length > 2) formatted = `(${clean.slice(0, 2)}) ${clean.slice(2)}`;
    if (clean.length > 7) formatted = `(${clean.slice(0, 2)}) ${clean.slice(2, 7)}-${clean.slice(7)}`;
    setter(formatted);
  };

  // Handle Login Submit
  const authenticate = async (identifier: string, password: string, expectedRole: 'parent' | 'staff') => {
    setIsAuthenticating(true);
    setLoginError('');
    setLoginSuccess('Validando credenciais e criando sessão…');
    try {
      const session = await authApi.login({ identifier, password, rememberMe });
      const authUser = toAuthUser(session.user);
      if (authUser.role !== expectedRole) {
        await authApi.logout();
        throw new Error(expectedRole === 'parent'
          ? 'Esta credencial pertence à equipe escolar.'
          : 'Esta credencial pertence a um responsável.');
      }
      setLoginSuccess(`Sessão autorizada. Olá, ${authUser.name.split(' ')[0]}.`);
      onLoginSuccess(authUser);
    } catch (error) {
      setLoginSuccess('');
      setLoginError(error instanceof Error ? error.message : 'Não foi possível autenticar.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (!loginIdentifier.trim()) {
      setLoginError('Por favor, informe seu e-mail, celular ou documento de acesso.');
      return;
    }
    if (!loginPassword) {
      setLoginError('Por favor, digite sua senha de acesso.');
      return;
    }

    void authenticate(loginIdentifier, loginPassword, role);
  };

  // Quick Demo Login Handler
  const handleQuickDemoLogin = (type: 'claudia' | 'rodrigo' | 'sem_vinculo' | 'carlos' | 'mariana') => {
    const accounts = {
      claudia: ['claudia.mendes@gmail.com', 'parent'],
      rodrigo: ['rodrigo.oliveira@gmail.com', 'parent'],
      sem_vinculo: ['sem.vinculo@gmail.com', 'parent'],
      carlos: ['carlos.mendes@emef.educacao.sp.gov.br', 'staff'],
      mariana: ['mariana.costa@emef.educacao.sp.gov.br', 'staff'],
    } as const;
    const [identifier] = accounts[type];
    void authenticate(identifier, 'Troia@2026', role);
  };

  // Handle Parent Registration Submit
  const handleRegisterParentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (!parentName.trim()) {
      setLoginError('Por favor, informe seu nome completo.');
      return;
    }
    if (!parentPhone || parentPhone.replace(/\D/g, '').length < 10) {
      setLoginError('Informe um número de celular válido.');
      return;
    }
    if (requestedEnrollment.trim().length < 4) {
      setLoginError('Informe a matrícula que deverá ser conferida pela escola.');
      return;
    }
    if (!registerPassword || registerPassword.length < 6) {
      setLoginError('A senha deve possuir pelo menos 6 caracteres.');
      return;
    }
    if (registerPassword !== registerPasswordConfirm) {
      setLoginError('As senhas digitadas não coincidem.');
      return;
    }

    setLoginSuccess('Cadastro demonstrativo recebido. Após a ativação da credencial, solicite o vínculo no portal para análise da escola.');
    setTimeout(() => {
      setMode('login');
      setLoginSuccess('Use uma conta demonstrativa já validada para entrar.');
    }, 700);
  };

  // Handle Staff Registration Submit
  const handleRegisterStaffSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (!staffName.trim()) {
      setLoginError('Por favor, informe seu nome completo.');
      return;
    }
    if (!staffMatricula.trim()) {
      setLoginError('Informe seu Registro Funcional (MAT).');
      return;
    }
    if (!staffEmail.trim() || !staffEmail.includes('@')) {
      setLoginError('Informe um e-mail institucional válido.');
      return;
    }
    if (!registerPassword || registerPassword.length < 6) {
      setLoginError('A senha deve possuir pelo menos 6 caracteres.');
      return;
    }
    if (schoolAuthKey.trim() !== 'EMEF-2026' && schoolAuthKey.trim() !== 'EMEF-2026-SP' && schoolAuthKey.trim() !== 'TROIA2026') {
      setLoginError('Chave de Unidade Escolar incorreta. Utilize "EMEF-2026-SP" para testes de homologação.');
      return;
    }

    setLoginSuccess('Solicitação demonstrativa registrada. A credencial de equipe depende de aprovação institucional.');
    setTimeout(() => {
      setMode('login');
      setLoginSuccess('Use uma conta demonstrativa já validada para entrar.');
    }, 700);
  };


  const handleForgotRequest = () => {
    if (!forgotIdentifier.trim()) {
      setLoginError('Informe seu celular ou e-mail.');
      return;
    }
    setForgotStep('code');
    setLoginError('');
    setLoginSuccess('Etapa simulada, sem envio externo. Código fictício para teste: 849201');
  };

  const handleForgotConfirm = () => {
    if (recoveryCode !== '849201' && recoveryCode.length !== 6) {
      setLoginError('Código incorreto. Use 849201 para teste.');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setLoginError('A nova senha deve ter pelo menos 6 caracteres.');
      return;
    }
    setLoginError('');
    setLoginSuccess('Senha redefinida com sucesso! Você já pode entrar com sua nova senha.');
    setTimeout(() => {
      setMode('login');
      setForgotStep('request');
    }, 1200);
  };

  const switchMode = (next: 'login' | 'register' | 'forgot_password') => {
    setMode(next);
    setLoginError('');
    if (next !== 'forgot_password') setForgotStep('request');
    if (next === 'login') setLoginSuccess('');
  };

  const isParent = role === 'parent';
  const demoAccounts: Array<{ id: 'claudia' | 'rodrigo' | 'sem_vinculo' | 'carlos' | 'mariana'; name: string; detail: string }> = isParent
    ? [
        { id: 'claudia', name: 'Cláudia Mendes', detail: 'Mãe de Ana Clara e Arthur' },
        { id: 'rodrigo', name: 'Rodrigo Oliveira', detail: 'Pai de Gabriel e Sophia' },
        { id: 'sem_vinculo', name: 'Responsável sem vínculo', detail: 'Testar a solicitação à escola' },
      ]
    : [
        { id: 'mariana', name: 'Profª Mariana Costa', detail: 'Coordenação Pedagógica' },
        { id: 'carlos', name: 'Carlos Mendes', detail: 'Portaria e inspeção' },
      ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
      className="fixed inset-0 z-[70] overflow-y-auto bg-white"
    >
      <div className="grid min-h-full lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        {/* Painel da marca */}
        <aside className="relative hidden flex-col justify-between overflow-hidden border-r border-brand-line bg-[#fff7f0] px-12 py-12 lg:flex xl:px-20">
          <BrandLockup size={64} />
          <div className="max-w-md">
            <p className="eyebrow">Cuidado que começa na entrada</p>
            <h2 className="display-title mt-5 text-[44px]">
              Mais segurança.
              <span className="block text-action">Mais tranquilidade.</span>
            </h2>
            <p className="mt-5 text-[15px] leading-relaxed text-ink-2">
              Uma visão clara das movimentações, dos estudantes e das informações que precisam da sua atenção.
            </p>
            <ul className="mt-7 space-y-3.5 text-[15px] text-ink">
              {[
                [ShieldCheck, 'Acesso conforme o seu perfil'],
                [Users, 'Vínculos validados pela escola'],
                [ScrollText, 'Registros com rastreabilidade'],
              ].map(([Icon, label]) => {
                const IconComponent = Icon as typeof ShieldCheck;
                return (
                  <li key={label as string} className="flex items-center gap-3">
                    <IconComponent aria-hidden="true" className="h-[18px] w-[18px] text-action" />
                    {label as string}
                  </li>
                );
              })}
            </ul>
            <GateScene className="mt-10 h-auto w-full max-w-[420px]" />
          </div>
          <p className="text-[13px] leading-relaxed text-muted">
            Protótipo acadêmico local · Dados fictícios
            <br />
            Hardware e biometria não integrados.
          </p>
        </aside>

        {/* Formulário */}
        <main className="flex flex-col px-5 py-8 sm:px-10 lg:px-16 lg:py-12">
          <div className="flex items-center justify-between lg:justify-end">
            <span className="lg:hidden"><BrandLockup size={44} /></span>
            {dismissible && (
              <button type="button" className="btn-link" onClick={onClose}>
                <ArrowLeft aria-hidden="true" className="!translate-x-0" />
                Voltar à apresentação
              </button>
            )}
          </div>

          <div className="mx-auto w-full max-w-[460px] flex-1 py-10 lg:py-14">
            <p className="eyebrow">{isParent ? 'Portal dos responsáveis' : 'Painel escolar'}</p>
            <h1 id="auth-modal-title" className="display-title mt-3 text-[30px] sm:text-[34px]">
              {mode === 'forgot_password'
                ? 'Recuperar acesso.'
                : mode === 'register'
                  ? (isParent ? 'Criar cadastro de responsável.' : 'Solicitar credencial da equipe.')
                  : (isParent ? 'Bem-vindo ao portal da família.' : 'Bem-vindo à gestão escolar.')}
            </h1>
            <p className="mt-2 text-[15px] text-ink-2">
              {mode === 'forgot_password'
                ? 'Etapa demonstrativa: nenhum código é enviado por canal externo.'
                : mode === 'register'
                  ? (isParent ? 'Depois do cadastro, a escola confere o vínculo com o estudante.' : 'A credencial depende de aprovação institucional.')
                  : (isParent ? 'Acompanhe a rotina escolar de quem você ama.' : 'Informações organizadas para cuidar de cada entrada.')}
            </p>

            {mode !== 'forgot_password' && (
              <div role="tablist" aria-label="Acesso" className="tabs mt-7">
                <button type="button" role="tab" aria-selected={mode === 'login'} className="tab inline-flex items-center gap-2" onClick={() => switchMode('login')}>
                  <LogIn aria-hidden="true" className="h-4 w-4" /> Entrar
                </button>
                <button type="button" role="tab" aria-selected={mode === 'register'} className="tab inline-flex items-center gap-2" onClick={() => switchMode('register')}>
                  <UserPlus aria-hidden="true" className="h-4 w-4" /> {isParent ? 'Criar cadastro' : 'Solicitar credencial'}
                </button>
              </div>
            )}

            {!allowedRole && mode !== 'forgot_password' && (
              <div className="segmented mt-5 w-full" role="group" aria-label="Perfil">
                <button type="button" className="flex-1" aria-pressed={isParent} onClick={() => setRole('parent')}>Responsáveis</button>
                <button type="button" className="flex-1" aria-pressed={!isParent} onClick={() => setRole('staff')}>Gestão escolar</button>
              </div>
            )}

            <div className="mt-6 space-y-3" aria-live="polite">
              {loginError && <Callout tone="negative" role="alert">{loginError}</Callout>}
              {loginSuccess && <Callout tone={loginSuccess.startsWith('Validando') ? 'info' : 'positive'} role="status">{loginSuccess}</Callout>}
            </div>

            {mode === 'login' && (
              <>
                <form onSubmit={handleLoginSubmit} className="mt-6 space-y-5" noValidate>
                  <Field label={isParent ? 'Celular, CPF ou e-mail' : 'E-mail institucional ou matrícula funcional'} htmlFor="auth-identifier">
                    <input
                      id="auth-identifier"
                      ref={loginIdentifierRef}
                      className="input h-11"
                      autoComplete="username"
                      value={loginIdentifier}
                      onChange={(event) => setLoginIdentifier(event.target.value)}
                      placeholder={isParent ? 'nome@exemplo.com' : 'nome@escola.example'}
                    />
                  </Field>
                  <div>
                    <div className="mb-1.5 flex items-center justify-between">
                      <label htmlFor="auth-password" className="field-label mb-0">Senha</label>
                      <button type="button" className="btn-link text-xs" onClick={() => switchMode('forgot_password')}>Esqueci minha senha</button>
                    </div>
                    <div className="relative">
                      <input
                        id="auth-password"
                        type={showPassword ? 'text' : 'password'}
                        className="input h-11 pr-11"
                        autoComplete="current-password"
                        value={loginPassword}
                        onChange={(event) => setLoginPassword(event.target.value)}
                        placeholder="Digite a senha demonstrativa"
                      />
                      <button
                        type="button"
                        className="icon-btn absolute right-1 top-1/2 -translate-y-1/2"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                        aria-pressed={showPassword}
                      >
                        {showPassword ? <EyeOff /> : <Eye />}
                      </button>
                    </div>
                  </div>
                  <label htmlFor="auth-remember" className="flex cursor-pointer items-center gap-2.5 text-[13px] text-ink-2">
                    <input id="auth-remember" type="checkbox" className="checkbox" checked={rememberMe} onChange={(event) => setRememberMe(event.target.checked)} />
                    Lembrar este dispositivo
                  </label>
                  <button type="submit" className="btn btn-primary btn-lg w-full" disabled={isAuthenticating}>
                    {isAuthenticating ? 'Entrando…' : 'Entrar'}
                    {!isAuthenticating && <ArrowRight aria-hidden="true" />}
                  </button>
                </form>

                <section aria-labelledby="demo-accounts-title" className="mt-8 border-t border-line pt-6">
                  <div className="flex items-baseline justify-between gap-3">
                    <h2 id="demo-accounts-title" className="text-[13px] font-semibold text-ink">Contas de demonstração</h2>
                    <span className="text-xs text-muted">Senha: <span className="font-mono text-ink-2">Troia@2026</span></span>
                  </div>
                  <ul className="mt-3 divide-y divide-line rounded-[10px] border border-line">
                    {demoAccounts.map((account) => (
                      <li key={account.id}>
                        <button
                          type="button"
                          className="group flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-surface disabled:opacity-60"
                          onClick={() => handleQuickDemoLogin(account.id)}
                          disabled={isAuthenticating}
                        >
                          <Avatar name={account.name} />
                          <span className="min-w-0 flex-1">
                            <span className="block text-sm font-semibold text-ink">{account.name}</span>
                            <span className="block text-xs text-muted">{account.detail}</span>
                          </span>
                          <ArrowRight aria-hidden="true" className="h-4 w-4 text-subtle transition-transform group-hover:translate-x-0.5 group-hover:text-action" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>

                {onSwitchAccess && (
                  <button type="button" className="btn btn-secondary mt-5 w-full" onClick={onSwitchAccess}>
                    {isParent ? <Building2 aria-hidden="true" /> : <Smartphone aria-hidden="true" />}
                    {isParent ? 'Sou da equipe escolar' : 'Sou pai, mãe ou responsável'}
                  </button>
                )}
              </>
            )}

            {mode === 'register' && isParent && (
              <form onSubmit={handleRegisterParentSubmit} className="mt-6 space-y-5" noValidate>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Nome completo" htmlFor="reg-name" className="sm:col-span-2">
                    <input id="reg-name" className="input" autoComplete="name" value={parentName} onChange={(event) => setParentName(event.target.value)} />
                  </Field>
                  <Field label="Parentesco" htmlFor="reg-relation">
                    <select id="reg-relation" className="select" value={parentRelation} onChange={(event) => setParentRelation(event.target.value as typeof parentRelation)}>
                      <option value="Mãe">Mãe</option>
                      <option value="Pai">Pai</option>
                      <option value="Avó / Avô">Avó / Avô</option>
                      <option value="Tutor(a) Legal">Tutor(a) legal</option>
                      <option value="Responsável">Responsável</option>
                    </select>
                  </Field>
                  <Field label="CPF" htmlFor="reg-cpf">
                    <input id="reg-cpf" className="input tabular" inputMode="numeric" value={parentCpf} onChange={(event) => handleCpfChange(event.target.value)} placeholder="000.000.000-00" />
                  </Field>
                  <Field label="Celular" htmlFor="reg-phone">
                    <input id="reg-phone" className="input tabular" inputMode="tel" autoComplete="tel" value={parentPhone} onChange={(event) => handlePhoneChange(event.target.value, setParentPhone)} placeholder="(11) 98765-4321" />
                  </Field>
                  <Field label="E-mail (opcional)" htmlFor="reg-email">
                    <input id="reg-email" type="email" className="input" autoComplete="email" value={parentEmail} onChange={(event) => setParentEmail(event.target.value)} />
                  </Field>
                  <Field label="Matrícula do estudante" htmlFor="reg-enrollment" hint="Será conferida pela escola antes de liberar qualquer dado." className="sm:col-span-2">
                    <input id="reg-enrollment" className="input tabular" value={requestedEnrollment} onChange={(event) => setRequestedEnrollment(event.target.value)} placeholder="Ex.: 2024-0182" />
                  </Field>
                  <Field label="Senha" htmlFor="reg-password">
                    <input id="reg-password" type="password" className="input" autoComplete="new-password" value={registerPassword} onChange={(event) => setRegisterPassword(event.target.value)} placeholder="Mínimo de 6 caracteres" />
                  </Field>
                  <Field label="Confirmar senha" htmlFor="reg-password-confirm">
                    <input id="reg-password-confirm" type="password" className="input" autoComplete="new-password" value={registerPasswordConfirm} onChange={(event) => setRegisterPasswordConfirm(event.target.value)} />
                  </Field>
                </div>
                <label htmlFor="reg-notify" className="flex cursor-pointer items-start gap-3 rounded-[10px] border border-line bg-surface px-4 py-3 text-[13px] text-ink-2">
                  <input id="reg-notify" type="checkbox" className="checkbox mt-0.5" checked={acceptTerms} onChange={(event) => setAcceptTerms(event.target.checked)} />
                  <span>Quero receber avisos de entrada e saída (preferência demonstrativa). O tratamento biométrico e o vínculo com estudantes dependem de validação institucional.</span>
                </label>
                <button type="submit" className="btn btn-primary btn-lg w-full">
                  <UserPlus aria-hidden="true" />
                  Concluir cadastro
                </button>
              </form>
            )}

            {mode === 'register' && !isParent && (
              <form onSubmit={handleRegisterStaffSubmit} className="mt-6 space-y-5" noValidate>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Nome completo" htmlFor="staff-name" className="sm:col-span-2">
                    <input id="staff-name" className="input" autoComplete="name" value={staffName} onChange={(event) => setStaffName(event.target.value)} />
                  </Field>
                  <Field label="Matrícula funcional" htmlFor="staff-registry">
                    <input id="staff-registry" className="input" value={staffMatricula} onChange={(event) => setStaffMatricula(event.target.value)} placeholder="MAT-2026/0481" />
                  </Field>
                  <Field label="Função" htmlFor="staff-role">
                    <select id="staff-role" className="select" value={staffRole} onChange={(event) => setStaffRole(event.target.value as typeof staffRole)}>
                      <option value="Operador de Portaria & Inspetor">Portaria e inspeção</option>
                      <option value="Coordenação Pedagógica">Coordenação Pedagógica</option>
                      <option value="Direção Escolar">Direção Escolar</option>
                      <option value="Segurança Patrimonial">Segurança Patrimonial</option>
                    </select>
                  </Field>
                  <Field label="E-mail institucional" htmlFor="staff-email">
                    <input id="staff-email" type="email" className="input" autoComplete="email" value={staffEmail} onChange={(event) => setStaffEmail(event.target.value)} placeholder="nome@escola.example" />
                  </Field>
                  <Field label="Telefone ou ramal (opcional)" htmlFor="staff-phone">
                    <input id="staff-phone" className="input tabular" inputMode="tel" value={staffPhone} onChange={(event) => handlePhoneChange(event.target.value, setStaffPhone)} />
                  </Field>
                  <Field label="Chave da unidade escolar" htmlFor="staff-key" hint="Para testes de homologação use EMEF-2026-SP." className="sm:col-span-2">
                    <input id="staff-key" className="input font-mono" value={schoolAuthKey} onChange={(event) => setSchoolAuthKey(event.target.value)} />
                  </Field>
                  <Field label="Senha" htmlFor="staff-password">
                    <input id="staff-password" type="password" className="input" autoComplete="new-password" value={registerPassword} onChange={(event) => setRegisterPassword(event.target.value)} placeholder="Mínimo de 6 caracteres" />
                  </Field>
                  <Field label="Confirmar senha" htmlFor="staff-password-confirm">
                    <input id="staff-password-confirm" type="password" className="input" autoComplete="new-password" value={registerPasswordConfirm} onChange={(event) => setRegisterPasswordConfirm(event.target.value)} />
                  </Field>
                </div>
                <button type="submit" className="btn btn-primary btn-lg w-full">
                  <KeyRound aria-hidden="true" />
                  Solicitar credencial
                </button>
              </form>
            )}

            {mode === 'forgot_password' && (
              <div className="mt-6 space-y-5">
                <button type="button" className="btn-link" onClick={() => switchMode('login')}>
                  <ArrowLeft aria-hidden="true" />
                  Voltar para entrar
                </button>
                {forgotStep === 'request' ? (
                  <>
                    <Field label="Celular ou e-mail cadastrado" htmlFor="forgot-identifier">
                      <input id="forgot-identifier" className="input h-11" value={forgotIdentifier} onChange={(event) => setForgotIdentifier(event.target.value)} />
                    </Field>
                    <button type="button" className="btn btn-primary btn-lg w-full" onClick={handleForgotRequest}>Gerar código de recuperação</button>
                  </>
                ) : (
                  <>
                    <Field label="Código de 6 dígitos" htmlFor="forgot-code">
                      <input id="forgot-code" className="input h-11 tabular tracking-[0.4em]" inputMode="numeric" maxLength={6} value={recoveryCode} onChange={(event) => setRecoveryCode(event.target.value.replace(/\D/g, ''))} placeholder="000000" />
                    </Field>
                    <Field label="Nova senha" htmlFor="forgot-password">
                      <input id="forgot-password" type="password" className="input h-11" autoComplete="new-password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} placeholder="Mínimo de 6 caracteres" />
                    </Field>
                    <button type="button" className="btn btn-primary btn-lg w-full" onClick={handleForgotConfirm}>
                      <CheckCircle2 aria-hidden="true" />
                      Redefinir senha
                    </button>
                  </>
                )}
              </div>
            )}

            <Callout tone="neutral" icon={FlaskConical} className="mt-8">
              Sessão validada pela API local com contas fictícias. Cadastro, recuperação e identidade institucional permanecem demonstrativos.
            </Callout>
          </div>
        </main>
      </div>
    </div>
  );
};
