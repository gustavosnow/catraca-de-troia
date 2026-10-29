import React, { useState } from 'react';
import { X, CheckCircle2 } from 'lucide-react';
import { Student, Turnstile } from '../types';
import { useAccessibleDialog } from '../hooks/useAccessibleDialog';

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
  const dialogRef = useAccessibleDialog({ isOpen, onClose, closeOnEscape: !pending });
  if (!isOpen) return null;
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setPending(true); setError('');
    try {
      await onConfirmRelease({ turnstileId, studentId, reason: reason.trim(), sendWhatsapp: false });
      setSuccess(true);
    } catch (error) { setError(error instanceof Error ? error.message : 'Não foi possível registrar a passagem.'); }
    finally { setPending(false); }
  };
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4">
    <section ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="manual-release-title" tabIndex={-1} className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-xl">
      <header className="flex items-center justify-between bg-slate-900 p-5 text-white"><h3 id="manual-release-title" className="font-bold">Passagem assistida do estudante</h3><button type="button" disabled={pending} onClick={onClose} aria-label="Fechar passagem assistida"><X className="h-5 w-5" /></button></header>
      {success ? <div role="status" className="space-y-4 p-5"><CheckCircle2 className="text-emerald-600" /><p>Passagem demonstrativa registrada com operador, data, hora e motivo. Nenhuma catraca física foi acionada.</p><button type="button" onClick={onClose} className="rounded-xl bg-orange-600 px-4 py-2 font-bold text-white">Concluir</button></div> : <form onSubmit={submit} className="space-y-4 p-5 text-sm text-slate-800">
        <p>Procedimento alternativo para aluno identificado pela portaria. O piloto não gerencia acesso de visitantes ou funcionários.</p>
        <label className="block font-bold">Catraca<select required value={turnstileId} onChange={event => setTurnstileId(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 p-2">{turnstiles.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        <label className="block font-bold">Estudante<select required value={studentId} onChange={event => setStudentId(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 p-2">{students.map(item => <option key={item.id} value={item.id}>{item.name} — {item.matricula}</option>)}</select></label>
        <label className="block font-bold">Motivo<textarea required minLength={5} maxLength={500} value={reason} onChange={event => setReason(event.target.value)} placeholder="Descreva o motivo da passagem assistida." className="mt-1 w-full rounded-lg border border-slate-300 p-2" /></label>
        <p className="text-xs text-slate-500">O registro é atribuído à conta escolar autenticada. A notificação interna segue os vínculos autorizados; não há envio por WhatsApp.</p>
        {error && <p role="alert" className="text-rose-700">{error}</p>}
        <button disabled={pending || !students.length || !turnstiles.length || reason.trim().length < 5} className="rounded-xl bg-orange-600 px-4 py-2 font-bold text-white disabled:opacity-50">{pending ? 'Registrando…' : 'Registrar passagem demonstrativa'}</button>
      </form>}
    </section>
  </div>;
};
