import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Eye,
  EyeOff,
  KeyRound,
  LogIn,
  ShieldCheck,
  Smartphone,
  UserPlus,
  Users,
  ScrollText,
} from 'lucide-react';
import type { AuthUser } from '../types';
import { GUARDIAN_RELATIONSHIPS, type GuardianRelationship } from '../../shared/contracts/linkRequests';
import { authApi } from '../services/authApi';
import { toAuthUser } from '../services/authUserMapper';
import { BrandLockup } from './brand/BrandMark';
import { GateScene } from './brand/Illustrations';
import { Callout, Field } from './ui';

const MIN_PASSWORD_LENGTH = 8;

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
  initialRole?: 'parent' | 'staff';
  allowedRole?: 'parent' | 'staff';
  dismissible?: boolean;
  onSwitchAccess?: () => void;
  onLoginSuccess: (user: AuthUser) => void;
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
}) => {
  const loginIdentifierRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<'login' | 'register' | 'forgot_password'>(initialMode);
  const [role, setRole] = useState<'parent' | 'staff'>(initialRole);

  // Login
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loginError, setLoginError] = useState('');
  const [loginSuccess, setLoginSuccess] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Cadastro de responsável
  const [parentName, setParentName] = useState('');
  const [parentCpf, setParentCpf] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [parentRelation, setParentRelation] = useState<GuardianRelationship>('Mãe');
  const [requestedEnrollment, setRequestedEnrollment] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerPasswordConfirm, setRegisterPasswordConfirm] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setRole(allowedRole ?? initialRole);
    // Contas da equipe são criadas pela escola: o perfil escolar só tem "Entrar".
    setMode((allowedRole ?? initialRole) === 'staff' ? 'login' : initialMode);
    setLoginError('');
    setLoginSuccess('');
  }, [allowedRole, initialMode, initialRole, isOpen]);

  // Foco no identificador só quando o modal abre; re-renderizações do App não podem
  // tirar o foco do campo em que a pessoa está digitando.
  useEffect(() => {
    if (!isOpen) return undefined;
    const focusTimer = window.setTimeout(() => loginIdentifierRef.current?.focus(), 0);
    return () => window.clearTimeout(focusTimer);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && dismissible) onClose();
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [dismissible, isOpen, onClose]);

  if (!isOpen) return null;

  const handleCpfChange = (val: string) => {
    const clean = val.replace(/\D/g, '').slice(0, 11);
    let formatted = clean;
    if (clean.length > 3) formatted = `${clean.slice(0, 3)}.${clean.slice(3)}`;
    if (clean.length > 6) formatted = `${clean.slice(0, 3)}.${clean.slice(3, 6)}.${clean.slice(6)}`;
    if (clean.length > 9) formatted = `${clean.slice(0, 3)}.${clean.slice(3, 6)}.${clean.slice(6, 9)}-${clean.slice(9)}`;
    setParentCpf(formatted);
  };

  const handlePhoneChange = (val: string) => {
    const clean = val.replace(/\D/g, '').slice(0, 11);
    let formatted = clean;
    if (clean.length > 2) formatted = `(${clean.slice(0, 2)}) ${clean.slice(2)}`;
    if (clean.length > 7) formatted = `(${clean.slice(0, 2)}) ${clean.slice(2, 7)}-${clean.slice(7)}`;
    setParentPhone(formatted);
  };

  const authenticate = async (identifier: string, password: string, expectedRole: 'parent' | 'staff') => {
    setIsAuthenticating(true);
    setLoginError('');
    setLoginSuccess('Validando credenciais e criando sessão…');
    try {
      const session = await authApi.login({ identifier, password, rememberMe }, expectedRole);
      const authUser = toAuthUser(session.user);
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
      setLoginError(role === 'parent' ? 'Informe seu e-mail, celular ou CPF.' : 'Informe seu e-mail institucional ou matrícula funcional.');
      return;
    }
    if (!loginPassword) {
      setLoginError('Digite sua senha.');
      return;
    }
    void authenticate(loginIdentifier, loginPassword, role);
  };

  const handleRegisterParentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginSuccess('');
    if (parentName.trim().split(/\s+/).length < 2) {
      setLoginError('Informe nome e sobrenome.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(parentEmail.trim())) {
      setLoginError('Informe um e-mail válido. Ele será usado para entrar.');
      return;
    }
    if (parentPhone.replace(/\D/g, '').length < 10) {
      setLoginError('Informe um celular com DDD.');
      return;
    }
    if (parentCpf && parentCpf.replace(/\D/g, '').length !== 11) {
      setLoginError('O CPF deve ter 11 dígitos, ou deixe o campo em branco.');
      return;
    }
    if (requestedEnrollment.trim().length < 4) {
      setLoginError('Informe a matrícula do estudante, que a escola vai conferir.');
      return;
    }
    if (registerPassword.length < MIN_PASSWORD_LENGTH) {
      setLoginError(`A senha deve ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`);
      return;
    }
    if (registerPassword !== registerPasswordConfirm) {
      setLoginError('As senhas digitadas não coincidem.');
      return;
    }
    setIsAuthenticating(true);
    setLoginSuccess('Criando sua conta…');
    try {
      const session = await authApi.registerGuardian({
        name: parentName.trim(),
        email: parentEmail.trim(),
        phone: parentPhone,
        cpf: parentCpf || undefined,
        password: registerPassword,
        studentEnrollment: requestedEnrollment.trim(),
        relationship: parentRelation,
      });
      setLoginSuccess('Conta criada. A escola vai conferir o vínculo antes de liberar os dados do estudante.');
      onLoginSuccess(toAuthUser(session.user));
    } catch (error) {
      setLoginSuccess('');
      setLoginError(error instanceof Error ? error.message : 'Não foi possível concluir o cadastro.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const switchMode = (next: 'login' | 'register' | 'forgot_password') => {
    setMode(next);
    setLoginError('');
    setLoginSuccess('');
  };

  const isParent = role === 'parent';

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
            Protótipo acadêmico · servidor local da escola
            <br />
            Reconhecimento facial em laboratório, sem homologação.
          </p>
        </aside>

        {/* Formulário */}
        <main className="flex flex-col px-5 py-8 sm:px-10 lg:px-16 lg:py-12">
          <div className="flex items-center justify-between lg:justify-end">
            <span className="lg:hidden"><BrandLockup size={44} /></span>
            {dismissible && (
              <button type="button" className="btn-link" onClick={onClose}>
                <ArrowLeft aria-hidden="true" className="!translate-x-0" />
                <span>Voltar<span className="max-[379px]:sr-only">{' à apresentação'}</span></span>
              </button>
            )}
          </div>

          <div className="mx-auto w-full max-w-[460px] flex-1 py-10 lg:py-14">
            <p className="eyebrow">{isParent ? 'Portal dos responsáveis' : 'Painel escolar'}</p>
            <h1 id="auth-modal-title" className="display-title mt-3 text-[30px] sm:text-[34px]">
              {mode === 'forgot_password'
                ? 'Recuperar acesso.'
                : mode === 'register'
                  ? 'Criar cadastro de responsável.'
                  : (isParent ? 'Bem-vindo ao portal da família.' : 'Bem-vindo à gestão escolar.')}
            </h1>
            <p className="mt-2 text-[15px] text-ink-2">
              {mode === 'forgot_password'
                ? 'A senha é redefinida pela própria escola.'
                : mode === 'register'
                  ? 'Depois do cadastro, a escola confere o vínculo com o estudante.'
                  : (isParent ? 'Acompanhe a rotina escolar de quem você ama.' : 'Informações organizadas para cuidar de cada entrada.')}
            </p>

            {mode !== 'forgot_password' && isParent && (
              <div role="tablist" aria-label="Acesso" className="tabs mt-7">
                <button type="button" role="tab" aria-selected={mode === 'login'} className="tab inline-flex items-center gap-2" onClick={() => switchMode('login')}>
                  <LogIn aria-hidden="true" className="h-4 w-4" /> Entrar
                </button>
                <button type="button" role="tab" aria-selected={mode === 'register'} className="tab inline-flex items-center gap-2" onClick={() => switchMode('register')}>
                  <UserPlus aria-hidden="true" className="h-4 w-4" /> Criar cadastro
                </button>
              </div>
            )}

            {!allowedRole && mode !== 'forgot_password' && (
              <div className="segmented mt-5 w-full" role="group" aria-label="Perfil">
                <button type="button" className="flex-1" aria-pressed={isParent} onClick={() => setRole('parent')}>Responsáveis</button>
                <button type="button" className="flex-1" aria-pressed={!isParent} onClick={() => { setRole('staff'); switchMode('login'); }}>Gestão escolar</button>
              </div>
            )}

            <div className="mt-6 space-y-3" aria-live="polite">
              {loginError && <Callout tone="negative" role="alert">{loginError}</Callout>}
              {loginSuccess && <Callout tone={isAuthenticating ? 'info' : 'positive'} role="status">{loginSuccess}</Callout>}
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
                      placeholder={isParent ? 'nome@exemplo.com' : 'nome@escola.edu.br'}
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
                        placeholder="Digite sua senha"
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
                    Estender a duração da sessão para 30 dias
                  </label>
                  <button type="submit" className="btn btn-primary btn-lg w-full" disabled={isAuthenticating}>
                    {isAuthenticating ? 'Entrando…' : 'Entrar'}
                    {!isAuthenticating && <ArrowRight aria-hidden="true" />}
                  </button>
                </form>

                {onSwitchAccess && (
                  <button type="button" className="btn btn-secondary mt-5 w-full" onClick={onSwitchAccess}>
                    {isParent ? <Building2 aria-hidden="true" /> : <Smartphone aria-hidden="true" />}
                    {isParent ? 'Sou da equipe escolar' : 'Sou pai, mãe ou responsável'}
                  </button>
                )}
              </>
            )}

            {mode === 'register' && isParent && (
              <form onSubmit={(event) => void handleRegisterParentSubmit(event)} className="mt-6 space-y-5" noValidate>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Nome completo" htmlFor="reg-name" className="sm:col-span-2">
                    <input id="reg-name" className="input" autoComplete="name" value={parentName} onChange={(event) => setParentName(event.target.value)} />
                  </Field>
                  <Field label="Parentesco" htmlFor="reg-relation">
                    <select id="reg-relation" className="select" value={parentRelation} onChange={(event) => setParentRelation(event.target.value as GuardianRelationship)}>
                      {GUARDIAN_RELATIONSHIPS.map((item) => <option key={item} value={item}>{item}</option>)}
                    </select>
                  </Field>
                  <Field label="CPF (opcional)" htmlFor="reg-cpf">
                    <input id="reg-cpf" className="input tabular" inputMode="numeric" value={parentCpf} onChange={(event) => handleCpfChange(event.target.value)} placeholder="000.000.000-00" />
                  </Field>
                  <Field label="Celular" htmlFor="reg-phone">
                    <input id="reg-phone" className="input tabular" inputMode="tel" autoComplete="tel" value={parentPhone} onChange={(event) => handlePhoneChange(event.target.value)} placeholder="(11) 90000-0000" />
                  </Field>
                  <Field label="E-mail" htmlFor="reg-email" hint="Usado para entrar no portal.">
                    <input id="reg-email" type="email" className="input" autoComplete="email" value={parentEmail} onChange={(event) => setParentEmail(event.target.value)} />
                  </Field>
                  <Field label="Matrícula do estudante" htmlFor="reg-enrollment" hint="Será conferida pela escola antes de liberar qualquer dado." className="sm:col-span-2">
                    <input id="reg-enrollment" className="input tabular" value={requestedEnrollment} onChange={(event) => setRequestedEnrollment(event.target.value)} placeholder="Ex.: 2026-0001" />
                  </Field>
                  <Field label="Senha" htmlFor="reg-password">
                    <input id="reg-password" type="password" className="input" autoComplete="new-password" value={registerPassword} onChange={(event) => setRegisterPassword(event.target.value)} placeholder="Mínimo de 8 caracteres" />
                  </Field>
                  <Field label="Confirmar senha" htmlFor="reg-password-confirm">
                    <input id="reg-password-confirm" type="password" className="input" autoComplete="new-password" value={registerPasswordConfirm} onChange={(event) => setRegisterPasswordConfirm(event.target.value)} />
                  </Field>
                </div>
                <p className="rounded-[10px] border border-line bg-surface px-4 py-3 text-[13px] leading-relaxed text-ink-2">
                  Nenhum dado do estudante aparece antes de a escola aprovar o vínculo. O cadastro não autoriza
                  reconhecimento facial nem condiciona a frequência escolar.
                </p>
                <button type="submit" className="btn btn-primary btn-lg w-full" disabled={isAuthenticating}>
                  <UserPlus aria-hidden="true" />
                  {isAuthenticating ? 'Criando conta…' : 'Concluir cadastro'}
                </button>
              </form>
            )}

            {mode === 'forgot_password' && (
              <div className="mt-6 space-y-5">
                <button type="button" className="btn-link" onClick={() => switchMode('login')}>
                  <ArrowLeft aria-hidden="true" />
                  Voltar para entrar
                </button>
                <Callout tone="info" icon={KeyRound} title="Redefinição pela escola.">
                  Procure a Coordenação ou a Direção com um documento de identificação. A escola confere seus dados
                  e define uma nova senha de acesso. O sistema não envia códigos por SMS ou e-mail.
                </Callout>
              </div>
            )}

            <Callout tone="neutral" icon={ShieldCheck} className="mt-8">
              Acesso validado pelo servidor da escola. Cada perfil vê somente o que lhe cabe.
            </Callout>
          </div>
        </main>
      </div>
    </div>
  );
};
