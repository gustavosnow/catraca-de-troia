import React, { useState } from 'react';
import { 
  X, 
  Send, 
  FileText, 
  Upload, 
  Calendar, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Paperclip,
  Trash2,
  FileCheck,
  ShieldAlert
} from 'lucide-react';
import { Student, AbsenceJustification } from '../../types';

interface AbsenceJustificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student;
  existingJustifications: AbsenceJustification[];
  onSubmitJustification: (justification: Omit<AbsenceJustification, 'id' | 'submittedAt' | 'status'>) => void;
}

export const AbsenceJustificationModal: React.FC<AbsenceJustificationModalProps> = ({
  isOpen,
  onClose,
  student,
  existingJustifications,
  onSubmitJustification,
}) => {
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [reasonCategory, setReasonCategory] = useState<AbsenceJustification['reasonCategory']>('Médico / Saúde');
  const [description, setDescription] = useState<string>('');
  const [attachedFile, setAttachedFile] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'nova' | 'historico'>('nova');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    setIsSubmitting(true);
    setTimeout(() => {
      onSubmitJustification({
        studentId: student.id,
        studentName: student.name,
        date,
        reasonCategory,
        description,
        attachmentName: attachedFile || undefined,
      });
      setIsSubmitting(false);
      setSuccessMessage(true);
      setTimeout(() => {
        setSuccessMessage(false);
        setDescription('');
        setAttachedFile(null);
        setActiveTab('historico');
      }, 1500);
    }, 600);
  };

  const handleSimulateFileUpload = () => {
    setAttachedFile(`atestado_medico_${date.replace(/-/g, '')}.pdf`);
  };

  return (
    <div className="absolute inset-0 z-40 flex items-end sm:items-center justify-center bg-slate-950/80 backdrop-blur-xs animate-in fade-in">
      <div 
        className="bg-white w-full h-full sm:h-auto sm:max-w-lg sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-full sm:max-h-[90vh] animate-in slide-in-from-bottom duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-500/40 text-blue-400 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white leading-tight">
                Notificação de Ausência
              </h2>
              <p className="text-xs text-slate-400">
                Justificativa para a Coordenação Pedagógica
              </p>
            </div>
          </div>

          <button
            id="btn-close-absence-modal"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-4 pt-2 gap-2 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('nova')}
            className={`pb-2.5 px-3 border-b-2 transition-colors ${
              activeTab === 'nova'
                ? 'border-blue-600 text-blue-700 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Nova Justificativa
          </button>
          <button
            onClick={() => setActiveTab('historico')}
            className={`pb-2.5 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'historico'
                ? 'border-blue-600 text-blue-700 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>Histórico de Envios</span>
            <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 text-[10px] flex items-center justify-center font-bold">
              {existingJustifications.length}
            </span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {successMessage ? (
            <div className="p-6 text-center space-y-3 bg-emerald-50 rounded-2xl border border-emerald-200 animate-in zoom-in-95">
              <div className="w-14 h-14 bg-emerald-600 text-white rounded-full flex items-center justify-center mx-auto shadow-md">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-emerald-950">
                Justificativa Enviada com Sucesso!
              </h3>
              <p className="text-xs text-emerald-800 max-w-sm mx-auto leading-relaxed">
                A secretaria escolar e a coordenação disciplinar já foram notificadas no painel administrativo para análise do documento.
              </p>
            </div>
          ) : activeTab === 'nova' ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Student info preview */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                <img
                  src={student.avatar}
                  alt={student.name}
                  className="w-10 h-10 rounded-lg object-cover ring-1 ring-slate-300"
                  referrerPolicy="no-referrer"
                />
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900 truncate">
                    {student.name}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {student.turma} • Matrícula {student.matricula}
                  </div>
                </div>
              </div>

              {/* Date & Reason Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-blue-600" /> Data da Ausência
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    className="w-full text-xs font-medium px-3 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 text-blue-600" /> Motivo Principal
                  </label>
                  <select
                    value={reasonCategory}
                    onChange={(e) => setReasonCategory(e.target.value as any)}
                    className="w-full text-xs font-medium px-3 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-white"
                  >
                    <option value="Médico / Saúde">Médico / Saúde (Doença/Sintomas)</option>
                    <option value="Consulta Odontológica">Consulta Odontológica</option>
                    <option value="Compromisso Familiar">Compromisso Familiar Inadiável</option>
                    <option value="Motivo de Força Maior">Força Maior / Transporte</option>
                    <option value="Outro">Outro Motivo</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Descrição detalhada da justificativa
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  placeholder="Ex: Ana Clara teve febre durante a noite e passará por consulta pediátrica às 10h. Segue atestado anexo."
                  className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-white placeholder:text-slate-400"
                />
              </div>

              {/* Simulated File Upload */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                  <span>Anexar Comprovante / Atestado (Opcional)</span>
                  <span className="text-[10px] text-slate-500 font-normal">PDF, JPG ou PNG</span>
                </label>

                {attachedFile ? (
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-blue-50 border border-blue-200">
                    <div className="flex items-center gap-2 text-xs font-medium text-blue-900 truncate">
                      <Paperclip className="w-4 h-4 text-blue-600 shrink-0" />
                      <span className="truncate">{attachedFile}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAttachedFile(null)}
                      className="p-1 rounded-lg text-slate-400 hover:text-red-600 transition-colors"
                      title="Remover anexo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={handleSimulateFileUpload}
                    className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl p-4 text-center cursor-pointer transition-colors bg-slate-50/60 hover:bg-blue-50/30"
                  >
                    <Upload className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                    <div className="text-xs font-bold text-slate-700">
                      Clique para simular anexo de Atestado
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Envie a foto ou documento emitido pelo médico
                    </p>
                  </div>
                )}
              </div>

              {/* Disclaimer */}
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  O envio da justificativa cancela os alertas automáticos de falta na catraca e registra protocolo formal para abono de avaliações.
                </span>
              </div>

              {/* Submit button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting || !description.trim()}
                  className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-98 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Enviando para a Coordenação...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Transmitir Justificativa à Escola</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            /* History of justifications */
            <div className="space-y-3">
              {existingJustifications.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  Nenhuma justificativa enviada anteriormente.
                </div>
              ) : (
                existingJustifications.map((just) => (
                  <div
                    key={just.id}
                    className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-xs font-bold text-slate-900">
                          {just.reasonCategory}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>Data: {just.date}</span>
                          <span>•</span>
                          <span>Envio: {just.submittedAt}</span>
                        </div>
                      </div>

                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 inline-flex items-center gap-1">
                        <FileCheck className="w-3 h-3 text-emerald-600" />
                        {just.status}
                      </span>
                    </div>

                    <p className="text-xs text-slate-700 bg-white p-2 rounded-lg border border-slate-200/80">
                      {just.description}
                    </p>

                    {just.attachmentName && (
                      <div className="flex items-center gap-1.5 text-[11px] text-blue-700 font-medium">
                        <Paperclip className="w-3.5 h-3.5" />
                        <span>Documento: {just.attachmentName}</span>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
