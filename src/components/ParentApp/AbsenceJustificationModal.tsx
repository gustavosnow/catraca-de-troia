import React, { useState } from 'react';
import { CheckCircle2, Send, ShieldAlert, X } from 'lucide-react';
import type { AbsenceJustification, Student } from '../../types';
import { useAccessibleDialog } from '../../hooks/useAccessibleDialog';
import { formatIsoDate, JustificationStatusChip } from '../JustificationsManager';
import { Avatar, Field, Callout, cx } from '../ui';

interface AbsenceJustificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student;
  existingJustifications: AbsenceJustification[];
  onSubmitJustification: (
    justification: Omit<AbsenceJustification, 'id' | 'submittedAt' | 'status'>,
  ) => Promise<void>;
  compact?: boolean;
  initialTab?: 'nova' | 'historico';
}

export const AbsenceJustificationModal: React.FC<AbsenceJustificationModalProps> = ({
  isOpen,
  onClose,
  student,
  existingJustifications,
  onSubmitJustification,
  compact = false,
  initialTab = 'nova',
}) => {
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [reasonCategory, setReasonCategory] = useState<AbsenceJustification['reasonCategory']>('Motivo de Força Maior');
  const [description, setDescription] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'nova' | 'historico'>(initialTab);
  const [submitError, setSubmitError] = useState<string>();
  const dialogRef = useAccessibleDialog({ isOpen, onClose, closeOnEscape: !isSubmitting });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    setIsSubmitting(true);
    setSubmitError(undefined);
    try {
      await onSubmitJustification({
        studentId: student.id,
        studentName: student.name,
        date,
        reasonCategory,
        description,
      });
      setSuccessMessage(true);
      setTimeout(() => {
        setSuccessMessage(false);
        setDescription('');
        setActiveTab('historico');
      }, 1500);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Não foi possível enviar a justificativa.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={cx('overlay flex justify-center', compact ? 'items-stretch' : 'items-center p-6')}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="absence-modal-title"
        tabIndex={-1}
        className={cx(
          'dialog-panel flex min-h-0 w-full flex-col overflow-hidden bg-white shadow-[var(--shadow-pop)]',
          compact ? 'h-full' : 'max-h-[min(90vh,48rem)] max-w-lg rounded-2xl',
        )}
        style={compact ? { paddingTop: 'env(safe-area-inset-top, 0px)' } : undefined}
      >
        <header className="flex items-start gap-3 px-6 pt-5">
          <div className="min-w-0 flex-1">
            <h2 id="absence-modal-title" className="text-[17px] font-semibold tracking-tight text-ink">Justificar ausência</h2>
            <p className="mt-1 text-[13px] text-muted">Analisada pela Coordenação ou pela Direção.</p>
          </div>
          <button type="button" id="btn-close-absence-modal" className="icon-btn -mr-2 -mt-1" onClick={onClose} disabled={isSubmitting} aria-label="Fechar">
            <X />
          </button>
        </header>

        <div role="tablist" aria-label="Seções da justificativa" className="tabs mt-4 px-6">
          <button type="button" role="tab" aria-selected={activeTab === 'nova'} className="tab" onClick={() => setActiveTab('nova')}>Nova justificativa</button>
          <button type="button" role="tab" aria-selected={activeTab === 'historico'} className="tab inline-flex items-center gap-2" onClick={() => setActiveTab('historico')}>
            Enviadas <span className={cx('count-badge', activeTab === 'historico' && 'count-badge-brand')}>{existingJustifications.length}</span>
          </button>
        </div>

        <div data-testid="absence-modal-scroll-region" className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-5">
          {successMessage ? (
            <div role="status" className="flex flex-col items-center py-10 text-center">
              <span className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-positive-soft text-positive">
                <CheckCircle2 aria-hidden="true" className="h-6 w-6" />
              </span>
              <p className="text-[15px] font-semibold text-ink">Justificativa enviada</p>
              <p className="mt-1 max-w-xs text-[13px] text-muted">Ela já aparece no painel da escola para análise da Coordenação ou da Direção.</p>
            </div>
          ) : activeTab === 'nova' ? (
            <form id="absence-form" onSubmit={handleSubmit} className="space-y-5">
              {submitError && <Callout tone="negative" role="alert">{submitError}</Callout>}
              <div className="flex items-center gap-3 rounded-[10px] border border-line bg-surface px-4 py-3">
                <Avatar name={student.name} />
                <div className="min-w-0">
                  <p className="text-sm font-semibold leading-snug text-ink">{student.name}</p>
                  <p className="tabular text-xs text-muted">{student.turma.split(' - ')[0]} · Matrícula {student.matricula}</p>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Data da ausência" htmlFor="absence-date">
                  <input id="absence-date" type="date" className="input" value={date} onChange={(event) => setDate(event.target.value)} required />
                </Field>
                <Field label="Motivo" htmlFor="absence-reason">
                  <select id="absence-reason" className="select" value={reasonCategory} onChange={(event) => setReasonCategory(event.target.value as AbsenceJustification['reasonCategory'])}>
                    <option value="Médico / Saúde">Médico ou saúde</option>
                    <option value="Consulta Odontológica">Consulta odontológica</option>
                    <option value="Compromisso Familiar">Compromisso familiar</option>
                    <option value="Motivo de Força Maior">Força maior ou transporte</option>
                    <option value="Outro">Outro motivo</option>
                  </select>
                </Field>
              </div>
              <Field label="Descrição" htmlFor="absence-description" hint={`${description.trim().length} caracteres`}>
                <textarea
                  id="absence-description"
                  className="textarea"
                  rows={4}
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  required
                  placeholder="Ex.: houve um problema no transporte e o estudante não pôde comparecer."
                />
              </Field>
              <Callout tone="neutral" icon={ShieldAlert}>
                Informe apenas o necessário para comunicar a ausência. Não inclua diagnóstico ou detalhes de saúde. Este piloto não recebe arquivos nem atestados.
              </Callout>
            </form>
          ) : existingJustifications.length === 0 ? (
            <p className="rounded-[10px] bg-surface px-4 py-8 text-center text-[13px] text-muted">Nenhuma justificativa enviada.</p>
          ) : (
            <ul className="space-y-3">
              {existingJustifications.map((item) => (
                <li key={item.id} className="rounded-[10px] border border-line p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-ink">{item.reasonCategory}</p>
                      <p className="tabular mt-0.5 text-xs text-muted">{item.studentName.split(' ')[0]} · ausência em {formatIsoDate(item.date)} · enviada {item.submittedAt}</p>
                    </div>
                    <JustificationStatusChip status={item.status} />
                  </div>
                  <p className="mt-2 text-[13px] leading-relaxed text-ink-2">{item.description}</p>
                </li>
              ))}
            </ul>
          )}
        </div>

        {activeTab === 'nova' && !successMessage && (
          <footer className="flex flex-wrap justify-end gap-2 border-t border-line bg-surface px-6 py-4" style={compact ? { paddingBottom: 'max(1rem, env(safe-area-inset-bottom, 0px))' } : undefined}>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isSubmitting}>Cancelar</button>
            <button type="submit" form="absence-form" className="btn btn-primary" disabled={isSubmitting || !description.trim()}>
              <Send aria-hidden="true" />
              {isSubmitting ? 'Enviando…' : 'Enviar à escola'}
            </button>
          </footer>
        )}
      </div>
    </div>
  );
};
