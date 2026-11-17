import React, { useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  BellRing,
  CalendarDays,
  CheckCircle2,
  GraduationCap,
  Info,
  Megaphone,
  MessageCircleQuestion,
  PencilLine,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import type { SchoolNotice } from '../types';
import { EmptyInboxIllustration } from './brand/Illustrations';
import { Callout, Chip, EmptyState, Field, Modal, PageHeader } from './ui';

interface SchoolNoticesManagerProps {
  notices: SchoolNotice[];
  onAddNotice: (notice: Omit<SchoolNotice, 'id'>, notifyGuardians: boolean) => Promise<void>;
  onUpdateNotice: (notice: SchoolNotice) => Promise<void>;
  onDeleteNotice: (id: string) => Promise<void>;
  onBroadcastPush: (notice: SchoolNotice) => Promise<void>;
  canManage: boolean;
  persistenceState: 'loading' | 'persistent' | 'unavailable';
  persistenceError?: string;
}

type Category = SchoolNotice['category'];

const CATEGORIES: Array<{ id: 'Todas' | Category; label: string }> = [
  { id: 'Todas', label: 'Todos' },
  { id: 'Pedagógico', label: 'Pedagógico' },
  { id: 'Segurança', label: 'Segurança' },
  { id: 'Eventos', label: 'Eventos' },
  { id: 'Plantão', label: 'Plantão' },
  { id: 'Geral', label: 'Geral' },
];

const CATEGORY_ICON: Record<Category, typeof Megaphone> = {
  Pedagógico: GraduationCap,
  Segurança: ShieldCheck,
  Eventos: CalendarDays,
  Plantão: MessageCircleQuestion,
  Geral: Megaphone,
};

export const PriorityChip: React.FC<{ priority: SchoolNotice['priority'] }> = ({ priority }) => {
  if (priority === 'urgent') return <Chip tone="negative" icon={AlertCircle}>Urgente</Chip>;
  if (priority === 'important') return <Chip tone="warning" icon={Info}>Importante</Chip>;
  return <Chip tone="neutral" icon={Info}>Informativo</Chip>;
};

export const CategoryChip: React.FC<{ category: Category }> = ({ category }) => (
  <Chip tone="neutral" icon={CATEGORY_ICON[category] ?? Megaphone}>{category}</Chip>
);

const EMPTY_FORM = {
  title: '',
  category: 'Pedagógico' as Category,
  priority: 'important' as SchoolNotice['priority'],
  author: 'Diretoria Pedagógica',
  role: 'Profa. Regina Vasconcelos',
  summary: '',
  fullContent: '',
};

export const SchoolNoticesManager: React.FC<SchoolNoticesManagerProps> = ({
  notices,
  onAddNotice,
  onUpdateNotice,
  onDeleteNotice,
  onBroadcastPush,
  canManage,
  persistenceState,
  persistenceError,
}) => {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<'Todas' | Category>('Todas');
  const [priority, setPriority] = useState<'Todas' | SchoolNotice['priority']>('Todas');

  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [editingNotice, setEditingNotice] = useState<SchoolNotice | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [autoBroadcast, setAutoBroadcast] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [composerError, setComposerError] = useState<string>();

  const [readingNotice, setReadingNotice] = useState<SchoolNotice | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<SchoolNotice | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [broadcastSuccess, setBroadcastSuccess] = useState<string | null>(null);
  const [operationError, setOperationError] = useState<string>();

  const update = <K extends keyof typeof EMPTY_FORM>(key: K, value: (typeof EMPTY_FORM)[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const openNew = () => {
    setEditingNotice(null);
    setForm(EMPTY_FORM);
    setAutoBroadcast(true);
    setComposerError(undefined);
    setIsComposerOpen(true);
  };

  const openEdit = (notice: SchoolNotice) => {
    setEditingNotice(notice);
    setForm({
      title: notice.title,
      category: notice.category,
      priority: notice.priority,
      author: notice.author,
      role: notice.role,
      summary: notice.summary,
      fullContent: notice.fullContent,
    });
    setAutoBroadcast(false);
    setComposerError(undefined);
    setReadingNotice(null);
    setIsComposerOpen(true);
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.title.trim() || !form.summary.trim() || !form.fullContent.trim()) return;
    const time = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    setIsSaving(true);
    setComposerError(undefined);
    try {
      if (editingNotice) {
        await onUpdateNotice({ ...editingNotice, ...form, attachmentName: undefined });
      } else {
        await onAddNotice({ ...form, date: `Hoje, ${time}`, time, isUnread: true, attachmentName: undefined }, autoBroadcast);
      }
      setIsComposerOpen(false);
    } catch (error) {
      setComposerError(error instanceof Error ? error.message : 'Não foi possível salvar o comunicado.');
    } finally {
      setIsSaving(false);
    }
  };

  const broadcast = async (notice: SchoolNotice) => {
    setOperationError(undefined);
    try {
      await onBroadcastPush(notice);
      setBroadcastSuccess(notice.id);
      window.setTimeout(() => setBroadcastSuccess((current) => current === notice.id ? null : current), 3000);
    } catch (error) {
      setOperationError(error instanceof Error ? error.message : 'Não foi possível gerar as notificações internas.');
    }
  };

  const confirmDelete = async () => {
    if (!deleteCandidate) return;
    setIsDeleting(true);
    setOperationError(undefined);
    try {
      await onDeleteNotice(deleteCandidate.id);
      setDeleteCandidate(null);
    } catch (error) {
      setOperationError(error instanceof Error ? error.message : 'Não foi possível remover o comunicado.');
      setDeleteCandidate(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const term = search.trim().toLocaleLowerCase('pt-BR');
  const filtered = notices.filter((notice) =>
    (category === 'Todas' || notice.category === category)
    && (priority === 'Todas' || notice.priority === priority)
    && (!term || [notice.title, notice.summary, notice.author, notice.fullContent]
      .some((value) => value.toLocaleLowerCase('pt-BR').includes(term))));

  const countFor = (id: 'Todas' | Category) => id === 'Todas' ? notices.length : notices.filter((notice) => notice.category === id).length;

  return (
    <>
      <PageHeader
        eyebrow="Gestão escolar"
        title="Comunicados"
        description="Organize informações e mantenha as famílias por perto."
        actions={canManage && (
          <button type="button" className="btn btn-primary" onClick={openNew}>
            <Plus aria-hidden="true" />
            Novo comunicado
          </button>
        )}
      />

      <div role="tablist" aria-label="Categorias" className="tabs mb-5">
        {CATEGORIES.map((item) => (
          <button key={item.id} type="button" role="tab" aria-selected={category === item.id} className="tab inline-flex items-center gap-2" onClick={() => setCategory(item.id)}>
            {item.label}
            {countFor(item.id) > 0 && <span className={`count-badge ${category === item.id ? 'count-badge-brand' : ''}`}>{countFor(item.id)}</span>}
          </button>
        ))}
      </div>

      <div className="mb-5 grid gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
        <div className="relative">
          <label htmlFor="notices-search" className="sr-only">Buscar comunicados</label>
          <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
          <input id="notices-search" type="search" className="input pl-9 bg-white" placeholder="Buscar por título, conteúdo ou autor" value={search} onChange={(event) => setSearch(event.target.value)} />
        </div>
        <div>
          <label htmlFor="notices-priority" className="sr-only">Prioridade</label>
          <select id="notices-priority" className="select" value={priority} onChange={(event) => setPriority(event.target.value as typeof priority)}>
            <option value="Todas">Todas as prioridades</option>
            <option value="urgent">Urgente</option>
            <option value="important">Importante</option>
            <option value="info">Informativo</option>
          </select>
        </div>
      </div>

      {(persistenceState === 'unavailable' || operationError) && (
        <Callout tone={operationError ? 'negative' : 'warning'} role="alert" className="mb-5">
          {operationError || persistenceError || 'API de comunicados indisponível.'}
        </Callout>
      )}

      {persistenceState === 'loading' && notices.length === 0 ? (
        <div className="grid gap-4 lg:grid-cols-2" aria-hidden="true">
          {[0, 1].map((index) => (
            <div key={index} className="card space-y-3 p-6">
              <div className="skeleton h-6 w-24" />
              <div className="skeleton h-5 w-3/4" />
              <div className="skeleton h-4 w-full" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card">
          <EmptyState
            illustration={<EmptyInboxIllustration className="mb-4 h-20" />}
            title={notices.length === 0 ? 'Nenhum comunicado publicado' : 'Nenhum resultado'}
            description={notices.length === 0 ? 'Os comunicados publicados aparecem aqui e no portal dos responsáveis.' : 'Ajuste a busca, a categoria ou a prioridade.'}
            action={canManage && notices.length === 0 && <button type="button" className="btn btn-primary btn-sm" onClick={openNew}><Plus aria-hidden="true" />Novo comunicado</button>}
          />
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {filtered.map((notice) => (
            <article key={notice.id} className="card flex flex-col p-6">
              <div className="flex items-center justify-between gap-3">
                <CategoryChip category={notice.category} />
                <PriorityChip priority={notice.priority} />
              </div>
              <h2 className="mt-4 text-[17px] font-semibold leading-snug tracking-tight text-ink">{notice.title}</h2>
              <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-ink-2">{notice.summary}</p>
              <p className="mt-3 text-xs text-muted">{notice.author} · {notice.date}</p>
              <div className="mt-auto pt-5">
              <div className="flex items-center justify-between gap-2 border-t border-line pt-4">
                <button type="button" className="btn-link" onClick={() => setReadingNotice(notice)}>
                  Ler comunicado <ArrowRight aria-hidden="true" />
                </button>
                {canManage && (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      className={`btn btn-sm ${broadcastSuccess === notice.id ? 'btn-soft' : 'btn-ghost'}`}
                      onClick={() => void broadcast(notice)}
                      title="Gerar notificações internas para os responsáveis"
                    >
                      {broadcastSuccess === notice.id ? <CheckCircle2 aria-hidden="true" /> : <BellRing aria-hidden="true" />}
                      <span className="hidden sm:inline">{broadcastSuccess === notice.id ? 'Notificações geradas' : 'Notificar'}</span>
                    </button>
                    <button type="button" className="icon-btn" onClick={() => openEdit(notice)} aria-label={`Editar ${notice.title}`} title="Editar">
                      <PencilLine />
                    </button>
                    <button type="button" className="icon-btn hover:!bg-negative-soft hover:!text-negative" onClick={() => setDeleteCandidate(notice)} aria-label={`Excluir ${notice.title}`} title="Excluir">
                      <Trash2 />
                    </button>
                  </div>
                )}
              </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Leitura */}
      <Modal
        isOpen={Boolean(readingNotice)}
        onClose={() => setReadingNotice(null)}
        labelledById="notice-reader-title"
        title={readingNotice?.title}
        description={readingNotice ? `${readingNotice.author} · ${readingNotice.role} · ${readingNotice.date}` : undefined}
        size="lg"
        footer={
          <>
            {canManage && readingNotice && (
              <button type="button" className="btn btn-secondary" onClick={() => openEdit(readingNotice)}>
                <PencilLine aria-hidden="true" />
                Editar
              </button>
            )}
            <button type="button" className="btn btn-primary" onClick={() => setReadingNotice(null)}>Fechar</button>
          </>
        }
      >
        {readingNotice && (
          <div className="space-y-5">
            <div className="flex flex-wrap gap-2">
              <CategoryChip category={readingNotice.category} />
              <PriorityChip priority={readingNotice.priority} />
            </div>
            <p className="border-l-2 border-brand pl-4 text-[15px] font-medium leading-relaxed text-ink">{readingNotice.summary}</p>
            <div className="whitespace-pre-line text-sm leading-relaxed text-ink-2">{readingNotice.fullContent}</div>
          </div>
        )}
      </Modal>

      {/* Composição */}
      <Modal
        isOpen={isComposerOpen}
        onClose={() => setIsComposerOpen(false)}
        labelledById="notice-composer-title"
        title={editingNotice ? 'Editar comunicado' : 'Novo comunicado'}
        description="Publicado no portal dos responsáveis com vínculo aprovado."
        icon={Megaphone}
        size="lg"
        closeDisabled={isSaving}
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setIsComposerOpen(false)} disabled={isSaving}>Cancelar</button>
            <button type="submit" form="notice-composer-form" className="btn btn-primary" disabled={isSaving || !form.title.trim() || !form.summary.trim() || !form.fullContent.trim()}>
              {isSaving ? 'Salvando…' : editingNotice ? 'Salvar alterações' : 'Publicar'}
            </button>
          </>
        }
      >
        <form id="notice-composer-form" onSubmit={save} className="space-y-5">
          <Field label="Título" htmlFor="notice-title">
            <input id="notice-title" className="input" required maxLength={140} value={form.title} onChange={(event) => update('title', event.target.value)} placeholder="Ex.: Reunião de responsáveis do 5º ano" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Categoria" htmlFor="notice-category">
              <select id="notice-category" className="select" value={form.category} onChange={(event) => update('category', event.target.value as Category)}>
                {CATEGORIES.filter((item) => item.id !== 'Todas').map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
              </select>
            </Field>
            <Field label="Prioridade" htmlFor="notice-priority">
              <select id="notice-priority" className="select" value={form.priority} onChange={(event) => update('priority', event.target.value as SchoolNotice['priority'])}>
                <option value="info">Informativo</option>
                <option value="important">Importante</option>
                <option value="urgent">Urgente</option>
              </select>
            </Field>
            <Field label="Setor responsável" htmlFor="notice-author">
              <input id="notice-author" className="input" value={form.author} onChange={(event) => update('author', event.target.value)} />
            </Field>
            <Field label="Assinatura" htmlFor="notice-role">
              <input id="notice-role" className="input" value={form.role} onChange={(event) => update('role', event.target.value)} />
            </Field>
          </div>
          <Field label="Resumo" htmlFor="notice-summary" hint="Aparece no card e na notificação. Seja direto.">
            <input id="notice-summary" className="input" required maxLength={220} value={form.summary} onChange={(event) => update('summary', event.target.value)} />
          </Field>
          <Field label="Conteúdo completo" htmlFor="notice-content">
            <textarea id="notice-content" className="textarea" rows={6} required value={form.fullContent} onChange={(event) => update('fullContent', event.target.value)} placeholder="Orientações, horários e observações às famílias." />
          </Field>
          {!editingNotice && (
            <label htmlFor="notice-broadcast" className="flex cursor-pointer items-start gap-3 rounded-[10px] border border-line bg-surface px-4 py-3">
              <input id="notice-broadcast" type="checkbox" className="checkbox mt-0.5" checked={autoBroadcast} onChange={(event) => setAutoBroadcast(event.target.checked)} />
              <span className="text-[13px] text-ink-2">
                <span className="font-semibold text-ink">Gerar notificação interna ao publicar.</span> Os responsáveis veem o aviso no portal; não há envio por SMS, e-mail ou WhatsApp.
              </span>
            </label>
          )}
          {composerError && <Callout tone="negative" role="alert">{composerError}</Callout>}
        </form>
      </Modal>

      {/* Exclusão */}
      <Modal
        isOpen={Boolean(deleteCandidate)}
        onClose={() => !isDeleting && setDeleteCandidate(null)}
        labelledById="delete-notice-title"
        title="Excluir comunicado"
        description={deleteCandidate?.title}
        icon={Trash2}
        size="sm"
        closeDisabled={isDeleting}
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setDeleteCandidate(null)} disabled={isDeleting}>Cancelar</button>
            <button type="button" className="btn btn-danger" onClick={() => void confirmDelete()} disabled={isDeleting}>
              <Trash2 aria-hidden="true" />
              {isDeleting ? 'Excluindo…' : 'Excluir'}
            </button>
          </>
        }
      >
        <p className="text-sm text-ink-2">O comunicado deixará de aparecer nos portais. A ação fica registrada na auditoria local.</p>
      </Modal>
    </>
  );
};
