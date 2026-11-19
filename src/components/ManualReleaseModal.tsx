import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Hand } from 'lucide-react';
import type { AccessDirection, AccessLog, Student, Turnstile } from '../types';
import { getStudentAccessLogs, getTurnstileDirections, isToday, turnstileDirectionLabel } from '../services/accessHistory';
import { Callout, Field, Modal } from './ui';

interface ManualReleaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  turnstiles: Turnstile[];
  students: Student[];
  /** Passagens carregadas, para sugerir a próxima direção de cada estudante. */
  logs: AccessLog[];
  onConfirmRelease: (data: {
    turnstileId: string;
    studentId: string;
    direction: AccessDirection;
    reason: string;
  }) => Promise<void>;
}

const DIRECTION_LABEL: Record<AccessDirection, string> = { entry: 'Entrada', exit: 'Saída' };

export const ManualReleaseModal: React.FC<ManualReleaseModalProps> = ({
  isOpen,
  onClose,
  turnstiles,
  students,
  logs,
  onConfirmRelease,
}) => {
  const [turnstileId, setTurnstileId] = useState('');
  const [studentId, setStudentId] = useState('');
  const [direction, setDirection] = useState<AccessDirection>('entry');
  const [reason, setReason] = useState('');
  const [pending, setPending] = useState(false);
  const [success, setSuccess] = useState<string>();
  const [error, setError] = useState('');

  // Última passagem de hoje do estudante escolhido; a próxima é sempre a oposta.
  const lastToday = useMemo(() => (studentId
    ? getStudentAccessLogs(logs, studentId).filter((log) => isToday(log.timestamp)).at(-1)
    : undefined), [logs, studentId]);
  const expectedDirection: AccessDirection = lastToday?.direction === 'entry' ? 'exit' : 'entry';

  // Limpa o formulário só ao abrir: as listas são reconsultadas periodicamente
  // e não podem apagar o motivo digitado nem a confirmação de sucesso.
  useEffect(() => {
    if (!isOpen) return;
    setReason('');
    setSuccess(undefined);
    setError('');
  }, [isOpen]);

  // Catracas e estudantes chegam da API depois da montagem: mantém a escolha
  // atual enquanto ela existir e prioriza a catraca compatível com o sentido.
  const turnstileForDirection = (target: AccessDirection) =>
    turnstiles.find((item) => {
      const dirs = getTurnstileDirections(item);
      return dirs.length === 0 || dirs.includes(target);
    });

  useEffect(() => {
    setTurnstileId((current) => {
      if (turnstiles.some((item) => item.id === current)) return current;
      return (turnstileForDirection(direction) ?? turnstiles[0])?.id ?? '';
    });
  }, [turnstiles]);
  useEffect(() => {
    setStudentId((current) => (students.some((item) => item.id === current) ? current : students[0]?.id ?? ''));
  }, [students]);

  const selectDirection = (next: AccessDirection) => {
    setDirection(next);
    setTurnstileId((current) => {
      const selected = turnstiles.find((item) => item.id === current);
      const dirs = selected ? getTurnstileDirections(selected) : [];
      if (dirs.length === 0 || dirs.includes(next)) return current;
      return turnstileForDirection(next)?.id ?? current;
    });
  };

  useEffect(() => selectDirection(expectedDirection), [expectedDirection, studentId]);

  const selectedTurnstile = turnstiles.find((item) => item.id === turnstileId);
  const allowedDirections = selectedTurnstile ? getTurnstileDirections(selectedTurnstile) : [];
  const directionSupported = allowedDirections.length === 0 || allowedDirections.includes(direction);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!directionSupported) return;
    setPending(true);
    setError('');
    try {
      await onConfirmRelease({ turnstileId, studentId, direction, reason: reason.trim() });
      const student = students.find((item) => item.id === studentId);
      setSuccess(`${DIRECTION_LABEL[direction]} de ${student?.name ?? 'estudante'} registrada.`);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Não foi possível registrar a passagem.');
    } finally {
      setPending(false);
    }
  };

  const canSubmit = !pending && Boolean(studentId) && Boolean(turnstileId) && directionSupported && reason.trim().length >= 5;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      labelledById="manual-release-title"
      title="Passagem assistida"
      description="Registro de entrada ou saída feito pela equipe quando a câmera não identifica o estudante."
      icon={Hand}
      closeDisabled={pending}
      footer={success ? (
        <button type="button" className="btn btn-primary" onClick={onClose}>Concluir</button>
      ) : (
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={pending}>Cancelar</button>
          <button type="submit" form="manual-release-form" className="btn btn-primary" disabled={!canSubmit}>
            {pending ? 'Registrando…' : `Registrar ${DIRECTION_LABEL[direction].toLowerCase()}`}
          </button>
        </>
      )}
    >
      {success ? (
        <div role="status" className="flex flex-col items-center py-6 text-center">
          <span className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-positive-soft text-positive">
            <CheckCircle2 aria-hidden="true" className="h-6 w-6" />
          </span>
          <p className="text-[15px] font-semibold text-ink">{success}</p>
          <p className="mt-1 max-w-sm text-[13px] text-muted">
            O registro guarda operador, data, hora e motivo, e avisa os responsáveis vinculados.
            Nenhuma catraca física é acionada pelo sistema.
          </p>
        </div>
      ) : turnstiles.length === 0 || students.length === 0 ? (
        <Callout tone="warning" role="alert">
          {turnstiles.length === 0
            ? 'Nenhuma catraca cadastrada. Registre as câmeras com npm run device:register.'
            : 'Nenhum estudante cadastrado.'}
        </Callout>
      ) : (
        <form id="manual-release-form" onSubmit={submit} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Estudante" htmlFor="manual-release-student">
              <select id="manual-release-student" required className="select" value={studentId} onChange={(event) => setStudentId(event.target.value)}>
                {students.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.matricula}</option>)}
              </select>
            </Field>
            <Field label="Catraca" htmlFor="manual-release-turnstile">
              <select id="manual-release-turnstile" required className="select" value={turnstileId} onChange={(event) => setTurnstileId(event.target.value)}>
                {turnstiles.map((item) => {
                  const roleLabel = turnstileDirectionLabel(item);
                  return (
                    <option key={item.id} value={item.id}>
                      {item.name}{roleLabel ? ` · ${roleLabel}` : ''}
                    </option>
                  );
                })}
              </select>
            </Field>
          </div>

          <fieldset>
            <legend className="field-label">Movimento</legend>
            <div className="segmented w-full" role="group" aria-label="Movimento">
              {(['entry', 'exit'] as const).map((item) => (
                <button key={item} type="button" className="flex-1" aria-pressed={direction === item} onClick={() => selectDirection(item)}>
                  {DIRECTION_LABEL[item]}
                </button>
              ))}
            </div>
            <p className="field-hint">
              {lastToday
                ? `Última passagem hoje: ${DIRECTION_LABEL[lastToday.direction].toLowerCase()} às ${lastToday.exactTime.slice(0, 5)}. A próxima deve ser ${DIRECTION_LABEL[expectedDirection].toLowerCase()}.`
                : 'Sem passagem hoje: a primeira deve ser uma entrada.'}
            </p>
            {!directionSupported && (
              <p className="field-error" role="alert">
                {selectedTurnstile?.name ?? 'Esta catraca'} registra {turnstileDirectionLabel(selectedTurnstile!)?.toLowerCase()}. Selecione a catraca correspondente ao sentido.
              </p>
            )}
            {direction !== expectedDirection && (
              <p className="field-error" role="alert">
                Fora da sequência do dia: o servidor vai recusar. Registre antes a {DIRECTION_LABEL[expectedDirection].toLowerCase()}.
              </p>
            )}
          </fieldset>

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
              placeholder="Ex.: câmera não reconheceu o estudante; identidade conferida pela portaria."
            />
          </Field>
          <Callout tone="neutral">
            O registro fica no nome da conta autenticada. Só os responsáveis com vínculo aprovado recebem a notificação interna.
          </Callout>
          {error && <Callout tone="negative" role="alert">{error}</Callout>}
        </form>
      )}
    </Modal>
  );
};
