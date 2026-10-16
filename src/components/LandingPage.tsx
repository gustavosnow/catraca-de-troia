import React from 'react';
import {
  Activity,
  ArrowRight,
  BellRing,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Database,
  Eye,
  GraduationCap,
  LayoutDashboard,
  LockKeyhole,
  Menu,
  Radio,
  ScanFace,
  ShieldCheck,
  Smartphone,
  Users,
  WifiOff,
  X,
} from 'lucide-react';
import { CatracaTroiaLogo } from './CatracaTroiaLogo';

interface LandingPageProps {
  onParentLogin: () => void;
  onParentRegister: () => void;
  onSchoolLogin: () => void;
}

const audiences = [
  {
    icon: Radio,
    title: 'Portaria mais informada',
    description: 'Uma visão contínua das entradas e saídas registradas, com contingência local e sinalização clara de ocorrências.',
    accent: 'text-orange-300 bg-orange-500/15 border-orange-500/25',
  },
  {
    icon: LayoutDashboard,
    title: 'Gestão com contexto',
    description: 'Painel único para acompanhar eventos, vínculos, justificativas, comunicados e trilhas de auditoria.',
    accent: 'text-sky-300 bg-sky-500/15 border-sky-500/25',
  },
  {
    icon: Smartphone,
    title: 'Famílias conectadas',
    description: 'Portal responsivo para consultar o histórico autorizado de cada dependente e interagir com a escola.',
    accent: 'text-emerald-300 bg-emerald-500/15 border-emerald-500/25',
  },
];

const plannedGoals = [
  ['≥ 95%', 'meta de acurácia facial'],
  ['≤ 500 ms', 'meta de inferência em 95% das tentativas'],
  ['≥ 99%', 'meta de disponibilidade no horário escolar'],
];

const navigationItems = [
  ['visao', 'A proposta'],
  ['fluxo', 'Como funciona'],
  ['confianca', 'Premissas'],
] as const;

