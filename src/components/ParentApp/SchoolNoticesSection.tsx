import React, { useState } from 'react';
import { ArrowRight, CheckCircle2, Megaphone } from 'lucide-react';
import type { SchoolNotice } from '../../types';
import { EmptyInboxIllustration } from '../brand/Illustrations';
import { CategoryChip, PriorityChip } from '../SchoolNoticesManager';
import { EmptyState, Modal } from '../ui';

interface SchoolNoticesSectionProps {
  notices: SchoolNotice[];
  onMarkAsRead: (id: string) => void;
  canMarkAsRead?: boolean;
  variant?: 'summary' | 'full';
  onViewAll?: () => void;
}

export const SchoolNoticesSection: React.FC<SchoolNoticesSectionProps> = ({
  notices,
  onMarkAsRead,
  canMarkAsRead = true,
  variant = 'full',
  onViewAll,
}) => {
  const [selected, setSelected] = useState<SchoolNotice | null>(null);
  const unread = notices.filter((notice) => notice.isUnread).length;
  const visible = variant === 'summary' ? notices.slice(0, 2) : notices;

  const open = (notice: SchoolNotice) => {
    setSelected(notice);
    if (notice.isUnread && canMarkAsRead) onMarkAsRead(notice.id);
  };

  const reader = (
    <Modal
      isOpen={Boolean(selected)}
      onClose={() => setSelected(null)}
      labelledById="parent-notice-title"
      title={selected?.title}
      description={selected ? `${selected.author} · ${selected.date}` : undefined}
      size="lg"
      footer={
        <>
          <span className="mr-auto flex items-center gap-1.5 text-xs text-muted">
            <CheckCircle2 aria-hidden="true" className="h-3.5 w-3.5" />
            {canMarkAsRead ? 'Leitura registrada no portal' : 'Reconecte-se para registrar a leitura'}
          </span>
          <button type="button" className="btn btn-primary" onClick={() => setSelected(null)}>Fechar</button>
        </>
      }
    >
      {selected && (
        <div className="space-y-5">
          <div className="flex flex-wrap gap-2">
            <CategoryChip category={selected.category} />
            <PriorityChip priority={selected.priority} />
          </div>
          <p className="border-l-2 border-brand pl-4 text-[15px] font-medium leading-relaxed text-ink">{selected.summary}</p>
          <div className="whitespace-pre-line text-sm leading-relaxed text-ink-2">{selected.fullContent}</div>
          <p className="text-xs text-muted">{selected.role}</p>
        </div>
      )}
    </Modal>
  );

  if (variant === 'summary') {
    return (
      <section className="card p-6" aria-labelledby="notices-summary-title">
        <div className="flex items-center justify-between gap-3">
          <h2 id="notices-summary-title" className="card-title">Da escola para você</h2>
          {unread > 0 && (
            <span className="chip chip-brand">
              <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-brand" />
              {unread} {unread === 1 ? 'novo' : 'novos'}
            </span>
          )}
        </div>
        {visible.length === 0 ? (
          <EmptyState compact illustration={<EmptyInboxIllustration className="mb-3 h-16" />} title="Nenhum aviso publicado" />
        ) : (
          <ul className="mt-2 divide-y divide-line">
            {visible.map((notice) => (
              <li key={notice.id} className="flex gap-3.5 py-5">
                <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-action">
                  <Megaphone aria-hidden="true" className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="flex items-center gap-2 text-sm font-semibold text-ink">
                    {notice.title}
                    {notice.isUnread && <span className="sr-only">(não lido)</span>}
                    {notice.isUnread && <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />}
                  </p>
                  <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-ink-2">{notice.summary}</p>
                  <button type="button" className="btn-link mt-2.5" onClick={() => open(notice)}>
                    <ArrowRight aria-hidden="true" />
                    Ler comunicado
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
        {onViewAll && notices.length > 0 && (
          <button type="button" className="btn btn-secondary mt-1 w-full" onClick={onViewAll}>Ver todos os avisos</button>
        )}
        {reader}
      </section>
    );
  }

  return (
    <section aria-labelledby="notices-full-title">
      <div className="mb-5 flex items-end justify-between gap-3">
        <div>
          <h2 id="notices-full-title" className="text-xl font-semibold tracking-tight text-ink">Avisos da escola</h2>
          <p className="mt-1 text-sm text-muted">Comunicados oficiais da gestão escolar.</p>
        </div>
        {unread > 0 && <span className="chip chip-brand">{unread} não {unread === 1 ? 'lido' : 'lidos'}</span>}
      </div>
      {visible.length === 0 ? (
        <div className="card">
          <EmptyState illustration={<EmptyInboxIllustration className="mb-4 h-20" />} title="Nenhum aviso publicado" description="Os comunicados da escola aparecem aqui." />
        </div>
      ) : (
        <ul className="space-y-3">
          {visible.map((notice) => (
            <li key={notice.id}>
              <button
                type="button"
                onClick={() => open(notice)}
                className={`card group block w-full p-5 text-left transition-colors hover:border-line-strong ${notice.isUnread ? 'shadow-[inset_3px_0_0_var(--color-brand)]' : ''}`}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <CategoryChip category={notice.category} />
                  <PriorityChip priority={notice.priority} />
                  {notice.isUnread && <span className="chip chip-brand">Novo</span>}
                  <span className="ml-auto text-xs text-muted">{notice.date}</span>
                </div>
                <p className="mt-3 text-[15px] font-semibold text-ink">{notice.title}</p>
                <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-ink-2">{notice.summary}</p>
                <span className="btn-link mt-3">
                  Ler comunicado <ArrowRight aria-hidden="true" />
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {reader}
    </section>
  );
};
