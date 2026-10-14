import React, { useEffect, useState } from 'react';
import { 
  X, 
  Lock, 
  Mail, 
  Phone, 
  User, 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  School, 
  CheckCircle2, 
  AlertCircle, 
  UserPlus, 
  LogIn, 
  KeyRound, 
  ChevronRight, 
  Sparkles,
  Smartphone,
  Search,
  Check,
  Building2,
  HelpCircle,
  ArrowLeft,
  Users
} from 'lucide-react';
import { AuthUser, Student } from '../types';
import { PARENT_ACCOUNTS, STAFF_ACCOUNTS, STUDENTS_DATABASE } from '../data/mockData';
import { CatracaTroiaLogo } from './CatracaTroiaLogo';
import { authApi } from '../services/authApi';
import { toAuthUser } from '../services/authUserMapper';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
  initialRole?: 'parent' | 'staff';
  onLoginSuccess: (user: AuthUser) => void;
  studentsDatabase?: Student[];
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'login',
  initialRole = 'parent',
  onLoginSuccess,
  studentsDatabase = STUDENTS_DATABASE,
}) => {
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
  const [selectedChildrenIds, setSelectedChildrenIds] = useState<string[]>(['std-1']);
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerPasswordConfirm, setRegisterPasswordConfirm] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [studentSearchTerm, setStudentSearchTerm] = useState('');

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
    setRole(initialRole);
    setLoginError('');
    setLoginSuccess('');
  }, [initialMode, initialRole, isOpen]);

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
      onClose();
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
  const handleQuickDemoLogin = (type: 'claudia' | 'rodrigo' | 'carlos' | 'mariana') => {
    const accounts = {
      claudia: ['claudia.mendes@gmail.com', 'parent'],
      rodrigo: ['rodrigo.oliveira@gmail.com', 'parent'],
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
      setLoginError('Informe um número de celular/WhatsApp válido para notificações.');
      return;
    }
    if (selectedChildrenIds.length === 0) {
      setLoginError('Vincule ao menos um(a) estudante (filho/dependente) à sua conta.');
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

    setLoginSuccess('Solicitação demonstrativa registrada. A escola ainda precisa validar o vínculo e criar a credencial no serviço de identidade.');
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

  // Filter students for linking in parent registration
  const filteredStudents = studentsDatabase.filter(s => 
    s.name.toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
    s.matricula.toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
    s.turma.toLowerCase().includes(studentSearchTerm.toLowerCase())
  );

  const toggleStudentSelection = (studentId: string) => {
    if (selectedChildrenIds.includes(studentId)) {
      if (selectedChildrenIds.length === 1) {
        setLoginError('Mantenha ao menos um(a) estudante selecionado(a).');
        return;
      }
      setSelectedChildrenIds(selectedChildrenIds.filter(id => id !== studentId));
    } else {
      setSelectedChildrenIds([...selectedChildrenIds, studentId]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      
      {/* Modal Card */}
      <div 
        className="bg-[#0B192C] text-white rounded-3xl border border-slate-700/80 shadow-2xl w-full max-w-xl my-auto overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow ambient background */}
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-orange-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />

        {/* Header Superior */}
        <div className="p-5 sm:p-6 border-b border-slate-800/80 relative z-10 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <CatracaTroiaLogo size={42} variant="dark" showText={false} />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-base sm:text-lg font-black text-white tracking-tight">Catraca de Tróia</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-orange-500/20 text-orange-400 border border-orange-500/30">
                  EMEF
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                {mode === 'login' && 'Autenticação de Acesso Escolar'}
                {mode === 'register' && 'Novo Cadastro no Sistema'}
                {mode === 'forgot_password' && 'Recuperação de Senha Segura'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs (Login / Cadastro) */}
        {mode !== 'forgot_password' && (
          <div className="px-5 sm:px-6 pt-4 pb-2 border-b border-slate-800/60 flex items-center justify-between gap-2">
            <div className="flex rounded-xl bg-slate-900/90 p-1 border border-slate-800 w-full">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setLoginError('');
                }}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  mode === 'login'
                    ? 'bg-orange-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Entrar (Login)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setLoginError('');
                }}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  mode === 'register'
                    ? 'bg-orange-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Criar Conta (Cadastro)</span>
              </button>
            </div>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-5 sm:p-6 relative z-10 max-h-[72vh] overflow-y-auto space-y-4 custom-scrollbar">
          
          <p className="text-xs text-amber-200">Sessão validada pela API local com contas fictícias. Cadastro, recuperação e integração com identidade institucional permanecem demonstrativos.</p>
          {/* Feedback Messages */}
          {loginError && (
            <div className="p-3 rounded-xl bg-red-950/70 border border-red-800/60 text-red-300 text-xs flex items-center gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          {loginSuccess && (
            <div className="p-3 rounded-xl bg-emerald-950/70 border border-emerald-800/60 text-emerald-300 text-xs flex items-center gap-2.5 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{loginSuccess}</span>
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* TELA 1: LOGIN                                                 */}
          {/* ------------------------------------------------------------- */}
          {mode === 'login' && (
            <div className="space-y-4">
              
              {/* Role Switcher (Pais vs Equipe) */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setRole('parent')}
                  className={`flex-1 p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    role === 'parent'
                      ? 'bg-slate-800/90 border-orange-500/70 text-orange-300 shadow-md ring-1 ring-orange-500/30'
                      : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:bg-slate-850'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5 text-orange-400" />
                  <span>Portal dos Pais / Família</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRole('staff')}
                  className={`flex-1 p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    role === 'staff'
                      ? 'bg-slate-800/90 border-orange-500/70 text-orange-300 shadow-md ring-1 ring-orange-500/30'
                      : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:bg-slate-850'
                  }`}
                >
                  <School className="w-3.5 h-3.5 text-orange-400" />
                  <span>Gestão Escolar & Portaria</span>
                </button>
              </div>

              {/* Formulário de Login */}
              <form onSubmit={handleLoginSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    {role === 'parent' ? 'Celular com WhatsApp, CPF ou E-mail' : 'E-mail Institucional ou Reg. Funcional (MAT)'}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      {role === 'parent' ? <Phone className="w-4 h-4" /> : <Mail className="w-4 h-4" />}
                    </div>
                    <input
                      type="text"
                      value={loginIdentifier}
                      onChange={(e) => setLoginIdentifier(e.target.value)}
                      placeholder={role === 'parent' ? 'Ex: (11) 98765-4321 ou claudia@gmail.com' : 'Ex: carlos.mendes@emef.educacao.sp.gov.br'}
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-300">Senha de Acesso</label>
                    <button
                      type="button"
                      onClick={() => setMode('forgot_password')}
                      className="text-[11px] text-orange-400 hover:text-orange-300 cursor-pointer font-medium"
                    >
                      Esqueceu a senha?
                    </button>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-10 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-orange-600 focus:ring-orange-500"
                    />
                    <span>Lembrar meu dispositivo</span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isAuthenticating}
                  className="w-full py-2.5 px-4 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-extrabold text-xs shadow-lg shadow-orange-950/40 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2"
                >
                  <LogIn className="w-4 h-4" />
                  <span>{isAuthenticating ? 'Validando…' : 'Entrar no Sistema'}</span>
                </button>
              </form>

              {/* Acesso Rápido de Demonstração (1-Clique) */}
              <div className="pt-3 border-t border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span className="font-bold uppercase tracking-wider text-orange-400/90">Acesso Rápido (Demonstração)</span>
                  <span>Senha: Troia@2026</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickDemoLogin('claudia')}
                    className="p-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-left transition-colors cursor-pointer"
                  >
                    <div className="text-xs font-bold text-white truncate">Cláudia Mendes</div>
                    <div className="text-[10px] text-slate-400 truncate">Mãe de 2 alunos (Ana e Arthur)</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickDemoLogin('rodrigo')}
                    className="p-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-left transition-colors cursor-pointer"
                  >
                    <div className="text-xs font-bold text-white truncate">Rodrigo Oliveira</div>
                    <div className="text-[10px] text-slate-400 truncate">Pai de Gabriel e Sophia</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickDemoLogin('carlos')}
                    className="p-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-left transition-colors cursor-pointer"
                  >
                    <div className="text-xs font-bold text-white truncate">Carlos Mendes</div>
                    <div className="text-[10px] text-orange-400 font-medium truncate">Inspetor & Operador</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickDemoLogin('mariana')}
                    className="p-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-left transition-colors cursor-pointer"
                  >
                    <div className="text-xs font-bold text-white truncate">Profª Mariana Costa</div>
                    <div className="text-[10px] text-orange-400 font-medium truncate">Coordenação Pedagógica</div>
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* TELA 2: CADASTRO                                              */}
          {/* ------------------------------------------------------------- */}
          {mode === 'register' && (
            <div className="space-y-4">
              
              {/* Role Switcher para Cadastro */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setRole('parent')}
                  className={`flex-1 p-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    role === 'parent'
                      ? 'bg-slate-800/90 border-orange-500/70 text-orange-300 shadow-md ring-1 ring-orange-500/30'
                      : 'bg-slate-900/50 border-slate-800 text-slate-400'
                  }`}
                >
                  <Users className="w-3.5 h-3.5 text-orange-400" />
                  <span>Responsável (Pai / Mãe)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRole('staff')}
                  className={`flex-1 p-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    role === 'staff'
                      ? 'bg-slate-800/90 border-orange-500/70 text-orange-300 shadow-md ring-1 ring-orange-500/30'
                      : 'bg-slate-900/50 border-slate-800 text-slate-400'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5 text-orange-400" />
                  <span>Equipe Escolar / Portaria</span>
                </button>
              </div>

              {/* FORM CADASTRO: RESPONSÁVEL */}
              {role === 'parent' && (
                <form onSubmit={handleRegisterParentSubmit} className="space-y-3.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Nome Completo *</label>
                      <input
                        type="text"
                        value={parentName}
                        onChange={(e) => setParentName(e.target.value)}
                        placeholder="Ex: Vanessa de Souza"
                        className="w-full px-3 py-2 bg-slate-900/90 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Grau de Parentesco *</label>
                      <select
                        value={parentRelation}
                        onChange={(e) => setParentRelation(e.target.value as any)}
                        className="w-full px-3 py-2 bg-slate-900/90 border border-slate-700/80 rounded-xl text-xs text-white focus:outline-none focus:border-orange-500 cursor-pointer"
                      >
                        <option value="Mãe">Mãe</option>
                        <option value="Pai">Pai</option>
                        <option value="Avó / Avô">Avó / Avô</option>
                        <option value="Tutor(a) Legal">Tutor(a) Legal</option>
                        <option value="Responsável">Responsável</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">CPF (Documento) *</label>
                      <input
                        type="text"
                        value={parentCpf}
                        onChange={(e) => handleCpfChange(e.target.value)}
                        placeholder="000.000.000-00"
                        className="w-full px-3 py-2 bg-slate-900/90 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 font-mono"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">WhatsApp / Celular *</label>
                      <input
                        type="text"
                        value={parentPhone}
                        onChange={(e) => handlePhoneChange(e.target.value, setParentPhone)}
                        placeholder="(11) 98765-4321"
                        className="w-full px-3 py-2 bg-slate-900/90 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 font-mono"
                        required
                      />
                      <span className="text-[10px] text-orange-400/90 mt-0.5 block">
                        Receberá os alertas instantâneos de passagem na catraca
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">E-mail para Avisos</label>
                    <input
                      type="email"
                      value={parentEmail}
                      onChange={(e) => setParentEmail(e.target.value)}
                      placeholder="seu.email@exemplo.com"
                      className="w-full px-3 py-2 bg-slate-900/90 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  {/* Vínculo de Aluno(s) */}
                  <div className="p-3 bg-slate-900/90 rounded-2xl border border-slate-700/80 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-white flex items-center gap-1.5">
                        <School className="w-3.5 h-3.5 text-orange-400" />
                        <span>Vincular Estudante(s) na EMEF</span>
                      </label>
                      <span className="text-[11px] text-orange-300 font-semibold">
                        {selectedChildrenIds.length} selecionado(s)
                      </span>
                    </div>

                    {/* Search box for students */}
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                      <input
                        type="text"
                        value={studentSearchTerm}
                        onChange={(e) => setStudentSearchTerm(e.target.value)}
                        placeholder="Buscar por nome do filho, turma ou matrícula..."
                        className="w-full pl-8 pr-3 py-1.5 bg-slate-800/90 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                      />
                    </div>

                    {/* Students list */}
                    <div className="space-y-1.5 max-h-36 overflow-y-auto custom-scrollbar pr-1">
                      {filteredStudents.slice(0, 6).map((std) => {
                        const isSelected = selectedChildrenIds.includes(std.id);
                        return (
                          <div
                            key={std.id}
                            onClick={() => toggleStudentSelection(std.id)}
                            className={`p-2 rounded-xl border flex items-center justify-between gap-2 cursor-pointer transition-all ${
                              isSelected
                                ? 'bg-orange-950/40 border-orange-500/70 text-white'
                                : 'bg-slate-800/40 border-slate-700/50 hover:bg-slate-800/70 text-slate-300'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <img
                                src={std.avatar}
                                alt={std.name}
                                className="w-7 h-7 rounded-lg object-cover shrink-0"
                                referrerPolicy="no-referrer"
                              />
                              <div className="min-w-0">
                                <div className="text-xs font-bold truncate">{std.name}</div>
                                <div className="text-[10px] text-slate-400 flex items-center gap-1.5">
                                  <span>{std.turma}</span>
                                  <span>•</span>
                                  <span className="font-mono">#{std.matricula}</span>
                                </div>
                              </div>
                            </div>

                            <div className="shrink-0">
                              {isSelected ? (
                                <span className="w-5 h-5 rounded-full bg-orange-600 text-white flex items-center justify-center">
                                  <Check className="w-3 h-3" />
                                </span>
                              ) : (
                                <span className="text-[10px] text-slate-400 font-semibold px-2 py-0.5 rounded bg-slate-700">
                                  Vincular
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Senha e Confirmação */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Criar Senha *</label>
                      <input
                        type="password"
                        value={registerPassword}
                        onChange={(e) => setRegisterPassword(e.target.value)}
                        placeholder="Mínimo 6 caracteres"
                        className="w-full px-3 py-2 bg-slate-900/90 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Confirmar Senha *</label>
                      <input
                        type="password"
                        value={registerPasswordConfirm}
                        onChange={(e) => setRegisterPasswordConfirm(e.target.value)}
                        placeholder="Repita a senha"
                        className="w-full px-3 py-2 bg-slate-900/90 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                        required
                      />
                    </div>
                  </div>

                  <label className="flex items-start gap-2 text-xs text-slate-300 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={acceptTerms}
                      onChange={(e) => setAcceptTerms(e.target.checked)}
                      className="w-4 h-4 mt-0.5 rounded border-slate-700 bg-slate-900 text-orange-600 focus:ring-orange-500"
                    />
                    <span>
                      Desejo receber notificações sobre entrada e saída (preferência demonstrativa). O tratamento biométrico e o vínculo com estudantes dependem de validação institucional.
                    </span>
                  </label>

                  <button
                    type="submit"
                    className="w-full py-2.5 px-4 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-extrabold text-xs shadow-lg shadow-orange-950/40 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Concluir Cadastro & Acessar</span>
                  </button>
                </form>
              )}

              {/* FORM CADASTRO: EQUIPE ESCOLAR */}
              {role === 'staff' && (
                <form onSubmit={handleRegisterStaffSubmit} className="space-y-3.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Nome Completo *</label>
                      <input
                        type="text"
                        value={staffName}
                        onChange={(e) => setStaffName(e.target.value)}
                        placeholder="Ex: Marcos Vinicius"
                        className="w-full px-3 py-2 bg-slate-900/90 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Registro Funcional (MAT) *</label>
                      <input
                        type="text"
                        value={staffMatricula}
                        onChange={(e) => setStaffMatricula(e.target.value)}
                        placeholder="Ex: 0481 ou MAT-2026/0481"
                        className="w-full px-3 py-2 bg-slate-900/90 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 font-mono"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Função / Cargo *</label>
                      <select
                        value={staffRole}
                        onChange={(e) => setStaffRole(e.target.value as any)}
                        className="w-full px-3 py-2 bg-slate-900/90 border border-slate-700/80 rounded-xl text-xs text-white focus:outline-none focus:border-orange-500 cursor-pointer"
                      >
                        <option value="Operador de Portaria & Inspetor">Operador de Portaria & Inspetor</option>
                        <option value="Coordenação Pedagógica">Coordenação Pedagógica</option>
                        <option value="Direção Escolar">Direção Escolar</option>
                        <option value="Segurança Patrimonial">Segurança Patrimonial</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Telefone / Ramal</label>
                      <input
                        type="text"
                        value={staffPhone}
                        onChange={(e) => handlePhoneChange(e.target.value, setStaffPhone)}
                        placeholder="(11) 98111-2233"
                        className="w-full px-3 py-2 bg-slate-900/90 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">E-mail Institucional *</label>
                    <input
                      type="email"
                      value={staffEmail}
                      onChange={(e) => setStaffEmail(e.target.value)}
                      placeholder="nome.sobrenome@emef.educacao.sp.gov.br"
                      className="w-full px-3 py-2 bg-slate-900/90 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                      required
                    />
                  </div>

                  <div className="p-3 bg-slate-900/90 rounded-2xl border border-slate-700/80 space-y-2">
                    <label className="block text-xs font-bold text-orange-400">
                      Chave de Autorização da Unidade Escolar *
                    </label>
                    <input
                      type="text"
                      value={schoolAuthKey}
                      onChange={(e) => setSchoolAuthKey(e.target.value)}
                      placeholder="Digite a chave da escola (Use: EMEF-2026-SP)"
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 font-mono"
                      required
                    />
                    <p className="text-[10px] text-slate-400">
                      Código fornecido pela diretoria da EMEF Profª. Cecília Meireles para novos operadores.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Senha de Operador *</label>
                      <input
                        type="password"
                        value={registerPassword}
                        onChange={(e) => setRegisterPassword(e.target.value)}
                        placeholder="Mínimo 6 caracteres"
                        className="w-full px-3 py-2 bg-slate-900/90 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Confirmar Senha *</label>
                      <input
                        type="password"
                        value={registerPasswordConfirm}
                        onChange={(e) => setRegisterPasswordConfirm(e.target.value)}
                        placeholder="Repita a senha"
                        className="w-full px-3 py-2 bg-slate-900/90 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 px-4 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-extrabold text-xs shadow-lg shadow-orange-950/40 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Building2 className="w-4 h-4" />
                    <span>Cadastrar Credencial de Operador</span>
                  </button>
                </form>
              )}

            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* TELA 3: ESQUECI A SENHA                                       */}
          {/* ------------------------------------------------------------- */}
          {mode === 'forgot_password' && (
            <div className="space-y-4">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setLoginError('');
                  setLoginSuccess('');
                }}
                className="text-xs text-orange-400 hover:text-orange-300 flex items-center gap-1 cursor-pointer font-semibold mb-2"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Voltar para tela de Login</span>
              </button>

              {forgotStep === 'request' && (
                <div className="space-y-3.5">
                  <div className="p-3 bg-slate-900/80 rounded-2xl border border-slate-800 text-xs text-slate-300">
                    <p className="font-semibold text-white mb-1">Recuperar Senha</p>
                    <p className="text-slate-400">
                      Informe o seu WhatsApp ou e-mail cadastrado. Enviaremos um código de verificação para redefinir sua senha.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      WhatsApp ou E-mail Cadastrado
                    </label>
                    <input
                      type="text"
                      value={forgotIdentifier}
                      onChange={(e) => setForgotIdentifier(e.target.value)}
                      placeholder="Ex: (11) 98765-4321 ou seu.email@gmail.com"
                      className="w-full px-3 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (!forgotIdentifier.trim()) {
                        setLoginError('Informe seu celular ou e-mail.');
                        return;
                      }
                      setForgotStep('code');
                      setLoginError('');
                      setLoginSuccess('Código de segurança enviado via WhatsApp e E-mail! (Use: 849201)');
                    }}
                    className="w-full py-2.5 px-4 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-extrabold text-xs transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <KeyRound className="w-4 h-4" />
                    <span>Enviar Código de Recuperação</span>
                  </button>
                </div>
              )}

              {forgotStep === 'code' && (
                <div className="space-y-3.5">
                  <div className="p-3 bg-slate-900/80 rounded-2xl border border-slate-800 text-xs text-slate-300">
                    <p className="font-semibold text-white mb-1">Digite o Código de 6 Dígitos</p>
                    <p className="text-slate-400">
                      Enviamos para <span className="text-orange-300 font-mono">{forgotIdentifier}</span>. (Código de teste: <span className="text-emerald-400 font-bold">849201</span>)
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Código de Confirmação</label>
                    <input
                      type="text"
                      maxLength={6}
                      value={recoveryCode}
                      onChange={(e) => setRecoveryCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="849201"
                      className="w-full px-3 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-sm font-mono tracking-widest text-center text-white placeholder-slate-600 focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Nova Senha</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      className="w-full px-3 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (recoveryCode !== '849201' && recoveryCode.length !== 6) {
                        setLoginError('Código incorreto. Use 849201 para teste.');
                        return;
                      }
                      if (!newPassword || newPassword.length < 6) {
                        setLoginError('A nova senha deve ter pelo menos 6 caracteres.');
                        return;
                      }
                      setLoginSuccess('Senha redefinida com sucesso! Você já pode entrar com sua nova senha.');
                      setTimeout(() => {
                        setMode('login');
                        setForgotStep('request');
                      }, 1200);
                    }}
                    className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirmar Nova Senha</span>
                  </button>
                </div>
              )}

            </div>
          )}

        </div>

        {/* Footer do Modal */}
        <div className="p-4 bg-slate-950/70 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Ambiente Seguro • Rede Pública de Ensino</span>
          </div>
          <span className="font-mono text-slate-500">INEP #35019284</span>
        </div>

      </div>
    </div>
  );
};
