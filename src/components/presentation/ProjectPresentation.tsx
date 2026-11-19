import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, LayoutGrid, Maximize2, Minimize2, X } from 'lucide-react';
import { BrandLockup } from '../brand/BrandMark';
import { SLIDES } from './slides';

interface ProjectPresentationProps {
  onExit: () => void;
}

/** Índice (0-based) a partir de #/projeto/N, com N começando em 1. */
const slideFromHash = () => {
  const value = Number(window.location.hash.split('/')[2]);
  return Number.isInteger(value) && value >= 1 && value <= SLIDES.length ? value - 1 : 0;
};

/**
 * Apresentação do projeto para a disciplina de Gerência de Projetos.
 * Navegação: setas, espaço, Page Up/Down, Home/End, toque (deslizar) e botões.
 * F alterna tela cheia; G abre a visão geral dos slides.
 */
export const ProjectPresentation: React.FC<ProjectPresentationProps> = ({ onExit }) => {
  const [index, setIndex] = useState(slideFromHash);
  const [direction, setDirection] = useState<'next' | 'prev' | undefined>();
  const [overview, setOverview] = useState(false);
  const [fullscreen, setFullscreen] = useState(Boolean(document.fullscreenElement));
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const slide = SLIDES[index];

  const goTo = useCallback((next: number) => {
    const target = Math.max(0, Math.min(SLIDES.length - 1, next));
    setIndex((current) => {
      if (target !== current) setDirection(target > current ? 'next' : 'prev');
      return target;
    });
    setOverview(false);
  }, []);

  useEffect(() => {
    const onHashChange = () => {
      if (window.location.hash.startsWith('#/projeto')) goTo(slideFromHash());
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, [goTo]);

  // O número do slide fica na URL (sem disparar hashchange) para reabrir no mesmo ponto.
  useEffect(() => {
    window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}#/projeto/${index + 1}`);
    document.title = `${slide.title} · Catraca de Troia`;
  }, [index, slide.title]);

  useEffect(() => () => { document.title = 'Catraca de Troia — Demonstração Acadêmica'; }, []);

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void document.documentElement.requestFullscreen?.().catch(() => undefined);
  }, []);

  useEffect(() => {
    const update = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', update);
    return () => document.removeEventListener('fullscreenchange', update);
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      const target = event.target as HTMLElement | null;
      if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;
      if (event.key === ' ' && target?.closest('button, a')) return;
      if (overview && event.key === 'Escape') { setOverview(false); return; }
      switch (event.key) {
        case 'ArrowRight': case 'ArrowDown': case 'PageDown': case ' ':
          event.preventDefault(); goTo(index + 1); break;
        case 'ArrowLeft': case 'ArrowUp': case 'PageUp':
          event.preventDefault(); goTo(index - 1); break;
        case 'Home': event.preventDefault(); goTo(0); break;
        case 'End': event.preventDefault(); goTo(SLIDES.length - 1); break;
        case 'f': case 'F': toggleFullscreen(); break;
        case 'g': case 'G': setOverview((current) => !current); break;
        default:
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [goTo, index, overview, toggleFullscreen]);

  const onTouchStart = (event: React.TouchEvent) => {
    const touch = event.touches[0];
    touchStart.current = { x: touch.clientX, y: touch.clientY };
  };
  const onTouchEnd = (event: React.TouchEvent) => {
    const start = touchStart.current;
    touchStart.current = null;
    if (!start) return;
    const touch = event.changedTouches[0];
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    // Só gesto horizontal claro: rolar o slide no celular não troca de slide.
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) goTo(index + (dx < 0 ? 1 : -1));
  };

  const dark = slide.theme === 'dark';
  const control = dark
    ? 'border-white/15 bg-white/5 text-white hover:bg-white/10'
    : 'border-[#e5e7eb] bg-white text-[#1f2937] hover:bg-[#f3f4f6]';

  return (
    <div className="deck" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      {/* Progresso */}
      <div className="absolute inset-x-0 top-0 z-20 h-1 bg-black/10" aria-hidden="true">
        <div className="h-full bg-[#ff6a00] transition-[width] duration-500 ease-out" style={{ width: `${((index + 1) / SLIDES.length) * 100}%` }} />
      </div>

      {/* Barra superior */}
      <header className="absolute inset-x-0 top-0 z-20 flex items-center justify-between gap-3 px-4 pt-4 sm:px-8">
        {/* Variante escura da marca (como na arte), legível sobre fundo claro ou escuro. */}
        <BrandLockup size={40} className="sm:w-[134px]" />
        <div className="flex items-center gap-2">
          <button type="button" className={`inline-flex h-10 w-10 items-center justify-center rounded-xl border transition-colors ${control}`} onClick={() => setOverview(true)} aria-label="Ver todos os slides (G)" title="Todos os slides (G)">
            <LayoutGrid className="h-4 w-4" aria-hidden="true" />
          </button>
          <button type="button" className={`hidden h-10 w-10 items-center justify-center rounded-xl border transition-colors sm:inline-flex ${control}`} onClick={toggleFullscreen} aria-label={fullscreen ? 'Sair da tela cheia (F)' : 'Tela cheia (F)'} title="Tela cheia (F)">
            {fullscreen ? <Minimize2 className="h-4 w-4" aria-hidden="true" /> : <Maximize2 className="h-4 w-4" aria-hidden="true" />}
          </button>
          <button type="button" className={`inline-flex h-10 items-center gap-2 rounded-xl border px-3 text-sm font-semibold transition-colors ${control}`} onClick={onExit}>
            <X className="h-4 w-4" aria-hidden="true" />
            <span className="max-sm:sr-only">Sair</span>
          </button>
        </div>
      </header>

      {/* Slide atual: a chave remonta o slide e reinicia as animações de entrada. */}
      <section
        key={slide.id}
        className="deck-slide"
        data-theme={slide.theme}
        data-direction={direction}
        role="group"
        aria-roledescription="slide"
        aria-label={`${index + 1} de ${SLIDES.length}: ${slide.title}`}
      >
        <slide.Component />
      </section>

      {/* Navegação inferior */}
      <footer className="absolute inset-x-0 bottom-0 z-20 flex items-center justify-between gap-3 px-4 pb-4 sm:px-8 sm:pb-6">
        <p className={`text-sm font-semibold tabular-nums ${dark ? 'text-[#d1d5db]' : 'text-[#4b5563]'}`} aria-live="polite">
          <span className={dark ? 'text-white' : 'text-[#1f2937]'}>{String(index + 1).padStart(2, '0')}</span> / {String(SLIDES.length).padStart(2, '0')}
          <span className="ml-3 hidden md:inline">{slide.title}</span>
        </p>
        <div className="flex items-center gap-2">
          <button type="button" className={`inline-flex h-11 w-11 items-center justify-center rounded-full border transition-colors disabled:opacity-35 ${control}`} onClick={() => goTo(index - 1)} disabled={index === 0} aria-label="Slide anterior">
            <ChevronLeft className="h-5 w-5" aria-hidden="true" />
          </button>
          <button type="button" className="inline-flex h-11 items-center gap-2 rounded-full bg-[#c2410c] px-5 text-sm font-bold text-white shadow-lg shadow-black/20 transition-colors hover:bg-[#9a3412] disabled:opacity-40" onClick={() => goTo(index + 1)} disabled={index === SLIDES.length - 1}>
            Próximo
            <ChevronRight className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </footer>

      {/* Visão geral */}
      {overview && (
        <div role="dialog" aria-modal="true" aria-label="Todos os slides" className="absolute inset-0 z-30 overflow-y-auto bg-[#0b151d]/95 p-4 backdrop-blur sm:p-10">
          <div className="mx-auto flex max-w-6xl items-center justify-between">
            <p className="text-lg font-bold text-white">Todos os slides</p>
            <button type="button" className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/15 px-3 text-sm font-semibold text-white hover:bg-white/10" onClick={() => setOverview(false)}>
              <X className="h-4 w-4" aria-hidden="true" />
              Fechar
            </button>
          </div>
          <ol className="mx-auto mt-6 grid max-w-6xl gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {SLIDES.map((item, position) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => goTo(position)}
                  aria-current={position === index ? 'step' : undefined}
                  className={`flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition-colors ${position === index ? 'border-[#ff6a00] bg-[#ff6a00]/10' : 'border-white/10 bg-white/5 hover:bg-white/10'}`}
                >
                  <span className="tabular-nums text-sm font-bold text-[#ff6a00]">{String(position + 1).padStart(2, '0')}</span>
                  <span className="text-sm font-semibold text-white">{item.title}</span>
                </button>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
};

export default ProjectPresentation;
