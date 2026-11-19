import React from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  Building2,
  CheckCircle2,
  FlaskConical,
  LockKeyhole,
  Menu,
  Presentation,
  ScanFace,
  School,
  ShieldCheck,
  Users,
  Wifi,
  X,
} from 'lucide-react';
import { BrandLockup } from './brand/BrandMark';
import { FamilyIllustration, IdentifyIllustration, RecordIllustration } from './brand/Illustrations';
import { Avatar } from './ui';

interface LandingPageProps {
  onParentLogin: () => void;
  onParentRegister: () => void;
  onSchoolLogin: () => void;
  /** Abre a apresentação do projeto (#/projeto), pública. */
  onOpenPresentation: () => void;
}

const NAV_ITEMS = [
  ['como-funciona', 'Como funciona'],
  ['para-quem', 'Para quem'],
  ['o-projeto', 'O projeto'],
] as const;

const STEPS = [
  {
    number: '01',
    title: 'Identificar com cuidado',
    text: 'A portaria confere o estudante e registra a passagem. O reconhecimento facial está previsto para o piloto físico.',
    Illustration: IdentifyIllustration,
  },
  {
    number: '02',
    title: 'Registrar com clareza',
    text: 'Cada passagem reúne estudante, horário, movimento, catraca, método e operador responsável.',
    Illustration: RecordIllustration,
  },
  {
    number: '03',
    title: 'Aproximar a família',
    text: 'Responsáveis com vínculo aprovado consultam os registros, acompanham avisos e enviam justificativas textuais.',
    Illustration: FamilyIllustration,
  },
];

const GOALS = [
  ['≥ 95%', 'acurácia de identificação'],
  ['≤ 500 ms', 'de inferência em 95% das tentativas'],
  ['≥ 99%', 'de disponibilidade no horário escolar'],
];

const FAQ = [
  ['Preciso instalar um aplicativo?', 'Não. O portal abre no navegador do celular por link ou QR Code. Adicionar à tela inicial é opcional; o aplicativo Android segue como objetivo do produto, ainda não publicado.'],
  ['O cadastro libera os dados de um estudante?', 'Não. Depois do cadastro, o responsável solicita o vínculo informando a matrícula, e a escola confere a documentação antes de aprovar. Sem vínculo aprovado, nenhum dado do estudante é exibido.'],
  ['O reconhecimento facial já está funcionando?', 'Em protótipo. Há um agente de laboratório com Python e OpenCV que registra entradas e saídas pela câmera no computador da portaria. Ele não é homologado, não aciona catraca física e só usa rostos de adultos voluntários da equipe. As metas do piloto ainda serão homologadas.'],
  ['Posso enviar atestados ou anexos?', 'Não. As justificativas de ausência são textuais e analisadas pela Coordenação ou pela Direção da escola.'],
  ['O que acontece se a internet cair?', 'Na proposta, identificação e registro continuam no servidor local da escola, com fila e sincronização posterior. O cache do portal no celular não substitui essa continuidade.'],
];