export const LandingPage: React.FC<LandingPageProps> = ({
  onParentLogin,
  onParentRegister,
  onSchoolLogin,
}) => {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [activeSection, setActiveSection] = React.useState('topo');
  const [isScrolled, setIsScrolled] = React.useState(false);
  const [scrollProgress, setScrollProgress] = React.useState(0);

  React.useEffect(() => {
    const updateScrollState = () => {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      setIsScrolled(window.scrollY > 12);
      setScrollProgress(scrollable > 0 ? Math.min(100, (window.scrollY / scrollable) * 100) : 0);
    };
    updateScrollState();
    window.addEventListener('scroll', updateScrollState, { passive: true });

    const observer = new IntersectionObserver((entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((left, right) => right.intersectionRatio - left.intersectionRatio)[0];
      if (visible?.target.id) setActiveSection(visible.target.id);
    }, { rootMargin: '-22% 0px -62% 0px', threshold: [0, 0.1, 0.35] });

    ['topo', ...navigationItems.map(([id]) => id)].forEach((id) => {
      const section = document.getElementById(id);
      if (section) observer.observe(section);
    });

    const requestedSection = window.location.hash.slice(1);
    const knownSections = ['topo', ...navigationItems.map(([id]) => id)];
    let secondFrame = 0;
    const firstFrame = window.requestAnimationFrame(() => {
      secondFrame = window.requestAnimationFrame(() => {
        if (!knownSections.includes(requestedSection)) return;
        document.getElementById(requestedSection)?.scrollIntoView({ behavior: 'auto', block: 'start' });
        setActiveSection(requestedSection);
      });
    });

    return () => {
      window.removeEventListener('scroll', updateScrollState);
      observer.disconnect();
      window.cancelAnimationFrame(firstFrame);
      window.cancelAnimationFrame(secondFrame);
    };
  }, []);

  const navigateToSection = (id: string) => (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}#${id}`);
    setActiveSection(id);
    setMenuOpen(false);
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#07111f] font-sans text-white selection:bg-orange-500 selection:text-white">
      <a href="#landing-content" className="fixed left-3 top-3 z-[100] -translate-y-24 rounded-lg bg-orange-600 px-4 py-2 text-sm font-bold text-white shadow-lg transition-transform focus:translate-y-0">
        Ir para o conteúdo principal
      </a>

      <header className={`fixed inset-x-0 top-0 z-50 border-b transition-all duration-300 ${isScrolled ? 'border-white/10 bg-[#07111f]/95 shadow-2xl shadow-black/25 backdrop-blur-2xl' : 'border-transparent bg-[#07111f]/75 backdrop-blur-xl'}`}>
        <div className={`mx-auto flex max-w-7xl items-center justify-between px-5 transition-[height] duration-300 sm:px-8 ${isScrolled ? 'h-[4.5rem]' : 'h-24'}`}>
          <a href="#topo" onClick={navigateToSection('topo')} aria-label="Catraca de Troia — início" className="rounded-xl">
            <CatracaTroiaLogo size={isScrolled ? 46 : 54} showText variant="dark" subtitle="Monitoramento escolar • Protótipo acadêmico" />
          </a>

          <nav aria-label="Navegação da apresentação" className="hidden items-center gap-7 text-sm font-semibold text-slate-300 lg:flex">
            {navigationItems.map(([id, label]) => (
              <a key={id} href={`#${id}`} onClick={navigateToSection(id)} aria-current={activeSection === id ? 'location' : undefined} className={`relative rounded-lg px-1 py-2 transition-colors after:absolute after:inset-x-0 after:-bottom-1 after:mx-auto after:h-0.5 after:rounded-full after:bg-orange-500 after:transition-all ${activeSection === id ? 'text-white after:w-full' : 'text-slate-400 after:w-0 hover:text-white hover:after:w-1/2'}`}>
                {label}
              </a>
            ))}
          </nav>

          <div className="hidden items-center gap-2 sm:flex">
            <button type="button" onClick={onSchoolLogin} className="rounded-xl px-4 py-2.5 text-sm font-bold text-slate-300 transition-colors hover:bg-white/5 hover:text-white">
              Acesso da escola
            </button>
            <button type="button" onClick={onParentLogin} className="inline-flex items-center gap-2 rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-extrabold text-white shadow-lg shadow-orange-950/30 transition hover:bg-orange-500">
              Entrar no portal <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          <button type="button" onClick={() => setMenuOpen((current) => !current)} aria-expanded={menuOpen} aria-controls="landing-mobile-menu" aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'} className="rounded-xl border border-white/10 p-2.5 text-slate-200 sm:hidden">
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {menuOpen && (
          <div id="landing-mobile-menu" className="border-t border-white/10 bg-[#07111f] p-4 sm:hidden">
            <div className="mx-auto grid max-w-7xl gap-2">
              {navigationItems.map(([id, label]) => (
                <a key={id} href={`#${id}`} onClick={navigateToSection(id)} aria-current={activeSection === id ? 'location' : undefined} className={`rounded-xl px-3 py-2 text-sm font-semibold transition-colors ${activeSection === id ? 'bg-orange-500/10 text-orange-300' : 'text-slate-300 hover:bg-white/5 hover:text-white'}`}>{label}</a>
              ))}
              <button type="button" onClick={onSchoolLogin} className="rounded-xl border border-white/10 px-3 py-2.5 text-left text-sm font-bold text-slate-200">Acesso da escola</button>
              <button type="button" onClick={onParentLogin} className="rounded-xl bg-orange-600 px-3 py-2.5 text-left text-sm font-extrabold text-white">Entrar no portal</button>
            </div>
          </div>
        )}
        <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-px bg-white/5">
          <div className="h-full bg-gradient-to-r from-orange-600 to-amber-400 transition-[width] duration-150" style={{ width: `${scrollProgress}%` }} />
        </div>
      </header>

      <main id="landing-content" tabIndex={-1}>
        <section id="topo" className="relative isolate scroll-mt-24 overflow-hidden px-5 pb-24 pt-40 sm:px-8 sm:pb-32 sm:pt-48">
          <div className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_15%_20%,rgba(234,88,12,0.17),transparent_28%),radial-gradient(circle_at_82%_28%,rgba(14,165,233,0.15),transparent_30%),linear-gradient(180deg,#07111f_0%,#0b192c_72%,#0a1626_100%)]" />
          <div className="absolute inset-0 -z-10 opacity-30 [background-image:linear-gradient(rgba(148,163,184,.08)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,.08)_1px,transparent_1px)] [background-size:52px_52px] [mask-image:linear-gradient(to_bottom,black,transparent_85%)]" />

          <div className="mx-auto grid max-w-7xl items-center gap-16 lg:grid-cols-[1.02fr_.98fr]">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-orange-400/25 bg-orange-500/10 px-3 py-1.5 text-xs font-bold text-orange-200">
                <GraduationCap className="h-4 w-4" /> Tecnologia pensada para a rotina escolar
              </div>
              <h1 className="mt-7 max-w-3xl text-4xl font-black leading-[1.08] tracking-tight text-white sm:text-6xl lg:text-7xl">
                Cada passagem vira <span className="bg-gradient-to-r from-orange-400 to-amber-300 bg-clip-text text-transparent">informação que aproxima.</span>
              </h1>
              <p className="mt-7 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
                Uma proposta de monitoramento escolar que conecta portaria, gestão e responsáveis em torno de registros de entrada e saída, comunicação e rastreabilidade.
              </p>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <button type="button" onClick={onParentRegister} className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-orange-600 px-6 py-4 text-sm font-black text-white shadow-xl shadow-orange-950/40 transition hover:-translate-y-0.5 hover:bg-orange-500">
                  Cadastrar acesso de responsável <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </button>
                <button type="button" onClick={onParentLogin} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-6 py-4 text-sm font-extrabold text-white backdrop-blur transition hover:border-white/25 hover:bg-white/10">
                  Já tenho acesso
                </button>
              </div>

              <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-xs font-semibold text-slate-400">
                <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-400" /> Acesso por perfil e vínculo</span>
                <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-400" /> Continuidade local planejada</span>
                <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-400" /> Dados fictícios nesta demonstração</span>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-xl">
              <div className="absolute -inset-10 -z-10 rounded-full bg-sky-500/10 blur-3xl" />
              <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/80 shadow-2xl shadow-black/50 backdrop-blur-xl">
                <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/15 text-orange-300"><Activity className="h-5 w-5" /></span>
                    <div><p className="text-sm font-black">Visão de monitoramento</p><p className="text-[11px] text-slate-500">Interface demonstrativa</p></div>
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold text-emerald-300"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> API local</span>
                </div>

                <div className="grid gap-3 p-4 sm:grid-cols-3">
                  {[
                    ['Registros', 'persistidos', Database, 'text-sky-300'],
                    ['Perfis', 'segregados', ShieldCheck, 'text-emerald-300'],
                    ['Fila local', 'preservada', WifiOff, 'text-amber-300'],
                  ].map(([title, value, Icon, color]) => (
                    <div key={String(title)} className="rounded-2xl border border-white/8 bg-white/[0.035] p-3.5">
                      <Icon className={`h-4 w-4 ${color}`} />
                      <p className="mt-4 text-[10px] font-bold uppercase tracking-wider text-slate-500">{title}</p>
                      <p className="mt-1 text-sm font-black text-slate-100">{value}</p>
                    </div>
                  ))}
                </div>

                <div className="px-4 pb-4">
                  <div className="rounded-2xl border border-white/8 bg-[#0d1b2e] p-4">
                    <div className="mb-4 flex items-center justify-between"><p className="text-xs font-black uppercase tracking-wider text-slate-300">Fluxo de acesso</p><span className="text-[10px] text-slate-500">simulação acadêmica</span></div>
                    <div className="space-y-3">
                      {[
                        ['07:12', 'Entrada registrada', 'Evento salvo na API local', 'bg-emerald-400'],
                        ['07:09', 'Responsável vinculado', 'Consulta autorizada pela escola', 'bg-sky-400'],
                        ['07:04', 'Fila preservada', 'Destino remoto não configurado', 'bg-amber-400'],
                      ].map(([time, title, description, color]) => (
                        <div key={String(time)} className="flex items-center gap-3 rounded-xl border border-white/5 bg-black/15 p-3">
                          <span className={`h-2 w-2 shrink-0 rounded-full ${color}`} />
                          <span className="w-10 font-mono text-[10px] text-slate-500">{time}</span>
                          <div className="min-w-0 flex-1"><p className="text-xs font-bold text-slate-200">{title}</p><p className="truncate text-[10px] text-slate-500">{description}</p></div>
                          <ChevronRight className="h-4 w-4 text-slate-700" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-6 -left-4 hidden items-center gap-3 rounded-2xl border border-white/10 bg-[#122238]/95 p-3.5 shadow-xl backdrop-blur sm:flex">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-300"><BellRing className="h-5 w-5" /></span>
                <div><p className="text-xs font-black">Comunicação integrada</p><p className="text-[10px] text-slate-400">Caixa interna demonstrativa</p></div>
              </div>
            </div>
          </div>
        </section>

        <section id="visao" className="scroll-mt-20 border-y border-white/8 bg-[#0b192c] px-5 py-24 sm:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-3xl">
              <p className="text-xs font-black uppercase tracking-[0.24em] text-orange-400">Uma visão compartilhada</p>
              <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-5xl">Informação certa para cada pessoa.</h2>
              <p className="mt-5 text-base leading-7 text-slate-400">O conceito reúne os fluxos essenciais sem misturar responsabilidades: a escola registra e governa; cada responsável consulta apenas os vínculos aprovados.</p>
            </div>

            <div className="mt-12 grid gap-5 md:grid-cols-3">
              {audiences.map(({ icon: Icon, title, description, accent }) => (
                <article key={title} className="group rounded-3xl border border-white/8 bg-white/[0.03] p-6 transition hover:-translate-y-1 hover:border-white/15 hover:bg-white/[0.05]">
                  <span className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl border ${accent}`}><Icon className="h-6 w-6" /></span>
                  <h3 className="mt-6 text-xl font-black">{title}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-400">{description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="fluxo" className="scroll-mt-20 px-5 py-24 sm:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-14 lg:grid-cols-[.75fr_1.25fr] lg:items-start">
              <div className="lg:sticky lg:top-28">
                <p className="text-xs font-black uppercase tracking-[0.24em] text-sky-400">Como a ideia funciona</p>
                <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-5xl">Da portaria à família, sem perder o contexto.</h2>
                <p className="mt-5 text-sm leading-7 text-slate-400">O protótipo demonstra o fluxo de informação. Catracas, câmeras, biometria e canais externos não estão integrados neste projeto acadêmico.</p>
              </div>

              <ol className="space-y-4">
                {[
                  [Eye, '01', 'Identificação no acesso', 'No cenário proposto, a identificação inicia o fluxo. Nesta demonstração, a passagem é simulada e claramente sinalizada.'],
                  [Database, '02', 'Registro local persistente', 'O evento é gravado na API local com data, direção, origem e trilha de auditoria.'],
                  [LockKeyhole, '03', 'Regras aplicadas no backend', 'Sessão, perfil e vínculo aprovado determinam quais dados e ações ficam disponíveis.'],
                  [BellRing, '04', 'Acompanhamento pelo responsável', 'O portal reúne histórico, avisos e justificativas em uma experiência responsiva.'],
                ].map(([Icon, number, title, description]) => (
                  <li key={String(number)} className="grid grid-cols-[auto_1fr] gap-4 rounded-3xl border border-white/8 bg-white/[0.025] p-5 sm:grid-cols-[auto_auto_1fr] sm:items-center sm:gap-6 sm:p-6">
                    <span className="font-mono text-xs font-bold text-orange-400">{number}</span>
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-slate-200"><Icon className="h-5 w-5" /></span>
                    <div className="col-span-2 sm:col-span-1"><h3 className="text-base font-black">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-400">{description}</p></div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        <section id="confianca" className="scroll-mt-20 px-5 pb-24 pt-4 sm:px-8 sm:pb-32">
          <div className="mx-auto max-w-7xl overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-[#11243b] to-[#0b192c]">
            <div className="grid lg:grid-cols-[1.1fr_.9fr]">
              <div className="p-7 sm:p-12">
                <p className="text-xs font-black uppercase tracking-[0.24em] text-orange-400">Premissas do projeto</p>
                <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">Segurança e continuidade começam no desenho.</h2>
                <div className="mt-8 grid gap-4 sm:grid-cols-2">
                  {[
                    [WifiOff, 'Operação local', 'A indisponibilidade externa não deve apagar eventos já registrados.'],
                    [Users, 'Vínculo validado', 'O responsável acessa somente estudantes autorizados pela escola.'],
                    [ShieldCheck, 'Rastreabilidade', 'Ações sensíveis exigem perfil adequado e deixam evidência.'],
                    [ScanFace, 'Biometria responsável', 'Uso real dependeria de governança institucional; aqui permanece simulado.'],
                  ].map(([Icon, title, text]) => (
                    <div key={String(title)} className="rounded-2xl border border-white/8 bg-black/10 p-4"><Icon className="h-5 w-5 text-orange-300" /><h3 className="mt-3 text-sm font-black">{title}</h3><p className="mt-2 text-xs leading-5 text-slate-400">{text}</p></div>
                  ))}
                </div>
              </div>

              <div className="border-t border-white/10 bg-black/15 p-7 sm:p-12 lg:border-l lg:border-t-0">
                <div className="flex items-center gap-3"><Clock3 className="h-5 w-5 text-sky-300" /><p className="text-xs font-black uppercase tracking-[0.2em] text-slate-300">Metas planejadas de homologação</p></div>
                <div className="mt-7 space-y-6">
                  {plannedGoals.map(([value, label]) => (
                    <div key={value} className="border-b border-white/8 pb-5 last:border-0"><p className="text-3xl font-black text-white">{value}</p><p className="mt-1 text-xs leading-5 text-slate-400">{label}</p></div>
                  ))}
                </div>
                <p className="mt-6 rounded-2xl border border-amber-500/20 bg-amber-500/8 p-4 text-[11px] leading-5 text-amber-100">Metas acadêmicas não equivalem a resultados medidos. Este protótipo não realizou homologação de hardware, biometria, carga ou disponibilidade.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-white/8 bg-[#0b192c] px-5 py-20 text-center sm:px-8">
          <div className="mx-auto max-w-3xl">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-orange-400">Explore a demonstração</p>
            <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-5xl">Veja a proposta pelos olhos de quem acompanha.</h2>
            <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-slate-400">Crie um acesso demonstrativo de responsável ou entre com uma das contas fictícias disponíveis no ambiente.</p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <button type="button" onClick={onParentRegister} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-orange-600 px-6 py-4 text-sm font-black text-white transition hover:bg-orange-500">Começar pelo cadastro <ArrowRight className="h-4 w-4" /></button>
              <button type="button" onClick={onSchoolLogin} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 px-6 py-4 text-sm font-bold text-slate-200 transition hover:bg-white/5">Conhecer o painel escolar</button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/8 bg-[#07111f] px-5 py-8 sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <CatracaTroiaLogo size={34} showText variant="dark" subtitle="Demonstração acadêmica" />
          <p>Protótipo com dados fictícios. Sem integração real com hardware, biometria ou notificações externas.</p>
        </div>
      </footer>
    </div>
  );
};
