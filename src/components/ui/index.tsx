import React from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  CircleDashed,
  Info,
  LucideIcon,
  X,
  XCircle,
} from 'lucide-react';
import { useAccessibleDialog } from '../../hooks/useAccessibleDialog';

/* ------------------------------------------------------------------ */
/* Utilidades                                                          */
/* ------------------------------------------------------------------ */

export const cx = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(' ');

const TITLE_PATTERN = /^(prof(a|ª|essora|essor)?|dr(a|ª)?|sr(a|ª)?|diretor(a)?)\.?$/i;

/** Remove títulos de tratamento (Profª., Dr., Sra.) antes de extrair nomes. */
export const nameParts = (name?: string) =>
  (name ?? '').replace(/\([^)]*\)/g, ' ').trim().split(/\s+/).filter((part) => part && !TITLE_PATTERN.test(part));

/** "Claudia Mendes (Mãe)" → "Claudia Mendes" — o parentesco aparece em coluna própria. */
export const withoutRelation = (name: string) => name.replace(/\s*\([^)]*\)\s*$/, '');

export const greetingForNow = (date = new Date()) => {
  const hour = date.getHours();
  return hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';
};

/** Link "pular para o conteúdo" que não altera a rota (o app navega por hash). */
export const focusMainContent = (id: string) => (event: React.MouseEvent<HTMLAnchorElement>) => {
  event.preventDefault();
  const target = document.getElementById(id);
  target?.focus();
  target?.scrollIntoView({ block: 'start' });
};

export const firstNameOf = (name?: string) => nameParts(name)[0] ?? name ?? '';

export const initialsOf = (name?: string) => {
  const parts = nameParts(name).filter((part) => !/^(de|da|do|das|dos|e)$/i.test(part));
  if (parts.length === 0) return '—';
  const first = parts[0][0];
  const last = parts.length > 1 ? parts.at(-1)![0] : '';
  return `${first}${last}`.toUpperCase();
};

/* ------------------------------------------------------------------ */
/* Avatar com iniciais — evita expor imagens de crianças               */
/* ------------------------------------------------------------------ */

const AVATAR_TINTS = [
  'bg-[#eaf4ee] text-[#2b6a4a]',
  'bg-[#ebf0f7] text-[#35537d]',
  'bg-[#f7ecee] text-[#8a3d4a]',
  'bg-[#f5efe6] text-[#7a5a2e]',
  'bg-[#eef0f3] text-[#46536a]',
];

const hashOf = (value: string) =>
  [...value].reduce((total, char) => (total * 31 + char.charCodeAt(0)) >>> 0, 7);

export const Avatar: React.FC<{ name?: string; size?: 'sm' | 'md' | 'lg'; className?: string }> = ({
  name = '',
  size = 'md',
  className,
}) => {
  const dimension = size === 'sm' ? 'h-7 w-7 text-[10px]' : size === 'lg' ? 'h-11 w-11 text-sm' : 'h-9 w-9 text-[11px]';
  return (
    <span
      aria-hidden="true"
      className={cx(
        'inline-flex shrink-0 select-none items-center justify-center rounded-full font-semibold tracking-wide',
        dimension,
        AVATAR_TINTS[hashOf(name) % AVATAR_TINTS.length],
        className,
      )}
    >
      {initialsOf(name)}
    </span>
  );
};

/* ------------------------------------------------------------------ */
/* Chips de estado — sempre ícone + texto                              */
/* ------------------------------------------------------------------ */

export type Tone = 'neutral' | 'brand' | 'positive' | 'warning' | 'negative' | 'info';

export const Chip: React.FC<{
  tone?: Tone;
  icon?: LucideIcon;
  children: React.ReactNode;
  className?: string;
  title?: string;
}> = ({ tone = 'neutral', icon: Icon, children, className, title }) => (
  <span className={cx('chip', `chip-${tone}`, className)} title={title}>
    {Icon && <Icon aria-hidden="true" />}
    {children}
  </span>
);

export const DotLabel: React.FC<{ tone?: Tone; children: React.ReactNode }> = ({ tone = 'brand', children }) => {
  const dot = {
    neutral: 'bg-subtle',
    brand: 'bg-brand',
    positive: 'bg-positive',
    warning: 'bg-warning',
    negative: 'bg-negative',
    info: 'bg-info',
  }[tone];
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted">
      <span aria-hidden="true" className={cx('h-1.5 w-1.5 rounded-full', dot)} />
      {children}
    </span>
  );
};

/* ------------------------------------------------------------------ */
/* Cabeçalho de página                                                 */
/* ------------------------------------------------------------------ */

