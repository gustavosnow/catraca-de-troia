import React from 'react';
import {
  AlertTriangle,
  ArrowDown,
  ArrowRight,
  BadgeCheck,
  BookOpen,
  Camera,
  CheckCircle2,
  ClipboardList,
  Cpu,
  Database,
  ExternalLink,
  FileText,
  Flag,
  Gauge,
  GitBranch,
  Hand,
  KeyRound,
  Layers,
  LayoutDashboard,
  Lightbulb,
  Lock,
  MapPin,
  MessagesSquare,
  Monitor,
  PlayCircle,
  Rocket,
  ScanFace,
  School,
  Search,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Target,
  TestTube2,
  Timer,
  Users,
  Wallet,
  Wifi,
  XCircle,
} from 'lucide-react';
import { BRAND_SEAL_SRC, BrandArtwork } from '../brand/BrandMark';

/** Pasta oficial da documentação no Drive (TAP, Ciclo de Vida, EAP e Plano de Riscos). */
const OFFICIAL_DOCS_URL = 'https://drive.google.com/drive/folders/163EOyyzGW-VMIH2zs_PGTHZEVyHRfeJ9';
const LAB_VIDEO_URL = 'https://drive.google.com/file/d/1W0_vFphnIqT9nNE8Y9d63lcIgvaaakTv/view';

export interface SlideDefinition {
  id: string;
  title: string;
  theme: 'dark' | 'light';
  Component: React.FC;
}

type Icon = React.ComponentType<{ className?: string; 'aria-hidden'?: boolean | 'true' }>;

/* ------------------------------------------------------------------ */
/* Peças reutilizáveis                                                 */
/* ------------------------------------------------------------------ */

const d = (delay: number) => ({ '--d': delay } as React.CSSProperties);

/** Arco laranja da identidade; fica numa camada recortada para não criar rolagem. */
const Swoosh: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className="deck-decor" aria-hidden="true">
    <svg className={`deck-swoosh ${className}`} viewBox="0 0 600 600" fill="none">
      <path d="M40 560C120 300 330 110 590 40" stroke="#ff6a00" strokeWidth="26" strokeLinecap="round" />
      <path d="M110 590C190 380 370 220 590 150" stroke="#ff6a00" strokeOpacity=".28" strokeWidth="10" strokeLinecap="round" />
    </svg>
  </div>
);

const Heading: React.FC<{ eyebrow: string; title: React.ReactNode; lead?: React.ReactNode }> = ({ eyebrow, title, lead }) => (
  <div className="deck-reveal" style={d(0)}>
    <p className="deck-eyebrow">{eyebrow}</p>
    <h2 className="deck-title">{title}</h2>
    {lead && <p className="deck-lead">{lead}</p>}
  </div>
);

const IconCard: React.FC<{ icon: Icon; title: string; text: React.ReactNode; delay: number; className?: string }> = ({ icon: IconComponent, title, text, delay, className = '' }) => (
  <article className={`deck-card deck-reveal ${className}`} style={d(delay)}>
    <span className="deck-icon"><IconComponent aria-hidden="true" /></span>
    <h3 className="mt-4">{title}</h3>
    <p className="mt-2">{text}</p>
  </article>
);

const Laptop: React.FC<{ src: string; alt: string; className?: string }> = ({ src, alt, className = '' }) => (
  <div className={`deck-laptop ${className}`}>
    <div className="deck-laptop-screen"><img src={src} alt={alt} loading="lazy" /></div>
    <div className="deck-laptop-base" />
  </div>
);

const Phone: React.FC<{ src: string; alt: string; className?: string }> = ({ src, alt, className = '' }) => (
  <div className={`deck-phone ${className}`}><img src={src} alt={alt} loading="lazy" /></div>
);

const StatBig: React.FC<{ value: string; label: string; delay: number }> = ({ value, label, delay }) => (
  <div className="deck-reveal" style={d(delay)}>
    <p className="text-[clamp(2.2rem,4.4vw,4rem)] font-extrabold leading-none tracking-tight deck-accent">{value}</p>
    <p className="mt-2 text-[clamp(.9rem,1.05vw,1.1rem)] font-semibold opacity-90">{label}</p>
  </div>
);

/* ------------------------------------------------------------------ */
/* 01 — Capa                                                           */
/* ------------------------------------------------------------------ */
const Cover: React.FC = () => (
  <>
    <Swoosh className="-right-24 -top-24 w-[46rem] max-w-[90vw] opacity-90" />
    <div className="deck-inner grid items-center gap-10 lg:grid-cols-[1.15fr_.85fr]">
      <div>
        <p className="deck-eyebrow deck-reveal" style={d(0)}>Gerência de Projetos · 2026/2</p>
        <h1 className="deck-reveal mt-5 text-[clamp(2.6rem,6vw,5.4rem)] font-extrabold leading-[1.02] tracking-tight" style={d(1)}>
          Catraca <span className="deck-accent">de Troia</span>
        </h1>
        <p className="deck-reveal mt-5 max-w-xl text-[clamp(1.15rem,1.9vw,1.75rem)] font-semibold leading-snug" style={d(2)}>
          Controle de acesso escolar com <span className="deck-accent">segurança</span>, <span className="deck-accent">praticidade</span> e <span className="deck-accent">gestão</span>.
        </p>
        <p className="deck-lead deck-reveal" style={d(3)}>
          Plataforma que registra entradas e saídas e informa as famílias, com acesso restrito a quem tem vínculo com o estudante.
        </p>
        <div className="deck-reveal mt-10 grid gap-1 text-[clamp(.85rem,1vw,1rem)] text-[#d1d5db]" style={d(4)}>
          <p className="font-semibold text-white">Gustavo Coelho · Hanrry Santos · Saylon Batista</p>
          <p>UEPA · Bacharelado em Engenharia de Software · Profª MSc Jacqueline Teixeira</p>
          <p>Parauapebas – PA, 2026</p>
        </div>
      </div>
      <div className="deck-pop relative mx-auto w-full max-w-md" style={d(2)}>
        <div className="rounded-[28px] bg-white p-8 shadow-2xl shadow-black/40">
          <BrandArtwork className="h-auto w-full" />
        </div>
      </div>
    </div>
  </>
);

/* ------------------------------------------------------------------ */
/* 02 — Problema                                                       */
/* ------------------------------------------------------------------ */
const Problem: React.FC = () => (
  <div className="deck-inner">
    <Heading eyebrow="O problema" title={<>Quem entrou, quem saiu <span className="deck-accent">e quem pode saber disso?</span></>} />
    <div className="mt-10 grid gap-5 md:grid-cols-3">
      <IconCard delay={1} icon={ClipboardList} title="Registros dispersos" text="Entradas e saídas anotadas de formas diferentes são difíceis de organizar e consultar." />
      <IconCard delay={2} icon={Users} title="Família sem informação" text="O responsável não acompanha a rotina de quem está sob a sua guarda." />
      <IconCard delay={3} icon={ShieldAlert} title="Acesso sem critério" text="Dados de estudantes exigem consulta restrita a quem tem vínculo aprovado pela escola." />
    </div>
  </div>
);