/** Composição do produto no hero — ilustração do painel e do celular. */
const ProductPreview: React.FC = () => (
  <div className="relative mx-auto w-full max-w-[560px] pb-10 pr-6 sm:pr-10" aria-hidden="true">
    <div className="card overflow-hidden shadow-[0_24px_60px_-24px_rgb(27_42_65/0.28)] lg:rotate-[-1.5deg]">
      <div className="flex items-center justify-between border-b border-line bg-surface px-4 py-2.5">
        <span className="flex items-center gap-2 text-[11px] font-semibold text-ink-2">
          <Building2 className="h-3.5 w-3.5" />
          Gestão escolar
        </span>
        <span className="chip chip-brand h-5 text-[10px]"><FlaskConical />Demonstração</span>
      </div>
      <div className="p-4">
        <p className="text-[13px] font-semibold text-ink">Bom dia, Mariana.</p>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {[['Entradas hoje', '06'], ['Saídas hoje', '02'], ['Na escola', '04']].map(([label, value], index) => (
            <div key={label} className={`relative rounded-lg border border-line p-2.5 ${index === 0 ? 'before:absolute before:inset-x-0 before:top-0 before:h-[2px] before:rounded-t-lg before:bg-brand' : ''}`}>
              <p className="text-[9px] text-muted">{label}</p>
              <p className="tabular mt-1 text-lg font-bold leading-none text-ink">{value}</p>
            </div>
          ))}
        </div>
        <ul className="mt-3 divide-y divide-line rounded-lg border border-line">
          {[['Ana Clara de Souza', '07:10', 'Entrada'], ['Arthur Mendes', '07:15', 'Entrada'], ['Gabriel Oliveira', '07:20', 'Entrada'], ['Sophia Oliveira', '12:31', 'Saída']].map(([name, time, move]) => (
            <li key={name} className="flex items-center gap-2.5 px-3 py-2">
              <Avatar name={name} size="sm" />
              <span className="flex-1 truncate text-[11px] font-medium text-ink">{name}</span>
              <span className="tabular text-[10px] text-muted">{time}</span>
              <span className={`chip h-5 px-1.5 text-[10px] ${move === 'Entrada' ? 'chip-positive' : 'chip-neutral'}`}>{move}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-[10px] text-muted">2 catracas · Sem hardware conectado</p>
      </div>
    </div>

    <div className="absolute -bottom-2 right-0 w-[172px] rounded-[26px] border-[5px] border-ink bg-white p-3 shadow-[0_24px_48px_-16px_rgb(27_42_65/0.4)] sm:w-[188px] lg:rotate-[3deg]">
      <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-line-strong" />
      <p className="text-[10px] text-muted">Olá, Claudia</p>
      <div className="mt-2 flex items-center gap-2">
        <Avatar name="Ana Clara Mendes" size="sm" />
        <span className="text-[11px] font-semibold text-ink">Ana Clara</span>
      </div>
      <div className="mt-3 rounded-xl border border-positive-line bg-positive-soft p-3">
        <School className="h-4 w-4 text-positive" />
        <p className="mt-2 text-[12px] font-bold leading-tight text-[#145f3e]">Ana Clara está na escola.</p>
        <p className="mt-1 text-[9px] leading-snug text-[#2c6b4c]">Entrada às 07:10 · Catraca 01<br />Reconhecimento facial</p>
      </div>
      <p className="mt-3 text-[9px] leading-snug text-muted">Mais perto da rotina de quem você ama.</p>
    </div>
  </div>
);

export const LandingPage: React.FC<LandingPageProps> = ({ onParentLogin, onParentRegister, onSchoolLogin, onOpenPresentation }) => {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [isScrolled, setIsScrolled] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    const requested = window.location.hash.slice(1);
    if (NAV_ITEMS.some(([id]) => id === requested)) {
      window.requestAnimationFrame(() => document.getElementById(requested)?.scrollIntoView({ block: 'start' }));
    }
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const goTo = (id: string) => (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}#${id}`);
    setMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-white text-ink">
      <a href="#landing-content" className="fixed left-3 top-3 z-[100] -translate-y-24 rounded-lg bg-action px-4 py-2 text-sm font-semibold text-white shadow-lg transition-transform focus:translate-y-0">
        Pular para o conteúdo
      </a>

      <header
        className={`sticky z-40 border-b bg-white/95 backdrop-blur transition-colors ${isScrolled ? 'border-line' : 'border-transparent'}`}
        style={{ top: 'env(safe-area-inset-top, 0px)' }}
      >
        <div className="mx-auto flex h-[72px] max-w-6xl items-center gap-6 px-5 sm:px-8">
          <a href="#topo" onClick={goTo('topo')} aria-label="Catraca de Troia, início" className="rounded-lg">
            <BrandLockup size={48} />
          </a>
          <nav aria-label="Seções da página" className="mx-auto hidden items-center gap-8 md:flex">
            {NAV_ITEMS.map(([id, label]) => (
              <a key={id} href={`#${id}`} onClick={goTo(id)} className="text-sm font-medium text-ink-2 transition-colors hover:text-action-ink">{label}</a>
            ))}
          </nav>
          <div className="ml-auto hidden items-center gap-2 md:flex">
            <button type="button" className="btn btn-secondary" onClick={onSchoolLogin}>Gestão escolar</button>
            <button type="button" className="btn btn-primary" onClick={onParentLogin}>
              <ArrowUpRight aria-hidden="true" />
              Sou responsável
            </button>
          </div>
          <button
            type="button"
            className="icon-btn ml-auto md:hidden"
            aria-expanded={menuOpen}
            aria-controls="landing-mobile-menu"
            aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
            onClick={() => setMenuOpen((current) => !current)}
          >
            {menuOpen ? <X /> : <Menu />}
          </button>
        </div>
        {menuOpen && (
          <div id="landing-mobile-menu" className="border-t border-line bg-white px-5 pb-5 pt-2 md:hidden">
            <nav aria-label="Seções da página" className="flex flex-col">
              {NAV_ITEMS.map(([id, label]) => (
                <a key={id} href={`#${id}`} onClick={goTo(id)} className="border-b border-line py-3 text-[15px] font-medium text-ink">{label}</a>
              ))}
            </nav>
            <div className="mt-4 grid gap-2">
              <button type="button" className="btn btn-primary" onClick={onParentLogin}>Sou responsável</button>
              <button type="button" className="btn btn-secondary" onClick={onSchoolLogin}>Gestão escolar</button>
            </div>
          </div>
        )}
      </header>

      <main id="landing-content" tabIndex={-1} className="outline-none">
        {/* Hero */}
        <section id="topo" className="scroll-mt-24 px-5 pb-20 pt-12 sm:px-8 sm:pt-20 lg:pb-28">
          <div className="mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <div>
              <span className="chip chip-brand">
                <ScanFace aria-hidden="true" />
                Controle de acesso escolar
              </span>
              <h1 className="display-title mt-6 text-[40px] sm:text-[52px] lg:text-[56px]">
                Mais segurança na entrada.
                <span className="block text-action">Mais tranquilidade para acompanhar.</span>
              </h1>
              <p className="mt-6 max-w-xl text-[17px] leading-relaxed text-ink-2">
                O Catraca de Troia conecta o controle de acesso da escola ao acompanhamento das famílias, reunindo registros, avisos e justificativas em uma única plataforma.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <button type="button" className="btn btn-primary btn-lg" onClick={onParentLogin}>
                  <ArrowRight aria-hidden="true" />
                  Acessar portal dos responsáveis
                </button>
                <button type="button" className="btn btn-secondary btn-lg" onClick={onSchoolLogin}>
                  <Building2 aria-hidden="true" />
                  Acessar gestão escolar
                </button>
              </div>
              <p className="mt-5 flex items-center gap-2 text-[13px] text-muted">
                <LockKeyhole aria-hidden="true" className="h-4 w-4" />
                Cada pessoa acessa somente o que está autorizado.
              </p>
            </div>
            <ProductPreview />
          </div>
        </section>

        {/* Como funciona */}
        <section id="como-funciona" className="scroll-mt-20 border-y border-line bg-surface px-5 py-20 sm:px-8 lg:py-24">
          <div className="mx-auto max-w-6xl">
            <p className="eyebrow">Tecnologia com propósito</p>
            <h2 className="display-title mt-3 max-w-xl text-[30px] sm:text-[36px]">Um caminho mais simples. Da entrada ao acompanhamento.</h2>
            <ol className="mt-12 grid gap-5 md:grid-cols-3">
              {STEPS.map(({ number, title, text, Illustration }) => (
                <li key={number} className="card flex flex-col p-6">
                  <Illustration className="h-auto w-full" />
                  <span className="tabular mt-6 text-[28px] font-bold leading-none text-brand/40">{number}</span>
                  <h3 className="mt-3 text-[17px] font-semibold text-ink">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-2">{text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Para quem */}
        <section id="para-quem" className="scroll-mt-20 px-5 py-20 sm:px-8 lg:py-24">
          <div className="mx-auto max-w-6xl">
            <p className="eyebrow">Duas experiências, o mesmo cuidado</p>
            <h2 className="display-title mt-3 max-w-xl text-[30px] sm:text-[36px]">Feito para quem cuida da escola. E para quem confia nela.</h2>
            <div className="mt-12 grid gap-5 md:grid-cols-2">
              <article className="card flex flex-col p-7">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand-soft text-action">
                  <Building2 aria-hidden="true" className="h-5 w-5" />
                </span>
                <h3 className="mt-6 text-xl font-semibold text-ink">Gestão escolar</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-ink-2">
                  Portaria, Coordenação e Direção com as informações e ações adequadas a cada perfil: registros, estudantes, comunicados, justificativas e administração.
                </p>
                <ul className="mt-5 space-y-2 text-sm text-ink-2">
                  {['Visão do dia e das duas catracas', 'Tabelas de registros e estudantes', 'Vínculos, contas e auditoria'].map((item) => (
                    <li key={item} className="flex items-center gap-2"><CheckCircle2 aria-hidden="true" className="h-4 w-4 text-positive" />{item}</li>
                  ))}
                </ul>
                <button type="button" className="btn-link mt-auto pt-7" onClick={onSchoolLogin}>
                  Conhecer o painel escolar <ArrowRight aria-hidden="true" />
                </button>
              </article>
              <article className="card flex flex-col p-7">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand-soft text-action">
                  <Users aria-hidden="true" className="h-5 w-5" />
                </span>
                <h3 className="mt-6 text-xl font-semibold text-ink">Pais e responsáveis</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-ink-2">
                  Uma experiência simples no celular para acompanhar estudantes com vínculo aprovado, consultar o histórico, receber avisos e justificar ausências.
                </p>
                <ul className="mt-5 space-y-2 text-sm text-ink-2">
                  {['Presença do dia em destaque', 'Histórico da semana', 'Avisos da escola e justificativas'].map((item) => (
                    <li key={item} className="flex items-center gap-2"><CheckCircle2 aria-hidden="true" className="h-4 w-4 text-positive" />{item}</li>
                  ))}
                </ul>
                <button type="button" className="btn-link mt-auto pt-7" onClick={onParentLogin}>
                  Conhecer o portal <ArrowRight aria-hidden="true" />
                </button>
              </article>
            </div>
          </div>
        </section>

        {/* O projeto */}
        <section id="o-projeto" className="scroll-mt-20 border-y border-line bg-surface px-5 py-20 sm:px-8 lg:py-24">
          <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
            <div>
              <p className="eyebrow">Transparência em cada etapa</p>
              <h2 className="display-title mt-3 text-[30px] sm:text-[36px]">Um piloto local. Um futuro em construção.</h2>
              <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-ink-2">
                O projeto acadêmico contempla uma escola pública de ensino fundamental e duas catracas. As passagens são registradas pelo protótipo de reconhecimento facial ou por passagem assistida da portaria. Catraca física, biometria homologada e canais externos ainda não estão operacionais.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                <span className="chip chip-neutral"><Building2 aria-hidden="true" />1 escola</span>
                <span className="chip chip-brand"><ScanFace aria-hidden="true" />Reconhecimento facial em protótipo</span>
                <span className="chip chip-positive"><ShieldCheck aria-hidden="true" />Vínculos autorizados</span>
                <span className="chip chip-neutral"><Wifi aria-hidden="true" />Fila local preservada</span>
              </div>

              <button type="button" className="btn btn-primary mt-7" onClick={onOpenPresentation}>
                <Presentation aria-hidden="true" />
                Ver a apresentação do projeto
              </button>

              <dl className="mt-10 grid gap-4 sm:grid-cols-3">
                {GOALS.map(([value, label]) => (
                  <div key={label} className="border-l-2 border-brand pl-4">
                    <dt className="sr-only">Meta</dt>
                    <dd className="tabular text-2xl font-bold tracking-tight text-ink">{value}</dd>
                    <dd className="mt-1 text-[13px] leading-snug text-muted">{label}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-5 text-xs text-muted">Metas de homologação do piloto, não resultados medidos.</p>
            </div>
            <figure className="card overflow-hidden p-6">
              <img
                src="/logo-catraca-troia.png"
                width={1470}
                height={1070}
                alt="Ilustração da identidade visual: uma catraca tripé ao lado de um rosto em traço fino, ligados por uma malha laranja de pontos de leitura."
                className="h-auto w-full"
                loading="lazy"
              />
              <figcaption className="mt-4 border-t border-line pt-4 text-xs text-muted">
                Identidade visual do projeto: a catraca e a pessoa, conectadas por pontos de leitura.
              </figcaption>
            </figure>
          </div>
        </section>

        {/* FAQ */}
        <section aria-labelledby="faq-title" className="px-5 py-20 sm:px-8 lg:py-24">
          <div className="mx-auto max-w-3xl">
            <p className="eyebrow">Perguntas frequentes</p>
            <h2 id="faq-title" className="display-title mt-3 text-[30px] sm:text-[36px]">Clareza para começar.</h2>
            <div className="mt-10 divide-y divide-line border-y border-line">
              {FAQ.map(([question, answer]) => (
                <details key={question} className="group py-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[16px] font-semibold text-ink [&::-webkit-details-marker]:hidden">
                    {question}
                    <span aria-hidden="true" className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-line text-muted transition-transform group-open:rotate-45">+</span>
                  </summary>
                  <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-ink-2">{answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* CTA final */}
        <section className="border-t border-line bg-surface px-5 py-20 text-center sm:px-8">
          <h2 className="display-title text-[30px] sm:text-[40px]">Escola e família, do mesmo lado.</h2>
          <p className="mx-auto mt-4 max-w-md text-[15px] text-ink-2">Escolha o ambiente adequado ao seu perfil.</p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <button type="button" className="btn btn-primary btn-lg" onClick={onParentLogin}>
              <ArrowRight aria-hidden="true" />
              Sou responsável
            </button>
            <button type="button" className="btn btn-secondary btn-lg" onClick={onSchoolLogin}>
              <Building2 aria-hidden="true" />
              Sou da equipe escolar
            </button>
          </div>
          <button type="button" className="btn-link mx-auto mt-6 max-w-full whitespace-normal text-center" onClick={onParentRegister}>
            Ainda não tenho acesso: criar cadastro de responsável <ArrowRight aria-hidden="true" />
          </button>
        </section>
      </main>

      <footer className="border-t border-line px-5 py-8 sm:px-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <BrandLockup size={40} />
          <p className="text-xs text-muted">Protótipo acadêmico · Reconhecimento facial em laboratório · Sem catraca física ou notificações externas.</p>
        </div>
      </footer>
    </div>
  );
};