export const PageHeader: React.FC<{
  eyebrow?: string;
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
}> = ({ eyebrow, title, description, actions }) => (
  <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
    <div className="min-w-0">
      {eyebrow && <p className="eyebrow-muted mb-2">{eyebrow}</p>}
      <h1 className="display-title text-[26px] sm:text-[30px]">{title}</h1>
      {description && <p className="mt-2 max-w-2xl text-sm text-muted">{description}</p>}
    </div>
    {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
  </header>
);

/* ------------------------------------------------------------------ */
/* Card com cabeçalho                                                  */
/* ------------------------------------------------------------------ */

export const Panel: React.FC<{
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  id?: string;
  as?: 'section' | 'div' | 'article';
}> = ({ title, subtitle, actions, children, className, bodyClassName, id, as: Tag = 'section' }) => (
  <Tag id={id} className={cx('card overflow-hidden', className)}>
    {(title || actions) && (
      <div className="card-header">
        <div className="min-w-0">
          {title && <h2 className="card-title">{title}</h2>}
          {subtitle && <p className="card-subtitle">{subtitle}</p>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </div>
    )}
    <div className={bodyClassName}>{children}</div>
  </Tag>
);

/* ------------------------------------------------------------------ */
/* Stat tile — o número é o gráfico                                    */
/* ------------------------------------------------------------------ */

export const StatTile: React.FC<{
  label: string;
  value: React.ReactNode;
  caption?: React.ReactNode;
  icon?: LucideIcon;
  emphasis?: boolean;
  onClick?: () => void;
}> = ({ label, value, caption, icon: Icon, emphasis, onClick }) => {
  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <span className="text-[13px] font-medium text-ink-2">{label}</span>
        {Icon && <Icon aria-hidden="true" className="h-[18px] w-[18px] text-muted" />}
      </div>
      <div className="mt-3 text-[34px] font-bold leading-none tracking-tight text-ink">{value}</div>
      {caption && <div className="mt-3 text-xs text-muted">{caption}</div>}
    </>
  );
  const className = cx(
    'card relative block w-full p-5 text-left',
    emphasis && 'before:absolute before:inset-x-0 before:top-0 before:h-[3px] before:rounded-t-[12px] before:bg-brand',
    onClick && 'cursor-pointer transition-colors hover:border-line-strong',
  );
  return onClick ? (
    <button type="button" onClick={onClick} className={className}>{content}</button>
  ) : (
    <div className={className}>{content}</div>
  );
};

/* ------------------------------------------------------------------ */
/* Avisos contextuais                                                  */
/* ------------------------------------------------------------------ */

const CALLOUT_STYLES: Record<Tone, { box: string; icon: LucideIcon; iconColor: string }> = {
  neutral: { box: 'bg-surface border-line text-ink-2', icon: Info, iconColor: 'text-muted' },
  brand: { box: 'bg-[#fffaf5] border-brand-line text-ink-2', icon: Info, iconColor: 'text-action' },
  positive: { box: 'bg-positive-soft border-positive-line text-[#145f3e]', icon: CheckCircle2, iconColor: 'text-positive' },
  warning: { box: 'bg-warning-soft border-warning-line text-[#6f4508]', icon: AlertTriangle, iconColor: 'text-warning' },
  negative: { box: 'bg-negative-soft border-negative-line text-[#8f2329]', icon: XCircle, iconColor: 'text-negative' },
  info: { box: 'bg-info-soft border-info-line text-[#24426a]', icon: Info, iconColor: 'text-info' },
};

export const Callout: React.FC<{
  tone?: Tone;
  icon?: LucideIcon;
  title?: React.ReactNode;
  children?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
  role?: 'status' | 'alert';
}> = ({ tone = 'neutral', icon, title, children, action, className, role }) => {
  const style = CALLOUT_STYLES[tone];
  const Icon = icon ?? style.icon;
  return (
    <div role={role} aria-live={role === 'status' ? 'polite' : undefined} className={cx('flex items-start gap-3 rounded-[10px] border px-4 py-3 text-[13px] leading-relaxed', style.box, className)}>
      <Icon aria-hidden="true" className={cx('mt-0.5 h-4 w-4 shrink-0', style.iconColor)} />
      <div className="min-w-0 flex-1">
        {title && <span className="font-semibold text-ink">{title} </span>}
        {children}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Estado vazio                                                        */
/* ------------------------------------------------------------------ */

export const EmptyState: React.FC<{
  icon?: LucideIcon;
  illustration?: React.ReactNode;
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  compact?: boolean;
}> = ({ icon: Icon = CircleDashed, illustration, title, description, action, compact }) => (
  <div className={cx('flex flex-col items-center text-center', compact ? 'px-6 py-8' : 'px-6 py-14')}>
    {illustration ?? (
      <span className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand-soft text-action">
        <Icon aria-hidden="true" className="h-5 w-5" />
      </span>
    )}
    <p className="text-[15px] font-semibold text-ink">{title}</p>
    {description && <p className="mt-1 max-w-sm text-[13px] text-muted">{description}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);

/* ------------------------------------------------------------------ */
/* Linhas de carregamento                                              */
/* ------------------------------------------------------------------ */

export const SkeletonRows: React.FC<{ rows?: number }> = ({ rows = 4 }) => (
  <div className="space-y-3 p-5" aria-hidden="true">
    {Array.from({ length: rows }, (_, index) => (
      <div key={index} className="flex items-center gap-3">
        <div className="skeleton h-9 w-9 rounded-full" />
        <div className="flex-1 space-y-2">
          <div className="skeleton h-3 w-1/3" />
          <div className="skeleton h-3 w-1/5" />
        </div>
        <div className="skeleton h-6 w-16" />
      </div>
    ))}
  </div>
);

/* ------------------------------------------------------------------ */
/* Diálogo modal                                                       */
/* ------------------------------------------------------------------ */

export const Modal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  icon?: LucideIcon;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  closeDisabled?: boolean;
  labelledById: string;
  initialFocusRef?: React.RefObject<HTMLElement | null>;
}> = ({ isOpen, onClose, title, description, icon: Icon, children, footer, size = 'md', closeDisabled, labelledById, initialFocusRef }) => {
  const dialogRef = useAccessibleDialog({ isOpen, onClose, closeOnEscape: !closeDisabled, initialFocusRef });
  if (!isOpen) return null;
  const width = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }[size];
  return (
    <div className="overlay flex items-end justify-center sm:items-center sm:p-6" onMouseDown={(event) => {
      if (event.target === event.currentTarget && !closeDisabled) onClose();
    }}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledById}
        tabIndex={-1}
        className={cx('dialog-panel flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-[var(--shadow-pop)] sm:rounded-2xl', width)}
      >
        <header className="flex items-start gap-3 border-b border-line px-6 py-5">
          {Icon && (
            <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-action">
              <Icon aria-hidden="true" className="h-[18px] w-[18px]" />
            </span>
          )}
          <div className="min-w-0 flex-1">
            <h2 id={labelledById} className="text-[17px] font-semibold tracking-tight text-ink">{title}</h2>
            {description && <p className="mt-1 text-[13px] text-muted">{description}</p>}
          </div>
          <button type="button" className="icon-btn -mr-2 -mt-1" onClick={onClose} disabled={closeDisabled} aria-label="Fechar">
            <X />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer && <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-line bg-surface px-6 py-4">{footer}</footer>}
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Drawer lateral                                                      */
/* ------------------------------------------------------------------ */

export const Drawer: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  labelledById: string;
  side?: 'right' | 'left';
  widthClassName?: string;
}> = ({ isOpen, onClose, title, description, children, footer, labelledById, side = 'right', widthClassName = 'max-w-md' }) => {
  const dialogRef = useAccessibleDialog({ isOpen, onClose });
  if (!isOpen) return null;
  return (
    <div className="overlay" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <aside
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledById}
        tabIndex={-1}
        className={cx(
          'drawer-panel absolute inset-y-0 flex w-full flex-col bg-white shadow-[var(--shadow-pop)]',
          side === 'right' ? 'right-0' : 'left-0',
          widthClassName,
        )}
      >
        <header className="flex items-start gap-3 border-b border-line px-5 py-4">
          <div className="min-w-0 flex-1">
            <h2 id={labelledById} className="text-base font-semibold text-ink">{title}</h2>
            {description && <p className="mt-0.5 text-[13px] text-muted">{description}</p>}
          </div>
          <button type="button" className="icon-btn -mr-2" onClick={onClose} aria-label="Fechar painel">
            <X />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto">{children}</div>
        {footer && <footer className="border-t border-line px-5 py-4">{footer}</footer>}
      </aside>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Campo de formulário                                                 */
/* ------------------------------------------------------------------ */

export const Field: React.FC<{
  label: React.ReactNode;
  htmlFor: string;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}> = ({ label, htmlFor, hint, error, children, className }) => (
  <div className={className}>
    <label htmlFor={htmlFor} className="field-label">{label}</label>
    {children}
    {error ? <p className="field-error" role="alert">{error}</p> : hint ? <p className="field-hint">{hint}</p> : null}
  </div>
);

/* ------------------------------------------------------------------ */
/* Linha de definição (ficha / detalhes)                               */
/* ------------------------------------------------------------------ */

export const DefinitionList: React.FC<{ items: Array<[React.ReactNode, React.ReactNode]>; columns?: 1 | 2 }> = ({ items, columns = 2 }) => (
  <dl className={cx('grid gap-x-6 gap-y-4', columns === 2 ? 'sm:grid-cols-2' : '')}>
    {items.map(([term, detail], index) => (
      <div key={index} className="min-w-0">
        <dt className="text-xs font-medium text-muted">{term}</dt>
        <dd className="mt-1 break-words text-sm font-medium text-ink">{detail}</dd>
      </div>
    ))}
  </dl>
);
