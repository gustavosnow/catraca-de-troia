import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  Send, 
  MessageSquare, 
  Phone, 
  ShieldCheck, 
  Clock, 
  QrCode, 
  CreditCard, 
  AlertTriangle, 
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  UserCheck
} from 'lucide-react';
import { Student, Shift } from '../types';
import { TURMAS_LIST } from '../data/mockData';

interface StudentsManagementListProps {
  students: Student[];
  onSelectStudent: (studentId: string) => void;
  onSendWhatsappDirect: (phone: string, studentName: string, templateType?: string) => void;
}

export const StudentsManagementList: React.FC<StudentsManagementListProps> = ({
  students,
  onSelectStudent,
  onSendWhatsappDirect,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTurma, setSelectedTurma] = useState<string>('Todas');
  const [selectedStage, setSelectedStage] = useState<'Todos' | 'Fundamental I' | 'Fundamental II'>('Todos');
  const [selectedShift, setSelectedShift] = useState<Shift>('Todos');
  const [statusFilter, setStatusFilter] = useState<'Todos' | 'Ativo' | 'Suspenso'>('Todos');
  const [whatsappTemplateStudent, setWhatsappTemplateStudent] = useState<Student | null>(null);

  const filtered = students.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.matricula.includes(searchTerm) ||
      s.guardianName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.guardianPhone.includes(searchTerm) ||
      (s.homeroomTeacher && s.homeroomTeacher.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesTurma = selectedTurma === 'Todas' || s.turma === selectedTurma;
    const matchesStage = selectedStage === 'Todos' || s.stage === selectedStage;
    const matchesShift = selectedShift === 'Todos' || s.shift === selectedShift;
    const matchesStatus = statusFilter === 'Todos' || s.status === statusFilter;

    return matchesSearch && matchesTurma && matchesStage && matchesShift && matchesStatus;
  });

  const handleOpenWhatsappWithTemplate = (student: Student, type: string) => {
    onSendWhatsappDirect(student.guardianPhone, student.name, type);
    setWhatsappTemplateStudent(null);
  };

  return (
    <div className="space-y-5">
      
      {/* Header & Filter Controls Toolbar */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Diretório de Estudantes
            </h3>
          </div>

          <span className="text-xs font-semibold text-slate-500">
            {filtered.length} de {students.length} estudantes
          </span>
        </div>

        {/* Filter controls */}
        <div className="pt-2 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-3">
          
          {/* Search box */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nome, matrícula ou responsável..."
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium text-slate-800"
            />
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            <select
              value={selectedStage}
              onChange={(e) => setSelectedStage(e.target.value as any)}
              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-orange-50 border border-orange-200 text-orange-800 focus:outline-none"
            >
              <option value="Todos">Todos os Ciclos</option>
              <option value="Fundamental I">Fund. I (1º ao 5º)</option>
              <option value="Fundamental II">Fund. II (6º ao 9º)</option>
            </select>

            <select
              value={selectedTurma}
              onChange={(e) => setSelectedTurma(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-50 border border-slate-200 text-slate-700 focus:outline-none"
            >
              {TURMAS_LIST.map(t => (
                <option key={t} value={t}>{t === 'Todas' ? 'Todas as Turmas' : t}</option>
              ))}
            </select>

            <select
              value={selectedShift}
              onChange={(e) => setSelectedShift(e.target.value as Shift)}
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-50 border border-slate-200 text-slate-700 focus:outline-none"
            >
              <option value="Todos">Todos os Turnos</option>
              <option value="Manhã">Manhã</option>
              <option value="Tarde">Tarde</option>
              <option value="Integral">Integral</option>
            </select>
          </div>

        </div>
      </div>

      {/* Students Table / Grid */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/90 text-slate-500 font-semibold uppercase tracking-wider text-[11px] border-b border-slate-200/80">
              <tr>
                <th className="py-3 px-4">Estudante & Matrícula</th>
                <th className="py-3 px-3">Ciclo & Turma</th>
                <th className="py-3 px-3">Crachá RFID / Biometria</th>
                <th className="py-3 px-3">Responsável Legal</th>
                <th className="py-3 px-3">Telefone Cadastrado</th>
                <th className="py-3 px-4 text-center">Contato WhatsApp</th>
                <th className="py-3 px-3 text-center">Ficha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((student) => (
                <tr key={student.id} className="hover:bg-slate-50/80 transition-colors group">
                  
                  {/* Student Name and Photo */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={student.avatar}
                        alt={student.name}
                        className="w-10 h-10 rounded-full object-cover ring-2 ring-slate-100 group-hover:ring-orange-300 transition-all shadow-xs"
                      />
                      <div>
                        <button
                          onClick={() => onSelectStudent(student.id)}
                          className="font-bold text-slate-900 hover:text-orange-600 text-sm transition-colors text-left flex items-center gap-1.5"
                        >
                          <span>{student.name}</span>
                          {student.age && (
                            <span className="text-[11px] font-normal text-slate-400">
                              ({student.age} anos)
                            </span>
                          )}
                        </button>
                        <div className="text-[11px] text-slate-500 font-mono">
                          Matrícula: #{student.matricula}
                          {student.homeroomTeacher && (
                            <span className="font-sans text-slate-400 ml-1.5">• Regente: {student.homeroomTeacher}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Turma and Stage */}
                  <td className="py-3.5 px-3 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-800">{student.turma}</span>
                      {student.stage && (
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          student.stage === 'Fundamental I'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-sky-100 text-sky-800'
                        }`}>
                          {student.stage === 'Fundamental I' ? 'Fund. I' : 'Fund. II'}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 font-semibold">{student.shift}</div>
                  </td>

                  {/* RFID Badge */}
                  <td className="py-3.5 px-3 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
                      <CreditCard className="w-3 h-3 text-slate-500" />
                      {student.rfidCard}
                    </span>
                  </td>

                  {/* Guardian Name */}
                  <td className="py-3.5 px-3 whitespace-nowrap">
                    <div className="font-semibold text-slate-800">{student.guardianName}</div>
                    <div className="text-[11px] text-slate-400">{student.guardianRelation}</div>
                  </td>

                  {/* Phone */}
                  <td className="py-3.5 px-3 whitespace-nowrap font-mono text-slate-700 text-xs">
                    {student.guardianPhone}
                  </td>

                  {/* WhatsApp Direct Action Button */}
                  <td className="py-3.5 px-4 text-center whitespace-nowrap">
                    <button
                      onClick={() => setWhatsappTemplateStudent(student)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/80 text-xs font-bold transition-all active:scale-95 cursor-pointer"
                      title="Abrir opções de contato no WhatsApp com este responsável"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Falar no WhatsApp</span>
                    </button>
                  </td>

                  {/* Full Profile */}
                  <td className="py-3.5 px-3 text-center whitespace-nowrap">
                    <button
                      onClick={() => onSelectStudent(student.id)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-orange-600 hover:bg-orange-50 transition-colors"
                      title="Abrir detalhes do aluno"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* WhatsApp Template Chooser Modal */}
      {whatsappTemplateStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div 
            className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-5 bg-emerald-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Contato Direto via WhatsApp</h3>
                  <p className="text-xs text-emerald-100">
                    Com: {whatsappTemplateStudent.guardianName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setWhatsappTemplateStudent(null)}
                className="text-white/80 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            {/* Content / Templates */}
            <div className="p-6 space-y-3">
              <p className="text-xs text-slate-600 leading-relaxed">
                Selecione o contexto da mensagem institucional para abrir a conversa oficial com o responsável no WhatsApp:
              </p>

              <div className="space-y-2 pt-2">
                <button
                  onClick={() => handleOpenWhatsappWithTemplate(whatsappTemplateStudent, 'geral')}
                  className="w-full text-left p-3 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/40 transition-all flex items-center justify-between group"
                >
                  <div>
                    <div className="text-xs font-bold text-slate-800 group-hover:text-emerald-700">
                      Contato Geral da Coordenação
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      "Olá, aqui é da coordenação da E.E. Tróia a respeito de {whatsappTemplateStudent.name}..."
                    </div>
                  </div>
                  <Send className="w-4 h-4 text-slate-300 group-hover:text-emerald-600" />
                </button>

                <button
                  onClick={() => handleOpenWhatsappWithTemplate(whatsappTemplateStudent, 'atraso')}
                  className="w-full text-left p-3 rounded-xl border border-slate-200 hover:border-amber-500 hover:bg-amber-50/40 transition-all flex items-center justify-between group"
                >
                  <div>
                    <div className="text-xs font-bold text-slate-800 group-hover:text-amber-700">
                      Aviso sobre Horário / Atraso
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      "Informamos que {whatsappTemplateStudent.name} registrou entrada após o limite regular..."
                    </div>
                  </div>
                  <Send className="w-4 h-4 text-slate-300 group-hover:text-amber-600" />
                </button>

                <button
                  onClick={() => handleOpenWhatsappWithTemplate(whatsappTemplateStudent, 'documento')}
                  className="w-full text-left p-3 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/40 transition-all flex items-center justify-between group"
                >
                  <div>
                    <div className="text-xs font-bold text-slate-800 group-hover:text-blue-700">
                      Solicitação de Atestado / Justificativa
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      "Solicitamos o envio do atestado médico para justificar a ausência recente..."
                    </div>
                  </div>
                  <Send className="w-4 h-4 text-slate-300 group-hover:text-blue-600" />
                </button>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setWhatsappTemplateStudent(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
