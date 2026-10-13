import React, { useState } from 'react';
import { 
  KeyRound, 
  X, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  UserCheck, 
  MessageSquare,
  Sparkles
} from 'lucide-react';
import { Student, Turnstile } from '../types';
import { soundManager } from '../utils/sound';

interface ManualReleaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  turnstiles: Turnstile[];
  students: Student[];
  onConfirmRelease: (data: {
    turnstileId: string;
    studentId?: string;
    visitorName?: string;
    reason: string;
    sendWhatsapp: boolean;
  }) => void;
}

export const ManualReleaseModal: React.FC<ManualReleaseModalProps> = ({
  isOpen,
  onClose,
  turnstiles,
  students,
  onConfirmRelease,
}) => {
  const [selectedTurnstile, setSelectedTurnstile] = useState(turnstiles[0]?.id || 'cat-01');
  const [releaseType, setReleaseType] = useState<'student_no_card' | 'visitor' | 'staff' | 'emergency'>('student_no_card');
  const [selectedStudentId, setSelectedStudentId] = useState(students[0]?.id || '');
  const [visitorName, setVisitorName] = useState('');
  const [reasonNote, setReasonNote] = useState('');
  const [sendWhatsapp, setSendWhatsapp] = useState(true);
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [successAuthorized, setSuccessAuthorized] = useState(false);

  if (!isOpen) return null;

  const handleAuthorize = () => {
    setIsAuthorizing(true);
    soundManager.playManualUnlock();

    setTimeout(() => {
      setIsAuthorizing(false);
      setSuccessAuthorized(true);

      const reasonMap = {
        student_no_card: reasonNote.trim() ? reasonNote : 'Aluno sem crachá - Identificação confirmada pelo operador',
        visitor: `Visitante/Responsável: ${visitorName || 'Não informado'} - ${reasonNote || 'Atendimento escolar'}`,
        staff: `Funcionário/Docente: ${reasonNote || 'Acesso liberado'}`,
        emergency: `Liberação de Emergência: ${reasonNote || 'Protocolo de segurança'}`,
      };

      onConfirmRelease({
        turnstileId: selectedTurnstile,
        studentId: releaseType === 'student_no_card' ? selectedStudentId : undefined,
        visitorName: releaseType === 'visitor' ? visitorName : undefined,
        reason: reasonMap[releaseType],
        sendWhatsapp: releaseType === 'student_no_card' && sendWhatsapp,
      });

      setTimeout(() => {
        setSuccessAuthorized(false);
        onClose();
      }, 900);
    }, 600);
  };

  const selectedStudentObj = students.find(s => s.id === selectedStudentId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Modal Header */}
        <div className="p-5 bg-gradient-to-r from-orange-600 to-amber-500 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/20 text-white backdrop-blur-xs">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base tracking-tight text-white">
                Liberação Manual de Catraca
              </h3>
              <p className="text-orange-100 text-xs font-medium">
                Portaria & Acesso Assistido
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          
          {/* Success state animation */}
          {successAuthorized ? (
            <div className="py-8 text-center space-y-3 animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h4 className="text-lg font-extrabold text-slate-900">Catraca Destravada com Sucesso!</h4>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Solenóide acionado e registro de auditoria gravado no servidor escolar.
              </p>
            </div>
          ) : (
            <>
              {/* Select Turnstile Gate */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Selecione a Catraca a ser Liberada
                </label>
                <select
                  value={selectedTurnstile}
                  onChange={(e) => setSelectedTurnstile(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                >
                  {turnstiles.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} (Status: {t.status})
                    </option>
                  ))}
                </select>
              </div>

              {/* Release Type Radios */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Motivo da Liberação
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setReleaseType('student_no_card')}
                    className={`p-3 rounded-xl border text-left text-xs font-semibold transition-all ${
                      releaseType === 'student_no_card'
                        ? 'border-orange-500 bg-orange-50/70 text-orange-800 ring-1 ring-orange-500'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="font-bold">Aluno sem Crachá</div>
                    <div className="text-[11px] font-normal text-slate-500 mt-0.5">Identificado visualmente</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setReleaseType('visitor')}
                    className={`p-3 rounded-xl border text-left text-xs font-semibold transition-all ${
                      releaseType === 'visitor'
                        ? 'border-orange-500 bg-orange-50/70 text-orange-800 ring-1 ring-orange-500'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="font-bold">Visitante / Responsável</div>
                    <div className="text-[11px] font-normal text-slate-500 mt-0.5">Atendimento na secretaria</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setReleaseType('staff')}
                    className={`p-3 rounded-xl border text-left text-xs font-semibold transition-all ${
                      releaseType === 'staff'
                        ? 'border-orange-500 bg-orange-50/70 text-orange-800 ring-1 ring-orange-500'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="font-bold">Docente / Prestador</div>
                    <div className="text-[11px] font-normal text-slate-500 mt-0.5">Equipe pedagógica</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setReleaseType('emergency')}
                    className={`p-3 rounded-xl border text-left text-xs font-semibold transition-all ${
                      releaseType === 'emergency'
                        ? 'border-red-500 bg-red-50/70 text-red-800 ring-1 ring-red-500'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="font-bold text-red-700">Emergência</div>
                    <div className="text-[11px] font-normal text-slate-500 mt-0.5">Evasão ou socorro</div>
                  </button>
                </div>
              </div>

              {/* Conditional Input for Student Selection */}
              {releaseType === 'student_no_card' && (
                <div className="p-3.5 rounded-xl bg-orange-50/50 border border-orange-200/80 space-y-2.5">
                  <label className="block text-xs font-bold text-slate-700">
                    Selecione o Aluno
                  </label>
                  <select
                    value={selectedStudentId}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  >
                    {students.map((std) => (
                      <option key={std.id} value={std.id}>
                        {std.name} ({std.turma} - #{std.matricula})
                      </option>
                    ))}
                  </select>

                  {selectedStudentObj && (
                    <div className="flex items-center justify-between pt-1">
                      <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={sendWhatsapp}
                          onChange={(e) => setSendWhatsapp(e.target.checked)}
                          className="rounded text-orange-600 focus:ring-orange-500 w-3.5 h-3.5"
                        />
                        <span>Notificar pais via WhatsApp ({selectedStudentObj.guardianName})</span>
                      </label>
                    </div>
                  )}
                </div>
              )}

              {/* Conditional Input for Visitor */}
              {releaseType === 'visitor' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Nome Completo do Visitante & RG/CPF
                  </label>
                  <input
                    type="text"
                    value={visitorName}
                    onChange={(e) => setVisitorName(e.target.value)}
                    placeholder="Ex: Carlos Eduardo Silveira - RG 44.120.339-X"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  />
                </div>
              )}

              {/* Observation note */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Observações do Operador (Opcional)
                </label>
                <input
                  type="text"
                  value={reasonNote}
                  onChange={(e) => setReasonNote(e.target.value)}
                  placeholder="Ex: Aluno esqueceu a mochila no transporte escolar"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>

              {/* Operator Confirmation notice */}
              <div className="flex items-center gap-2 text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                <ShieldCheck className="w-4 h-4 text-orange-600 shrink-0" />
                <span>Esta ação é vinculada ao perfil de <strong>Prof. Marcos Silva</strong> com carimbo de data/hora oficial.</span>
              </div>
            </>
          )}

        </div>

        {/* Modal Footer */}
        {!successAuthorized && (
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5">
            <button
              onClick={onClose}
              disabled={isAuthorizing}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleAuthorize}
              disabled={isAuthorizing}
              className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-md shadow-orange-600/20 transition-all active:scale-95 flex items-center gap-2"
            >
              {isAuthorizing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Destravando Catraca...</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>Confirmar e Destravar</span>
                </>
              )}
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