/* ------------------------------------------------------------------ */
/* 03 — Proposta                                                       */
/* ------------------------------------------------------------------ */
const Proposal: React.FC = () => {
  const steps: Array<[Icon, string, string]> = [
    [ScanFace, 'Identifica', 'No cenário escolar, a câmera auxilia a identificação. A portaria pode registrar uma passagem assistida.'],
    [LayoutDashboard, 'Registra', 'O painel reúne as passagens para a equipe acompanhar a rotina da escola.'],
    [Smartphone, 'Informa', 'Os responsáveis com vínculo aprovado consultam as entradas e saídas pelo celular.'],
  ];
  return (
    <div className="deck-inner">
      <Heading
        eyebrow="A proposta"
        title={<>Registros organizados para a escola, <span className="deck-accent">acesso para as famílias</span></>}
        lead="Para uma escola pública de Parauapebas (PA), a plataforma centraliza os registros da portaria e permite que as famílias acompanhem as entradas e saídas dos estudantes."
      />
      <div className="mt-12 grid items-stretch gap-4 md:grid-cols-[1fr_auto_1fr_auto_1fr]">
        {steps.map(([IconComponent, title, text], position) => (
          <React.Fragment key={title}>
            <article className="deck-card deck-reveal text-center" style={d(position + 1)}>
              <span className="deck-icon mx-auto"><IconComponent aria-hidden="true" /></span>
              <p className="mt-3 text-sm font-bold text-[#c2410c]">{String(position + 1).padStart(2, '0')}</p>
              <h3 className="mt-1">{title}</h3>
              <p className="mt-2">{text}</p>
            </article>
            {position < steps.length - 1 && (
              <div className="deck-reveal flex items-center justify-center text-[#e65100]" style={d(position + 1.5)} aria-hidden="true">
                <ArrowRight className="hidden h-8 w-8 md:block" />
                <ArrowDown className="h-7 w-7 md:hidden" />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* 04 — O sistema                                                      */
/* ------------------------------------------------------------------ */
const System: React.FC = () => (
  <>
    <Swoosh className="-bottom-64 -right-40 w-[42rem] max-w-[80vw] opacity-45" />
    <div className="deck-inner grid items-center gap-10 lg:grid-cols-[.8fr_1.2fr]">
      <div>
        <Heading eyebrow="O que construímos" title={<>Painel escolar e <span className="deck-accent">portal das famílias</span></>} />
        <ul className="mt-8 grid gap-4">
          {[
            [LayoutDashboard, 'Painel escolar', 'Passagens, estudantes, comunicados, justificativas, vínculos e auditoria.'],
            [Smartphone, 'Portal dos responsáveis', 'Presença do dia, histórico da semana, avisos e justificativa de ausência.'],
            [ScanFace, 'Protótipo facial', 'Câmeras de laboratório e agente em Python com OpenCV.'],
          ].map(([IconComponent, title, text], position) => {
            const I = IconComponent as Icon;
            return (
              <li key={title as string} className="deck-reveal flex gap-4" style={d(position + 1)}>
                <span className="deck-icon"><I aria-hidden="true" /></span>
                <div>
                  <p className="text-[clamp(1rem,1.25vw,1.25rem)] font-bold">{title as string}</p>
                  <p className="mt-1 text-[clamp(.9rem,1.02vw,1.05rem)] text-[#d1d5db]">{text as string}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
      <div className="relative">
        <div className="deck-pop" style={d(1)}>
          <Laptop src="/apresentacao/tela-painel.webp" alt="Visão geral do painel escolar com duas catracas cadastradas" />
        </div>
        <div className="deck-pop absolute -bottom-8 -right-2 w-[28%] min-w-[110px] sm:-right-6" style={d(3)}>
          <Phone src="/apresentacao/tela-portal.webp" alt="Tela inicial do portal dos responsáveis no celular" />
        </div>
      </div>
    </div>
  </>
);

/* ------------------------------------------------------------------ */
/* 05 — Escopo                                                         */
/* ------------------------------------------------------------------ */
const Scope: React.FC = () => (
  <div className="deck-inner">
    <Heading eyebrow="Escopo" title={<>O que entregamos <span className="deck-accent">e o que é cenário</span></>} />
    <div className="mt-9 grid gap-5 lg:grid-cols-2">
      <article className="deck-card deck-reveal border-t-4 !border-t-[#ff6a00]" style={d(1)}>
        <div className="flex items-center gap-3">
          <span className="deck-icon"><Rocket aria-hidden="true" /></span>
          <h3>Entrega acadêmica: a plataforma</h3>
        </div>
        <ul className="mt-4 grid gap-2">
          {['Painel escolar e portal responsivo', 'API local com banco SQLite', 'Acesso por perfil e por vínculo familiar', 'Passagem por câmera em laboratório e passagem assistida', 'Avisos, notificações internas e justificativa textual', 'Documentação: TAP, EAP, riscos e relatório'].map((item) => (
            <li key={item} className="flex gap-2"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#16a34a]" aria-hidden="true" />{item}</li>
          ))}
        </ul>
      </article>
      <article className="deck-card deck-reveal border-dashed" style={d(2)}>
        <div className="flex items-center gap-3">
          <span className="deck-icon"><MapPin aria-hidden="true" /></span>
          <h3>Cenário de aplicação (hipotético)</h3>
        </div>
        <ul className="mt-4 grid gap-2">
          {['Escola pública de ensino fundamental em Parauapebas (PA), unidade a definir', 'Duas catracas eletrônicas, câmeras e servidor local', 'Instalação e operação na portaria da escola', '24 semanas e R$ 291 mil, como exercício de planejamento'].map((item) => (
            <li key={item} className="flex gap-2"><span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[#9ca3af]" aria-hidden="true" />{item}</li>
          ))}
        </ul>
      </article>
    </div>
    <div className="deck-reveal mt-7 flex flex-wrap items-center gap-2" style={d(3)}>
      <span className="mr-1 text-sm font-bold uppercase tracking-wider text-[#4b5563]">Fora do escopo</span>
      {['Atestados e anexos', 'Ficha de saúde', 'Carteirinha digital', 'RFID', 'Acesso de terceiros', 'Outras escolas'].map((item) => (
        <span key={item} className="deck-chip"><XCircle className="h-4 w-4 text-[#b91c1c]" aria-hidden="true" />{item}</span>
      ))}
    </div>
  </div>
);

/* ------------------------------------------------------------------ */
/* 06 — Ciclo de vida                                                  */
/* ------------------------------------------------------------------ */
const Lifecycle: React.FC = () => {
  const phases: Array<[Icon, string, string]> = [
    [Flag, 'Iniciação', 'TAP: problema, objetivos e interessados'],
    [Layers, 'Planejamento', 'EAP, riscos, estimativas e critérios de aceite'],
    [Cpu, 'Execução', 'Protótipo, redesenho e agente facial'],
    [Search, 'Monitoramento', 'Alinhamentos e histórico no GitHub'],
    [BadgeCheck, 'Encerramento', 'Evidências, relatório e lições'],
  ];
  return (
    <>
      <Swoosh className="-right-32 -top-40 w-[36rem] max-w-[70vw] opacity-70" />
      <div className="deck-inner">
        <Heading eyebrow="Ciclo de vida" title={<>Do problema à <span className="deck-accent">entrega acadêmica</span></>} />
        <ol className="relative mt-14 grid gap-6 md:grid-cols-5">
          <div className="deck-bar absolute left-[10%] right-[10%] top-[1.6rem] hidden h-[3px] rounded bg-[#ff6a00]/60 md:block" style={d(0)} aria-hidden="true" />
          {phases.map(([IconComponent, title, text], position) => (
            <li key={title} className="deck-reveal relative flex gap-4 md:flex-col md:items-center md:text-center" style={d(position + 1)}>
              <span className="relative z-10 inline-flex h-[3.3rem] w-[3.3rem] shrink-0 items-center justify-center rounded-full border-4 border-[#0b151d] bg-[#ff6a00] text-[#0b151d]">
                <IconComponent className="h-6 w-6" aria-hidden="true" />
              </span>
              <div>
                <p className="text-xs font-bold text-[#ff6a00] md:mt-3">{String(position + 1).padStart(2, '0')}</p>
                <p className="text-[clamp(1.05rem,1.3vw,1.3rem)] font-bold">{title}</p>
                <p className="mt-1 text-[clamp(.88rem,1vw,1.02rem)] text-[#d1d5db]">{text}</p>
              </div>
            </li>
          ))}
        </ol>
        <p className="deck-note deck-reveal mt-12" style={d(6)}>Base: Atividade 01 (Ciclo de Vida) e Guia PMBOK, 7ª edição.</p>
      </div>
    </>
  );
};

/* ------------------------------------------------------------------ */
/* 07 — Objetivos SMART                                                */
/* ------------------------------------------------------------------ */
const Smart: React.FC = () => {
  const items: Array<[string, string, string]> = [
    ['S', 'Específico', 'Demonstrar a plataforma com painel escolar e portal, respeitando perfis e vínculos.'],
    ['M', 'Mensurável', 'Registrar cada caso de teste com versão, data, procedimento e resultado.'],
    ['A', 'Atingível', 'React/TypeScript, API Express e SQLite, com papéis definidos na equipe.'],
    ['R', 'Relevante', 'Organizar o acompanhamento escolar e dar transparência às famílias.'],
    ['T', 'Temporal', 'Concluir as entregas no calendário acadêmico da disciplina.'],
  ];
  return (
    <div className="deck-inner">
      <Heading eyebrow="Termo de Abertura" title={<>Objetivos <span className="deck-accent">SMART</span></>} />
      <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {items.map(([letter, title, text], position) => (
          <article key={letter} className="deck-card deck-reveal" style={d(position + 1)}>
            <p className="text-[clamp(2.4rem,3.6vw,3.4rem)] font-extrabold leading-none text-[#e65100]">{letter}</p>
            <h3 className="mt-2">{title}</h3>
            <p className="mt-2">{text}</p>
          </article>
        ))}
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* 08 — Equipe                                                         */
/* ------------------------------------------------------------------ */
const Team: React.FC = () => {
  const people: Array<[string, string, string, string, string]> = [
    ['GC', 'Gustavo Coelho', 'Gerente de Projetos', '1.1.1–1.1.4 · 1.5.1 · 1.5.3', 'Criou o protótipo inicial, mantém a documentação e consolida o relatório.'],
    ['SB', 'Saylon Batista', 'Patrocinador e Product Owner', '1.2.1 · 1.3.4 · 1.5.3', 'Redesenhou o painel, o portal e as telas públicas e integrou o fluxo facial ao painel.'],
    ['HS', 'Hanrry Santos', 'Scrum Master', '1.2.2 · 1.2.3 · 1.4.1–1.4.3', 'Desenvolveu o agente facial e os serviços de cadastro e leitura por câmera.'],
  ];
  return (
    <div className="deck-inner">
      <Heading eyebrow="Equipe" title={<>Papéis e <span className="deck-accent">contribuições</span></>} />
      <div className="mt-9 grid gap-5 md:grid-cols-3">
        {people.map(([initials, name, role, packages, work], position) => (
          <article key={name} className="deck-card deck-reveal" style={d(position + 1)}>
            <div className="flex items-center gap-4">
              <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#1f2937] text-lg font-bold text-white ring-4 ring-[#ff6a00]/30">{initials}</span>
              <div>
                <h3>{name}</h3>
                <p className="!mt-0 text-sm font-semibold !text-[#c2410c]">{role}</p>
              </div>
            </div>
            <p className="mt-4 text-sm font-semibold !text-[#1f2937]">EAP {packages}</p>
            <p className="mt-2">{work}</p>
          </article>
        ))}
      </div>
      <div className="deck-reveal mt-7 flex flex-wrap gap-2" style={d(4)}>
        <span className="deck-chip"><MessagesSquare className="h-4 w-4 text-[#e65100]" aria-hidden="true" />Alinhamentos presenciais e pelo WhatsApp</span>
        <span className="deck-chip"><GitBranch className="h-4 w-4 text-[#e65100]" aria-hidden="true" />Código e decisões rastreados no GitHub</span>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* 09 — EAP                                                            */
/* ------------------------------------------------------------------ */
const Wbs: React.FC = () => {
  const groups: Array<[string, string, Array<[string, boolean?]>]> = [
    ['1.1', 'Gerenciamento', [['TAP e interessados'], ['Plano: prazo, custo e riscos'], ['Acompanhamento'], ['Encerramento e lições']]],
    ['1.2', 'Requisitos e Design', [['Requisitos'], ['Fluxos de navegação'], ['Protótipo de alta fidelidade']]],
    ['1.3', 'Desenvolvimento', [['Backend e banco'], ['Visão computacional (laboratório)'], ['Painel escolar'], ['Portal dos responsáveis'], ['Hardware da catraca', true], ['Notificações'], ['Cadastro facial'], ['Autenticação e acesso']]],
    ['1.4', 'Testes e Qualidade', [['Plano de testes'], ['Homologação e carga'], ['Correção de defeitos']]],
    ['1.5', 'Implantação', [['Servidor local'], ['Instalação física', true], ['Guia e treinamento']]],
  ];
  return (
    <div className="deck-inner">
      <Heading eyebrow="Estrutura Analítica do Projeto · v1.6" title={<>21 pacotes em <span className="deck-accent">5 grupos</span></>} />
      <div className="deck-pop mx-auto mt-8 w-fit rounded-2xl bg-[#1f2937] px-6 py-3 text-center text-[clamp(.95rem,1.15vw,1.15rem)] font-bold text-white" style={d(1)}>
        1 · Catraca de Troia
      </div>
      {/* Conectores da árvore: raiz → barra horizontal → um traço por grupo. */}
      <div className="deck-reveal relative hidden h-8 lg:block" style={d(1)} aria-hidden="true">
        <span className="absolute left-1/2 top-0 h-4 w-[3px] -translate-x-1/2 bg-[#d1d5db]" />
        <span className="absolute left-[10%] right-[10%] top-4 h-[3px] bg-[#d1d5db]" />
        {[10, 30, 50, 70, 90].map((left) => (
          <span key={left} className="absolute top-4 h-4 w-[3px] -translate-x-1/2 bg-[#d1d5db]" style={{ left: `${left}%` }} />
        ))}
      </div>
      <div className="mt-3 grid items-start gap-3 sm:grid-cols-2 lg:mt-0 lg:grid-cols-5">
        {groups.map(([code, name, packages], position) => (
          <article key={code} className="deck-card deck-reveal !p-4" style={d(position + 2)}>
            <p className="text-sm font-bold text-[#c2410c]">{code}</p>
            <h3 className="!text-[clamp(.98rem,1.1vw,1.12rem)]">{name}</h3>
            <ul className="mt-3 grid gap-1.5">
              {packages.map(([label, context], item) => (
                <li
                  key={label}
                  className={`rounded-lg px-2.5 py-1.5 !text-[clamp(.8rem,.88vw,.92rem)] ${context ? 'border border-dashed border-[#9ca3af] !text-[#4b5563]' : 'bg-[#f3f4f6] !text-[#1f2937]'}`}
                >
                  <span className="font-semibold tabular-nums">{code}.{item + 1}</span> {label}
                  {context && <span className="ml-1 font-semibold text-[#c2410c]">· contexto</span>}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
      <p className="deck-note deck-reveal mt-5" style={d(7)}>Tracejado: pacote só de contexto. Hardware e instalação física não são entregas do grupo.</p>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* 10 — Prazo e capacidade                                             */
/* ------------------------------------------------------------------ */
const HOURS: Array<[string, number]> = [
  ['Iniciação e planejamento', 300],
  ['Execução', 1200],
  ['Testes e segurança', 400],
  ['Monitoramento', 300],
  ['Encerramento', 200],
];
const Schedule: React.FC = () => {
  const max = Math.max(...HOURS.map(([, hours]) => hours));
  return (
    <>
      <Swoosh className="-bottom-48 -right-40 w-[38rem] max-w-[75vw] opacity-50" />
      <div className="deck-inner">
        <Heading eyebrow="Prazo e capacidade · cenário planejado" title={<>Seis meses, <span className="deck-accent">três pessoas</span></>} />
        <div className="mt-9 grid gap-10 lg:grid-cols-[.9fr_1.1fr]">
          <div className="grid grid-cols-2 gap-x-6 gap-y-8 self-center">
            <StatBig value="24" label="semanas" delay={1} />
            <StatBig value="3" label="pessoas na equipe" delay={2} />
            <StatBig value="2.880 h" label="de capacidade" delay={3} />
            <StatBig value="2.400 h" label="produtivas" delay={4} />
          </div>
          <figure className="deck-card deck-reveal" style={d(2)}>
            <figcaption className="text-[clamp(1rem,1.2vw,1.2rem)] font-bold">Horas produtivas por fase</figcaption>
            <ul className="mt-5 grid gap-4" aria-label="Horas produtivas por fase">
              {HOURS.map(([phase, hours], position) => (
                <li key={phase} title={`${phase}: ${hours.toLocaleString('pt-BR')} h (${Math.round((hours / 2400) * 100)}% do total)`}>
                  <div className="flex items-baseline justify-between gap-3 text-[clamp(.88rem,1vw,1.02rem)]">
                    <span className="text-[#e5e7eb]">{phase}</span>
                    <span className="font-bold tabular-nums">{hours.toLocaleString('pt-BR')} h</span>
                  </div>
                  <div className="mt-1.5 h-3 rounded-full bg-white/10">
                    <div className="deck-bar h-3 rounded-full bg-[#ff6a00]" style={{ ...d(position), width: `${(hours / max) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          </figure>
        </div>
        <p className="deck-note deck-reveal mt-8" style={d(6)}>Estimativa do cenário hipotético de implantação. Não é a duração real do trabalho acadêmico.</p>
      </div>
    </>
  );
};

/* ------------------------------------------------------------------ */
/* 11 — Orçamento                                                      */
/* ------------------------------------------------------------------ */
const Budget: React.FC = () => {
  const Op: React.FC<{ children: string; delay: number }> = ({ children, delay }) => (
    <span className="deck-reveal self-center text-center text-3xl font-extrabold text-[#9ca3af]" style={d(delay)} aria-hidden="true">{children}</span>
  );
  const Block: React.FC<{ value: string; label: string; detail: string; delay: number; strong?: boolean }> = ({ value, label, detail, delay, strong }) => (
    <article className={`deck-card deck-reveal ${strong ? '!bg-[#1f2937] !border-[#1f2937]' : ''}`} style={d(delay)}>
      <p className={`text-[clamp(1.35rem,2.1vw,2rem)] font-extrabold tabular-nums ${strong ? 'text-white' : 'text-[#1f2937]'}`}>{value}</p>
      <p className={`mt-1 text-sm font-bold ${strong ? 'text-[#ffb27a]' : 'text-[#c2410c]'}`}>{label}</p>
      <p className={`mt-1 !text-[clamp(.8rem,.9vw,.92rem)] ${strong ? '!text-[#d1d5db]' : ''}`}>{detail}</p>
    </article>
  );
  return (
    <div className="deck-inner">
      <Heading eyebrow="Orçamento · cenário planejado" title={<>Linha de base de <span className="deck-accent">R$ 279 mil</span></>} />
      <div className="mt-9 grid gap-3 lg:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1.1fr]">
        <Block value="R$ 240.000" label="Mão de obra" detail="2.400 h × R$ 100/h" delay={1} />
        <Op delay={1.5}>+</Op>
        <Block value="R$ 24.000" label="Contingência" detail="10% da mão de obra" delay={2} />
        <Op delay={2.5}>+</Op>
        <Block value="R$ 15.000" label="Hardware" detail="Câmeras R$ 2 mil · 2 catracas R$ 8 mil · servidor R$ 5 mil" delay={3} />
        <Op delay={3.5}>=</Op>
        <Block value="R$ 279.000" label="Linha de base" detail="Estimativa acadêmica do planejamento" delay={4} strong />
      </div>
      <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_auto_1.1fr] lg:pl-[calc(50%-1rem)]">
        <Block value="R$ 12.000" label="Reserva gerencial" detail="5% da mão de obra, fora da linha de base" delay={5} />
        <Op delay={5.5}>=</Op>
        <Block value="R$ 291.000" label="Orçamento global" detail="Linha de base + reserva gerencial" delay={6} strong />
      </div>
      <p className="deck-note deck-reveal mt-6 flex items-start gap-2" style={d(7)}>
        <Wallet className="mt-0.5 h-4 w-4 shrink-0 text-[#c2410c]" aria-hidden="true" />
        Exercício de planejamento de uma implantação hipotética. Não são despesas do grupo nem financiamento assegurado.
      </p>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* 12 — Critérios de aceite                                            */
/* ------------------------------------------------------------------ */
const Acceptance: React.FC = () => {
  const goals: Array<[Icon, string, string]> = [
    [Target, '≥ 95%', 'de acurácia facial'],
    [Timer, '≤ 500 ms', 'de inferência em ≥ 95% das tentativas'],
    [Smartphone, '≥ 95%', 'das notificações processadas para envio em até 5 s, sob conectividade prevista'],
    [Gauge, '≥ 99%', 'de disponibilidade no horário escolar'],
  ];
  const evidence = [
    { id: 'RF04', title: 'Passagem facial', detail: 'Ensaio com câmera e registro da passagem no vídeo de laboratório.', href: LAB_VIDEO_URL },
    { id: 'RF05', title: 'Passagem assistida', detail: 'Registrar ao vivo no painel e consultar no portal.', href: '#/projeto/16' },
    { id: 'RNF01', title: 'Consulta restrita', detail: 'Verificar perfis e comparar o acesso de responsáveis com e sem vínculo aprovado.' },
  ];
  return (
    <>
      <Swoosh className="-left-48 -top-48 w-[34rem] max-w-[70vw] -scale-x-100 opacity-50" />
      <div className="deck-inner">
        <Heading eyebrow="Critérios de aceite" title={<>Metas do cenário e <span className="deck-accent">aceite acadêmico</span></>} />
        <div className="mt-9 grid gap-6 lg:grid-cols-[1.2fr_.8fr]">
          <div>
            <div className="grid gap-4 sm:grid-cols-2">
              {goals.map(([IconComponent, value, label], position) => (
                <article key={label} className="deck-card deck-reveal flex items-center gap-4" style={d(position + 1)}>
                  <span className="deck-icon"><IconComponent aria-hidden="true" /></span>
                  <div>
                    <p className="text-[clamp(1.5rem,2.3vw,2.2rem)] font-extrabold leading-none text-[#ff6a00]">{value}</p>
                    <p className="mt-1.5">{label}</p>
                  </div>
                </article>
              ))}
            </div>
            <p className="deck-note deck-reveal mt-4" style={d(5)}>Metas de homologação do cenário escolar. A demonstração acadêmica verifica fluxos e regras do protótipo.</p>
          </div>
          <article className="deck-card deck-reveal" style={d(3)}>
            <h3>Do requisito à evidência</h3>
            <dl className="mt-3 divide-y divide-white/10">
              {evidence.map(({ id, title, detail, href }) => (
                <div key={id} className="py-2.5">
                  <dt className="flex flex-wrap items-baseline gap-x-2 font-semibold">
                    <span className="text-sm font-extrabold text-[#ff6a00]">{id}</span>
                    {href ? (
                      <a href={href} target={href === LAB_VIDEO_URL ? '_blank' : undefined} rel={href === LAB_VIDEO_URL ? 'noopener noreferrer' : undefined} className="underline underline-offset-4">{title}</a>
                    ) : title}
                  </dt>
                  <dd className="mt-1 text-sm leading-relaxed text-[#d1d5db]">{detail}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-3 !text-xs">A seção 3.4 do relatório reúne os 11 RF e 10 RNF do pacote 1.2.1 da EAP.</p>
          </article>
        </div>
      </div>
    </>
  );
};

/* ------------------------------------------------------------------ */
/* 13 — Matriz de riscos                                               */
/* ------------------------------------------------------------------ */
const RISKS: Array<{ id: string; label: string; p: number; i: number }> = [
  { id: 'R01', label: 'Exposição de biometria ou de cadastro de menores', p: 2, i: 5 },
  { id: 'R02', label: 'Consulta indevida ao histórico ou sessão comprometida', p: 2, i: 5 },
  { id: 'R03', label: 'Falha de internet e atraso de sincronização', p: 4, i: 4 },
  { id: 'R04', label: 'Falha elétrica ou mecânica de catraca', p: 2, i: 3 },
  { id: 'R05', label: 'Acurácia facial inferior a 95%', p: 3, i: 4 },
  { id: 'R06', label: 'Inferência acima de 500 ms no pico de chegada', p: 4, i: 4 },
  { id: 'R07', label: 'Baixa adesão ao cadastro biométrico', p: 4, i: 4 },
  { id: 'R08', label: 'Indisponibilidade de integrante essencial', p: 3, i: 4 },
];
/** Faixas do plano: baixo 1–6, médio 8–12, alto 15–25 (sempre com rótulo, nunca só cor). */
const levelOf = (score: number) => (score >= 15 ? 'alto' : score >= 8 ? 'médio' : 'baixo');
const LEVEL_STYLE: Record<string, string> = {
  baixo: 'bg-[#dcfce7] text-[#14532d]',
  médio: 'bg-[#fef3c7] text-[#78350f]',
  alto: 'bg-[#fee2e2] text-[#7f1d1d]',
};
const RiskMatrix: React.FC = () => (
  <div className="deck-inner">
    <Heading eyebrow="Plano de riscos do cenário hipotético" title={<>Oito riscos, <span className="deck-accent">três em nível alto</span></>} />
    <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_1fr]">
      <figure className="deck-reveal" style={d(1)}>
        <div className="flex">
          <div className="flex w-8 items-center justify-center">
            <span className="-rotate-90 whitespace-nowrap text-xs font-bold uppercase tracking-wider text-[#4b5563]">Probabilidade</span>
          </div>
          <div className="flex-1">
            <div className="grid grid-cols-[1.5rem_repeat(5,1fr)] gap-1.5">
              {[5, 4, 3, 2, 1].map((p) => (
                <React.Fragment key={p}>
                  <span className="flex items-center justify-center text-sm font-bold text-[#4b5563]">{p}</span>
                  {[1, 2, 3, 4, 5].map((i) => {
                    const score = p * i;
                    const here = RISKS.filter((risk) => risk.p === p && risk.i === i);
                    return (
                      <div
                        key={i}
                        className={`relative flex min-h-[3.6rem] flex-wrap content-center items-center justify-center gap-1 rounded-lg p-1 ${LEVEL_STYLE[levelOf(score)]} ${here.length ? 'ring-2 ring-[#1f2937]/70' : 'opacity-70'}`}
                        title={`Probabilidade ${p} × impacto ${i} = ${score} (${levelOf(score)})${here.length ? `: ${here.map((risk) => risk.id).join(', ')}` : ''}`}
                      >
                        <span className="absolute left-1.5 top-1 text-[10px] font-semibold opacity-70">{score}</span>
                        {here.map((risk) => (
                          <span key={risk.id} className="rounded-md bg-white px-1.5 py-0.5 text-[11px] font-bold text-[#1f2937] shadow-sm">{risk.id}</span>
                        ))}
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}
              <span />
              {[1, 2, 3, 4, 5].map((i) => <span key={i} className="text-center text-sm font-bold text-[#4b5563]">{i}</span>)}
            </div>
            <p className="mt-1 text-center text-xs font-bold uppercase tracking-wider text-[#4b5563]">Impacto</p>
          </div>
        </div>
        <figcaption className="mt-4 flex flex-wrap gap-2">
          {[['baixo', 'Baixo · 1–6'], ['médio', 'Médio · 8–12'], ['alto', 'Alto · 15–25']].map(([level, label]) => (
            <span key={level} className={`rounded-full px-3 py-1 text-xs font-bold ${LEVEL_STYLE[level]}`}>{label}</span>
          ))}
        </figcaption>
      </figure>
      <ul className="grid content-start gap-2">
        {RISKS.map((risk, position) => {
          const score = risk.p * risk.i;
          const level = levelOf(score);
          return (
            <li key={risk.id} className="deck-reveal flex items-center gap-3 rounded-xl border border-[#e5e7eb] bg-white px-3 py-2" style={d(position * 0.5 + 1)}>
              <span className="w-10 text-sm font-extrabold text-[#1f2937]">{risk.id}</span>
              <span className="flex-1 text-[clamp(.84rem,.95vw,.98rem)] text-[#374151]">{risk.label}</span>
              <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold ${LEVEL_STYLE[level]}`}>{score} · {level}</span>
            </li>
          );
        })}
      </ul>
    </div>
  </div>
);

/* ------------------------------------------------------------------ */
/* 14 — Respostas aos riscos altos                                     */
/* ------------------------------------------------------------------ */
const RiskResponses: React.FC = () => {
  const rows: Array<[string, string, Icon, string, string, string, string]> = [
    ['R03', 'Falha de internet', Wifi, 'Processar e enfileirar tudo no servidor local da escola.', 'Gateway sem resposta por mais de 60 s ou perda acima de 15%.', 'Seguir registrando localmente e sincronizar depois.', 'Gustavo'],
    ['R06', 'Inferência acima de 500 ms', Timer, 'Otimizar o modelo e testar carga de até 30 passagens/min.', 'Mais de 500 ms em 5 leituras seguidas ou CPU acima de 85% por 2 min.', 'Reduzir os quadros e priorizar a identificação.', 'Hanrry e equipe'],
    ['R07', 'Baixa adesão ao cadastro', Users, 'Reuniões com as famílias e atendimento para o cadastro.', 'Mais de 25% dos estudantes sem cadastro duas semanas antes.', 'Regularização e procedimento alternativo autorizado.', 'Gustavo e Saylon'],
  ];
  return (
    <div className="deck-inner">
      <Heading eyebrow="Riscos altos · estratégia: mitigar" title={<>Prevenir, vigiar o gatilho e <span className="deck-accent">ter um plano B</span></>} />
      <div className="mt-8 grid gap-4">
        {rows.map(([id, name, IconComponent, prevention, trigger, contingency, owner], position) => (
          <article key={id} className="deck-card deck-reveal grid gap-4 lg:grid-cols-[13rem_1fr_1fr_1fr]" style={d(position + 1)}>
            <div className="flex items-center gap-3">
              <span className="deck-icon"><IconComponent aria-hidden="true" /></span>
              <div>
                <p className="text-sm font-extrabold text-[#7f1d1d]">{id} · alto (16)</p>
                <h3 className="!text-[clamp(.98rem,1.1vw,1.12rem)]">{name}</h3>
                <p className="!text-xs">Responsável: {owner}</p>
              </div>
            </div>
            {[['Prevenção', prevention], ['Gatilho', trigger], ['Contingência', contingency]].map(([label, text]) => (
              <div key={label} className="border-l-2 border-[#e5e7eb] pl-4">
                <p className="text-xs font-bold uppercase tracking-wider text-[#c2410c]">{label}</p>
                <p className="mt-1">{text}</p>
              </div>
            ))}
          </article>
        ))}
      </div>
      <p className="deck-note deck-reveal mt-5" style={d(5)}>As 30 passagens por minuto são referência de teste, não capacidade aferida.</p>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* 15 — Arquitetura                                                    */
/* ------------------------------------------------------------------ */
const Architecture: React.FC = () => {
  const layers: Array<[Icon, string, string]> = [
    [LayoutDashboard, 'Interfaces e câmera', 'Painel e portal em React e TypeScript. O agente usa Python e OpenCV e envia à API só o resultado da leitura.'],
    [Lock, 'API Express', 'Centraliza as regras para cada cliente. Confere sessão, perfil e vínculo antes de liberar consultas e valida a sequência ao registrar passagens.'],
    [Database, 'SQLite local', 'Um arquivo no servidor atende ao protótipo de uma escola. Transações preservam registros e a fila local com pouca infraestrutura.'],
  ];
  const entities = [
    { name: 'Responsável', table: 'users', keys: 'PK id', relation: '1 para 0..N' },
    { name: 'Vínculo', table: 'guardian_student_links', keys: 'PK composta por guardian_user_id e student_id, ambas FKs', relation: '0..N para 1' },
    { name: 'Estudante', table: 'students', keys: 'PK id', relation: '1 para 0..N' },
    { name: 'Evento de acesso', table: 'access_events', keys: 'PK id · FK student_id' },
  ];
  return (
    <div className="deck-inner">
      <Heading eyebrow="Arquitetura e decisões técnicas" title={<>A API aplica as regras, <span className="deck-accent">o banco guarda os registros</span></>} />
      <div className="mt-6 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_auto_minmax(0,1fr)]">
        {layers.map(([IconComponent, title, text], position) => (
          <React.Fragment key={title}>
            <div className={`deck-card deck-reveal flex items-start gap-3 !p-4 ${position === 1 ? '!border-[#ff6a00]' : ''}`} style={d(position + 1)}>
              <span className="deck-icon"><IconComponent aria-hidden="true" /></span>
              <div className="min-w-0">
                <h3>{title}</h3>
                <p className="mt-1 !text-sm">{text}</p>
              </div>
            </div>
            {position < layers.length - 1 && (
              <div className="flex items-center justify-center text-[#ff6a00]" aria-hidden="true">
                <ArrowRight className="hidden h-6 w-6 lg:block" />
                <ArrowDown className="h-5 w-5 lg:hidden" />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
      <figure className="deck-reveal mt-6" style={d(4)}>
        <figcaption className="mb-2 text-base font-bold">Recorte do diagrama entidade-relacionamento (DER)</figcaption>
        <div className="grid gap-2 lg:grid-cols-[minmax(0,.8fr)_auto_minmax(0,1.25fr)_auto_minmax(0,.8fr)_auto_minmax(0,.9fr)]">
          {entities.map(({ name, table, keys, relation }) => (
            <React.Fragment key={table}>
              <div className="min-w-0 rounded-xl border border-white/15 bg-[#142230] px-3 py-2.5">
                <p className="text-sm font-bold text-white">{name}</p>
                <code className="block text-xs leading-relaxed text-[#d1d5db] [overflow-wrap:anywhere]">{table}</code>
                <p className="mt-1 text-xs text-[#d1d5db] [overflow-wrap:anywhere]">{keys}</p>
              </div>
              {relation && (
                <span className="flex items-center justify-center gap-1 text-xs font-semibold text-[#ff984d]" aria-hidden="true">
                  <span>{relation}</span>
                  <ArrowRight className="hidden h-4 w-4 lg:block" />
                  <ArrowDown className="h-4 w-4 lg:hidden" />
                </span>
              )}
            </React.Fragment>
          ))}
        </div>
        <p className="sr-only">Cada vínculo liga um responsável a um estudante. Responsáveis e estudantes podem ter vários vínculos. Cada evento pertence a um estudante, que pode ter vários eventos.</p>
      </figure>
      <p className="deck-note deck-reveal mt-5" style={d(5)}>
        <strong>Para várias escolas</strong>, revisar o isolamento de dados e permissões por unidade, medir gravações simultâneas e avaliar um banco servidor para a operação compartilhada.
      </p>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* 16 — Uma passagem                                                   */
/* ------------------------------------------------------------------ */
const Passage: React.FC = () => {
  const steps: Array<[string, string]> = [
    ['Registrar', 'No painel, abra Passagem assistida. Use estudante fictício, escolha a catraca, siga a direção sugerida e informe o motivo.'],
    ['Conferir no painel', 'Em Registros de acesso, localize a passagem assistida e confira o horário e a catraca.'],
    ['Consultar no portal', 'Na conta do responsável vinculado, selecione o mesmo estudante e confira a passagem em Movimentações registradas.'],
  ];
  return (
    <div className="deck-inner grid items-center gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(12rem,.28fr)]">
      <div>
        <Heading eyebrow="Demonstração ao vivo · dados fictícios" title={<>Passagem assistida, <span className="deck-accent">do painel ao portal</span></>} />
        <div className="deck-reveal mt-5 flex flex-wrap gap-2.5" style={d(1)}>
          <a href="#/escola" target="_blank" rel="noopener noreferrer" className="btn btn-primary">
            <Hand aria-hidden="true" /> Abrir painel escolar
          </a>
          <a href="#/responsaveis" target="_blank" rel="noopener noreferrer" className="btn btn-secondary">
            <Smartphone aria-hidden="true" /> Abrir portal dos responsáveis
          </a>
          <a href={LAB_VIDEO_URL} target="_blank" rel="noopener noreferrer" className="btn btn-secondary">
            <PlayCircle aria-hidden="true" /> Ver ensaio com câmera
          </a>
        </div>
        <ol className="mt-5 grid gap-3 sm:grid-cols-3">
          {steps.map(([title, text], position) => (
            <li key={title} className="deck-card deck-reveal !p-4" style={d(position + 2)}>
              <h3>{title}</h3>
              <p className="mt-1">{text}</p>
            </li>
          ))}
        </ol>
        <div className="deck-reveal mt-4 flex items-start gap-3 rounded-xl border border-[#e5e7eb] bg-white px-4 py-3 text-sm text-[#374151]" style={d(5)}>
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-[#b45309]" aria-hidden="true" />
          <p><strong className="text-[#1f2937]">Exceção de sequência.</strong> Repita a mesma direção para o mesmo estudante. Confira a recusa da API e confirme que a lista tem apenas a passagem original.</p>
        </div>
      </div>
      <div className="deck-pop mx-auto w-[min(14rem,68vw)]" style={d(3)}>
        <Phone src="/apresentacao/tela-portal-historico.webp" alt="Histórico da semana no portal do responsável, com entradas e saídas" />
        <p className="deck-note mt-3 text-center">Histórico da semana no portal</p>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* 17 — Perfis e segurança                                             */
/* ------------------------------------------------------------------ */
const Security: React.FC = () => {
  const profiles: Array<[Icon, string, string[]]> = [
    [School, 'Coordenação e Direção', ['Tudo o que a portaria vê', 'Vínculos, contas e auditoria', 'Análise de justificativas', 'Cadastro facial']],
    [KeyRound, 'Portaria', ['Registros e estudantes', 'Passagem assistida', 'Câmeras das catracas', 'Sem administração nem biometria']],
    [Users, 'Responsável', ['Somente estudantes com vínculo aprovado', 'Presença, histórico e avisos', 'Justificativa de ausência']],
  ];
  return (
    <div className="deck-inner">
      <Heading eyebrow="Segurança e perfis" title={<>Cada perfil vê <span className="deck-accent">só o que lhe cabe</span></>} />
      <div className="mt-9 grid gap-5 md:grid-cols-3">
        {profiles.map(([IconComponent, title, items], position) => (
          <article key={title} className="deck-card deck-reveal" style={d(position + 1)}>
            <div className="flex items-center gap-3">
              <span className="deck-icon"><IconComponent aria-hidden="true" /></span>
              <h3>{title}</h3>
            </div>
            <ul className="mt-4 grid gap-2">
              {items.map((item) => (
                <li key={item} className="flex gap-2"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#16a34a]" aria-hidden="true" />{item}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>
      <div className="deck-reveal mt-7 flex flex-wrap gap-2" style={d(4)}>
        <span className="deck-chip"><ShieldCheck className="h-4 w-4 text-[#e65100]" aria-hidden="true" />Permissões conferidas no servidor, rota a rota, por teste</span>
        <span className="deck-chip"><ScanFace className="h-4 w-4 text-[#e65100]" aria-hidden="true" />Biometria só de adultos voluntários, com consentimento</span>
        <span className="deck-chip"><Lock className="h-4 w-4 text-[#e65100]" aria-hidden="true" />Governança institucional de dados prevista no TAP</span>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* 18 — Evidências                                                     */
/* ------------------------------------------------------------------ */
const Evidence: React.FC = () => {
  const milestones = [
    'Consolidação técnica: PWA e 29 testes',
    'Revisão do TAP, ciclo de vida, riscos e EAP',
    'Redesenho das telas e ensaio com câmera',
    'Fluxo facial integrado à versão principal',
  ];
  return (
    <>
      <Swoosh className="-right-40 -top-40 w-[36rem] max-w-[70vw] opacity-60" />
      <div className="deck-inner">
        <Heading eyebrow="Evidências" title={<>O que foi <span className="deck-accent">verificado</span></>} />
        <div className="mt-9 grid gap-4 sm:grid-cols-3">
          {([[TestTube2, '48', 'testes automatizados da API'], [LayoutDashboard, '44', 'cenários de aceite visual do portal'], [PlayCircle, '1', 'vídeo do ensaio de laboratório']] as Array<[Icon, string, string]>).map(([IconComponent, value, label], position) => (
            <article key={label} className="deck-card deck-reveal flex items-center gap-4" style={d(position + 1)}>
              <span className="deck-icon"><IconComponent aria-hidden="true" /></span>
              <div>
                <p className="text-[clamp(2rem,3vw,2.8rem)] font-extrabold leading-none text-[#ff6a00]">{value}</p>
                <p className="mt-1">
                  {IconComponent === PlayCircle ? (
                    <a
                      href={LAB_VIDEO_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline underline-offset-4"
                    >
                      {label}
                    </a>
                  ) : label}
                </p>
              </div>
            </article>
          ))}
        </div>
        <p className="deck-note deck-reveal mt-4" style={d(3)}>
          Validação local do PR #7. A{' '}
          <a href="https://github.com/gustavosnow/catraca-de-troia/pull/3" target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">
            PR #3 (`16d5320`)
          </a>{' '}registrou 40 testes de API e 24 cenários visuais.
        </p>
        <ul className="mt-8 grid gap-5 md:grid-cols-4">
          {milestones.map((text, position) => (
            <li key={text} className="deck-reveal flex items-start gap-3 text-[clamp(.88rem,1vw,1.02rem)] text-[#d1d5db]" style={d(position + 4)}>
              <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-[#ff6a00]" aria-hidden="true" />
              <span>{text}</span>
            </li>
          ))}
        </ul>
        <p className="deck-note deck-reveal mt-8" style={d(8)}>Acurácia, latência e disponibilidade em escola exigem ensaios próprios, ainda não realizados.</p>
      </div>
    </>
  );
};

/* ------------------------------------------------------------------ */
/* 19 — Planejado x executado                                          */
/* ------------------------------------------------------------------ */
const Deviation: React.FC = () => {
  const rows: Array<[string, string, string]> = [
    ['Prazo', '24 semanas (cenário)', 'Não se aplica à entrega acadêmica'],
    ['Esforço', '2.400 h produtivas', 'Não apurado'],
    ['Custo', 'R$ 291.000 (cenário)', 'Desvio não apurado'],
    ['Entrega acadêmica', 'Documentos, protótipo, apresentação e PDF', 'Marcos registrados; desvio não apurado'],
  ];
  return (
    <div className="deck-inner">
      <Heading
        eyebrow="Acompanhamento"
        title={<>Planejado <span className="deck-accent">x executado</span></>}
        lead="Faltaram datas planejadas comparáveis e o registro de horas e despesas desde o início. Por isso, o desvio não foi apurado."
      />
      <div className="deck-reveal mt-8 overflow-x-auto rounded-2xl border border-[#e5e7eb] bg-white" style={d(1)}>
        <table className="w-full min-w-[40rem] text-left">
          <thead>
            <tr className="bg-[#1f2937] text-white">
              {['Dimensão', 'Referência planejada', 'Executado / desvio'].map((head) => (
                <th key={head} scope="col" className="px-5 py-3.5 text-sm font-bold">{head}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(([dimension, planned, executed]) => (
              <tr key={dimension} className="border-t border-[#e5e7eb]">
                <th scope="row" className="px-5 py-4 text-[clamp(.92rem,1.05vw,1.08rem)] font-bold text-[#1f2937]">{dimension}</th>
                <td className="px-5 py-4 text-[clamp(.9rem,1vw,1.05rem)] text-[#374151]">{planned}</td>
                <td className="px-5 py-4 text-[clamp(.9rem,1vw,1.05rem)] font-semibold text-[#c2410c]">{executed}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* 20 — Lições aprendidas                                              */
/* ------------------------------------------------------------------ */
const Lessons: React.FC = () => {
  const lessons: Array<[Icon, string, string]> = [
    [FileText, 'Escopo antes do código', 'Conferir requisito e impacto antes de implementar.'],
    [Camera, 'Câmera bem posicionada', 'Ajustar altura e ângulo e ter a passagem assistida pronta.'],
    [Monitor, 'Ensaiar o compartilhamento de tela', 'Na sessão on-line, deixe o painel, o portal e o vídeo prontos. Teste a troca de abas e o áudio do vídeo.'],
    [ShieldCheck, 'Autorizar no servidor', 'Testar contas sem vínculo e perfis diferentes.'],
    [ClipboardList, 'Medir desde o início', 'Registrar datas, horas e despesas para comparar com o plano.'],
    [Lightbulb, 'Separar produto e cenário', 'A plataforma é a entrega; o hardware é contexto.'],
  ];
  return (
    <div className="deck-inner">
      <Heading eyebrow="Lições aprendidas" title={<>O que levamos <span className="deck-accent">para o próximo projeto</span></>} />
      <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {lessons.map(([IconComponent, title, text], position) => (
          <IconCard key={title} icon={IconComponent} title={title} text={text} delay={position * 0.6 + 1} />
        ))}
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* 21 — Encerramento                                                   */
/* ------------------------------------------------------------------ */
const Closing: React.FC = () => (
  <>
    <Swoosh className="-right-24 -top-24 w-[46rem] max-w-[90vw] opacity-90" />
    <Swoosh className="-bottom-56 -left-56 w-[34rem] max-w-[70vw] rotate-180 opacity-40" />
    <div className="deck-inner text-center">
      <img src={BRAND_SEAL_SRC} alt="" className="deck-pop mx-auto h-16 w-auto sm:h-20" style={d(0)} />
      <h2 className="deck-reveal mt-8 text-[clamp(2.6rem,6vw,5.4rem)] font-extrabold leading-none tracking-tight" style={d(1)}>
        Obrigado<span className="deck-accent">!</span>
      </h2>
      <p className="deck-lead deck-reveal mx-auto" style={d(2)}>
        Entregamos o protótipo com painel escolar, portal dos responsáveis e passagem assistida, além do ensaio facial em laboratório e da documentação acadêmica.
      </p>
      <p className="deck-note deck-reveal mt-3" style={d(2.5)}>O Termo de Encerramento integra o relatório final.</p>
      <div className="deck-reveal mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row" style={d(3)}>
        <a href={OFFICIAL_DOCS_URL} target="_blank" rel="noopener noreferrer" className="inline-flex h-12 items-center gap-2 rounded-full bg-[#c2410c] px-6 font-bold text-white transition-colors hover:bg-[#9a3412]">
          <BookOpen className="h-5 w-5" aria-hidden="true" />
          Documentação oficial
          <ExternalLink className="h-4 w-4" aria-hidden="true" />
          <span className="sr-only">(abre em nova aba)</span>
        </a>
        <a href="#/escola" className="inline-flex h-12 items-center gap-2 rounded-full border border-white/25 px-6 font-bold text-white transition-colors hover:bg-white/10">
          <LayoutDashboard className="h-5 w-5" aria-hidden="true" />
          Abrir o sistema
        </a>
      </div>
      <p className="deck-reveal mt-10 text-[clamp(.88rem,1vw,1rem)] text-[#d1d5db]" style={d(4)}>
        Gustavo Coelho · Hanrry Santos · Saylon Batista · Gerência de Projetos · UEPA 2026
      </p>
    </div>
  </>
);

export const SLIDES: SlideDefinition[] = [
  { id: 'capa', title: 'Catraca de Troia', theme: 'dark', Component: Cover },
  { id: 'problema', title: 'O problema', theme: 'light', Component: Problem },
  { id: 'proposta', title: 'A proposta', theme: 'light', Component: Proposal },
  { id: 'sistema', title: 'O que construímos', theme: 'dark', Component: System },
  { id: 'escopo', title: 'Escopo', theme: 'light', Component: Scope },
  { id: 'ciclo', title: 'Ciclo de vida', theme: 'dark', Component: Lifecycle },
  { id: 'smart', title: 'Objetivos SMART', theme: 'light', Component: Smart },
  { id: 'equipe', title: 'Equipe e papéis', theme: 'light', Component: Team },
  { id: 'eap', title: 'Estrutura Analítica do Projeto', theme: 'light', Component: Wbs },
  { id: 'prazo', title: 'Prazo e capacidade', theme: 'dark', Component: Schedule },
  { id: 'orcamento', title: 'Orçamento', theme: 'light', Component: Budget },
  { id: 'aceite', title: 'Critérios de aceite', theme: 'dark', Component: Acceptance },
  { id: 'riscos', title: 'Matriz de riscos', theme: 'light', Component: RiskMatrix },
  { id: 'respostas', title: 'Respostas aos riscos altos', theme: 'light', Component: RiskResponses },
  { id: 'arquitetura', title: 'Arquitetura', theme: 'dark', Component: Architecture },
  { id: 'passagem', title: 'Demonstração prática', theme: 'light', Component: Passage },
  { id: 'seguranca', title: 'Segurança e perfis', theme: 'light', Component: Security },
  { id: 'evidencias', title: 'Evidências', theme: 'dark', Component: Evidence },
  { id: 'desvios', title: 'Planejado x executado', theme: 'light', Component: Deviation },
  { id: 'licoes', title: 'Lições aprendidas', theme: 'light', Component: Lessons },
  { id: 'encerramento', title: 'Obrigado', theme: 'dark', Component: Closing },
];
