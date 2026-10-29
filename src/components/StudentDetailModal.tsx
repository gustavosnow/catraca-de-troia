import React from 'react';
import { 
  X, 
  User, 
  Phone, 
  Mail, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  MessageSquare, 
  Send, 
  ShieldCheck, 
  AlertTriangle,
  QrCode,
  CreditCard
} from 'lucide-react';
import { Student, AccessLog } from '../types';
import { useAccessibleDialog } from '../hooks/useAccessibleDialog';

interface StudentDetailModalProps {
  student: Student | null;
  logs: AccessLog[];
  isOpen: boolean;
  onClose: () => void;
}

export const StudentDetailModal: React.FC<StudentDetailModalProps> = ({
  student,
  logs,
  isOpen,
  onClose,
}) => {
  const dialogRef = useAccessibleDialog({ isOpen, onClose });

  if (!isOpen || !student) return null;

  const studentLogs = logs.filter(l => l.studentId === student.id || l.studentName === student.name);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="student-detail-title"
        tabIndex={-1}
        className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="p-6 bg-slate-900 text-white relative">
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar ficha do estudante"
            className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-start gap-4">
            <img
              src={student.avatar}
              alt={student.name}
              className="w-16 h-16 rounded-2xl object-cover ring-2 ring-orange-500/50 shadow-md"
            />
            <div>
              <div className="flex items-center gap-2">
                <h3 id="student-detail-title" className="text-lg font-bold text-white tracking-tight">{student.name}</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  {student.status}
                </span>
                {student.stage && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-500/30 text-orange-200 border border-orange-500/50">
                    {student.stage}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300 mt-1">
                Turma: <span className="text-white font-semibold">{student.turma}</span> • Turno: <span className="text-orange-400 font-semibold">{student.shift}</span>
                {student.age && <span> • Idade: <span className="text-amber-300 font-semibold">{student.age} anos</span></span>}
              </p>
              <div className="flex items-center gap-3 mt-2 text-xs text-slate-400 font-mono">
                <span>Matrícula: #{student.matricula}</span>
                <span>•</span>
                <span>Identificação: reconhecimento facial ou passagem assistida</span>
                {student.homeroomTeacher && (
                  <>
                    <span>•</span>
                    <span className="text-slate-300 font-sans">Regente: {student.homeroomTeacher}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">

          {/* Elementary School Security & Health Notice Card */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs">
              <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider block mb-1">
                Regra de Saída / Portaria
              </span>
              <p className="text-slate-700 font-medium leading-relaxed">
                {student.exitAuthorization || 'Apenas acompanhado por responsável cadastrado'}
              </p>
            </div>


          </div>
          
          {/* Guardian Info Card */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center justify-between">
              <span>Informações dos Responsáveis</span>
              <span className="text-[11px] text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-sky-600" />
                App dos Pais Conectado
              </span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Responsável Legal:</span>
                <span className="font-bold text-slate-800">{student.guardianName}</span>
              </div>

              <div>
                <span className="text-slate-400 block text-[11px]">Telefone de contato:</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="font-bold font-mono text-slate-800">{student.guardianPhone}</span>

                </div>
              </div>

              <div>
                <span className="text-slate-400 block text-[11px]">E-mail Institucional:</span>
                <span className="font-medium text-slate-700 truncate block">{student.email}</span>
              </div>

              <div>
                <span className="text-slate-400 block text-[11px]">Contato de Emergência:</span>
                <span className="font-medium font-mono text-slate-700">{student.emergencyContact}</span>
              </div>
            </div>
          </div>

          {/* Access History */}
          <div>
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center justify-between">
              <span>Histórico de Passagens Hoje</span>
              <span className="text-xs font-semibold text-slate-500 font-mono">
                {studentLogs.length} {studentLogs.length === 1 ? 'registro' : 'registros'}
              </span>
            </h4>

            {studentLogs.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-slate-100">
                Nenhum registro de acesso na sessão atual para este estudante.
              </div>
            ) : (
              <div className="space-y-2">
                {studentLogs.map((log) => (
                  <div 
                    key={log.id}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-700 font-bold font-mono text-xs">
                        {log.exactTime.slice(0, 5)}
                      </div>
                      <div>
                        <span className="font-bold text-slate-800 block">
                          {log.direction === 'entry' ? 'Entrada' : 'Saída'} Registrada ({log.turnstileName})
                        </span>
                        <span className="text-slate-400 text-[11px]">
                          Método: {log.method} • Horário exato: {log.exactTime}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                        Notificação OK
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Cadastro demonstrativo ativo nesta sessão</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
          >
            Fechar Ficha
          </button>
        </div>

      </div>
    </div>
  );
};
