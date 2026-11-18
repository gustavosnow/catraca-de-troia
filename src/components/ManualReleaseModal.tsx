import React, { useEffect, useState } from 'react';
import { CheckCircle2, Hand } from 'lucide-react';
import type { Student, Turnstile } from '../types';
import { Callout, Field, Modal } from './ui';

interface ManualReleaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  turnstiles: Turnstile[];
  students: Student[];
  onConfirmRelease: (data: { turnstileId: string; studentId: string; reason: string; sendWhatsapp: boolean }) => Promise<void>;
}

export const ManualReleaseModal: React.FC<ManualReleaseModalProps> = ({ isOpen, onClose, turnstiles, students, onConfirmRelease }) => {
  const [turnstileId, setTurnstileId] = useState(turnstiles[0]?.id || '');
  const [studentId, setStudentId] = useState(students[0]?.id || '');
  const [reason, setReason] = useState('');
  const [pending, setPending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setReason('');
    setSuccess(false);
    setError('');
  }, [isOpen]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setPending(true);
    setError('');
    try {
      await onConfirmRelease({ turnstileId, studentId, reason: reason.trim(), sendWhatsapp: false });
      setSuccess(true);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Não foi possível registrar a passagem.');
    } finally {
      setPending(false);
    }
  };

  const canSubmit = !pending && students.length > 0 && turnstiles.length > 0 && reason.trim().length >= 5;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      labelledById="manual-release-title"
      title="Passagem assistida"
      description="Procedimento alternativo para estudante identificado pela portaria."
      icon={Hand}
      closeDisabled={pending}
      footer={success ? (
        <button type="button" className="btn btn-primary" onClick={onClose}>Concluir</button>
      ) : (
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={pending}>Cancelar</button>
          <button type="submit" form="manual-release-form" className="btn btn-primary" disabled={!canSubmit}>
            {pending ? 'Registrando…' : 'Registrar passagem'}
          </button>
        </>
      )}
    >
      {success ? (
        <div role="status" className="flex flex-col items-center py-6 text-center">
          <span className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-positive-soft text-positive">
            <CheckCircle2 aria-hidden="true" className="h-6 w-6" />
          </span>
          <p className="text-[15px] font-semibold text-ink">Passagem registrada</p>
          <p className="mt-1 max-w-sm text-[13px] text-muted">
            O registro demonstrativo guarda operador, data, hora e motivo. Nenhuma catraca física foi acionada.
          </p>
        </div>
      ) : (
        <form id="manual-release-form" onSubmit={submit} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Catraca" htmlFor="manual-release-turnstile">
              <select id="manual-release-turnstile" required className="select" value={turnstileId} onChange={(event) => setTurnstileId(event.target.value)}>
                {turnstiles.map((item) => <option key={item.id} value={item.id}>{item.name.split(' - ')[0]}</option>)}
              </select>
            </Field>
            <Field label="Estudante" htmlFor="manual-release-student">
              <select id="manual-release-student" required className="select" value={studentId} onChange={(event) => setStudentId(event.target.value)}>
                {students.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.matricula}</option>)}
              </select>
            </Field>
          </div>
          <Field
            label="Motivo obrigatório"
            htmlFor="manual-release-reason"
            hint={`Informe ao menos 5 caracteres. ${reason.trim().length}/500`}
          >
            <textarea
              id="manual-release-reason"
              required
              minLength={5}
              maxLength={500}
              className="textarea"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Descreva por que a passagem precisou ser assistida."
            />
          </Field>
          <Callout tone="neutral">
            O registro é atribuído à conta escolar autenticada. A notificação interna segue apenas os vínculos autorizados; o piloto não gerencia visitantes nem funcionários.
          </Callout>
          {error && <Callout tone="negative" role="alert">{error}</Callout>}
        </form>
      )}
    </Modal>
  );
};
