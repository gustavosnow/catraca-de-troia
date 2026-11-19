import React from 'react';
import { DoorOpen, LogIn, LogOut } from 'lucide-react';
import type { AccessLog, Student } from '../types';
import { Avatar, Chip, DefinitionList, Drawer, withoutRelation } from './ui';
import { MethodChip, splitTurnstile } from './school/AccessLogTable';

interface StudentDetailModalProps {
  student: Student | null;
  logs: AccessLog[];
  isOpen: boolean;
  onClose: () => void;
}

/** Ficha do estudante em painel lateral; em telas pequenas ocupa a largura toda. */
export const StudentDetailModal: React.FC<StudentDetailModalProps> = ({ student, logs, isOpen, onClose }) => {
  if (!student) return null;
  const studentLogs = logs.filter((log) => log.studentId === student.id || log.studentName === student.name);

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      labelledById="student-detail-title"
      title="Ficha do estudante"
      description="Consulta cadastral"
      widthClassName="max-w-[480px]"
      footer={<button type="button" className="btn btn-secondary w-full" onClick={onClose}>Fechar ficha</button>}
    >
      <div className="px-5 py-6">
        <div className="flex items-center gap-4">
          <Avatar name={student.name} size="lg" />
          <div className="min-w-0">
            <h3 id="student-detail-name" className="text-lg font-semibold tracking-tight text-ink">{student.name}</h3>
            <p className="tabular text-[13px] text-muted">Matrícula {student.matricula}</p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Chip tone={student.status === 'Ativo' ? 'positive' : 'warning'}>{student.status}</Chip>
          {student.stage && <Chip>{student.stage}</Chip>}
          <Chip>{student.shift}</Chip>
        </div>
      </div>

      <section className="border-t border-line px-5 py-5" aria-labelledby="student-school-data">
        <h4 id="student-school-data" className="eyebrow-muted mb-4">Dados escolares</h4>
        <DefinitionList
          items={[
            ['Turma', student.turma],
            ['Turno', student.shift],
            ['Professora regente', student.homeroomTeacher ?? '—'],
            ['Idade', student.age ? `${student.age} anos` : '—'],
          ]}
        />
        <div className="mt-5 rounded-[10px] border border-line bg-surface px-4 py-3">
          <p className="flex items-center gap-2 text-xs font-medium text-muted">
            <DoorOpen aria-hidden="true" className="h-4 w-4" />
            Regra de saída
          </p>
          <p className="mt-1 text-[13px] font-medium text-ink">{student.exitAuthorization || 'Apenas com responsável cadastrado'}</p>
        </div>
      </section>

      <section className="border-t border-line px-5 py-5" aria-labelledby="student-guardian-data">
        <h4 id="student-guardian-data" className="eyebrow-muted mb-4">Responsável</h4>
        <DefinitionList
          items={[
            ['Nome', withoutRelation(student.guardianName)],
            ['Parentesco', student.guardianRelation],
            ['Telefone', <span className="tabular">{student.guardianPhone}</span>],
            ['Contato de emergência', <span className="tabular">{student.emergencyContact}</span>],
          ]}
        />
        <p className="mt-4 text-xs text-muted">O acesso ao portal depende de vínculo validado pela escola.</p>
      </section>

      <section className="border-t border-line px-5 py-5" aria-labelledby="student-access-history">
        <div className="mb-4 flex items-baseline justify-between">
          <h4 id="student-access-history" className="eyebrow-muted">Passagens registradas</h4>
          <span className="tabular text-xs text-muted">{studentLogs.length} {studentLogs.length === 1 ? 'registro' : 'registros'}</span>
        </div>
        {studentLogs.length === 0 ? (
          <p className="rounded-[10px] bg-surface px-4 py-6 text-center text-[13px] text-muted">
            Nenhuma passagem registrada para este estudante.
          </p>
        ) : (
          <ol className="relative space-y-4 before:absolute before:bottom-2 before:left-[15px] before:top-2 before:w-px before:bg-line">
            {studentLogs.map((log) => {
              const turnstile = splitTurnstile(log.turnstileName);
              const Icon = log.direction === 'entry' ? LogIn : LogOut;
              return (
                <li key={log.id} className="relative flex gap-3">
                  <span className={`relative z-10 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full ring-4 ring-white ${log.direction === 'entry' ? 'bg-positive-soft text-positive' : 'bg-surface-2 text-ink-2'}`}>
                    <Icon aria-hidden="true" className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="text-[13px] font-semibold text-ink">{log.direction === 'entry' ? 'Entrada registrada' : 'Saída registrada'}</p>
                      <span className="tabular text-[13px] font-medium text-ink">{log.exactTime.slice(0, 5)}</span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted">
                      <span>Catraca {turnstile.code} · {turnstile.place}</span>
                      <MethodChip log={log} />
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </section>
    </Drawer>
  );
};
