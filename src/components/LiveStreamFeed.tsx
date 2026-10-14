import React, { useState } from 'react';
import { 
  Radio, 
  MessageSquare, 
  Smartphone, 
  CheckCircle2, 
  Clock, 
  Search, 
  Filter, 
  LayoutList, 
  LayoutGrid, 
  User, 
  ExternalLink,
  Shield,
  Download,
  QrCode,
  CreditCard,
  Camera,
  Fingerprint,
  RotateCw,
  Eye,
  AlertTriangle,
  Send
} from 'lucide-react';
import { AccessLog } from '../types';

interface LiveStreamFeedProps {
  logs: AccessLog[];
  onSelectStudent: (studentId: string) => void;
  onResendNotification: (logId: string) => void;
  selectedTurno: string;
  selectedTurma: string;
}

export const LiveStreamFeed: React.FC<LiveStreamFeedProps> = ({
  logs,
  onSelectStudent,
  onResendNotification,
  selectedTurno,
  selectedTurma,
}) => {
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('cards');
  const [searchTerm, setSearchTerm] = useState('');

  // Filter logs by search term inside feed
  const filteredLogs = logs.filter((log) => {
    const matchesSearch = 
      log.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.matricula.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.turma.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.turnstileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.method.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTurno = selectedTurno === 'Todos' || log.shift === selectedTurno;
    const matchesTurma = selectedTurma === 'Todas' || log.turma === selectedTurma;

    return matchesSearch && matchesTurno && matchesTurma;
  });

  const exportCSV = () => {
    const headers = ['Evento', 'Horario', 'Matricula', 'Aluno', 'Turma', 'Turno', 'Catraca', 'Metodo', 'Status', 'Notificacao App', 'Telefone Responsavel'];
    const rows = filteredLogs.map(l => [
      l.direction === 'entry' ? 'Entrada' : 'Saida',
      l.exactTime,
      l.matricula,
      `"${l.studentName}"`,
      `"${l.turma}"`,
      l.shift,
      `"${l.turnstileName}"`,
      l.method,
      l.status,
      l.notification.pushApp,
      `"${l.notification.phoneTarget}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `passagens_catraca_troia_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper method badge icon and color
  const renderMethodBadge = (method: string) => {
    const m = method.toLowerCase();
    if (m.includes('facial')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-orange-50 text-orange-700 border border-orange-200">
          <Camera className="w-3.5 h-3.5 text-orange-600" />
          <span>Facial</span>
        </span>
      );
    }
    if (m.includes('rfid') || m.includes('crachá') || m.includes('nfc')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-800 border border-slate-300">
          <CreditCard className="w-3.5 h-3.5 text-slate-600" />
          <span>Crachá RFID</span>
        </span>
      );
    }
    if (m.includes('qr')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
          <QrCode className="w-3.5 h-3.5 text-purple-600" />
          <span>QR Dinâmico</span>
        </span>
      );
    }
    if (m.includes('biometria') || m.includes('digital')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-cyan-50 text-cyan-800 border border-cyan-200">
          <Fingerprint className="w-3.5 h-3.5 text-cyan-600" />
          <span>Biometria</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
        <Shield className="w-3.5 h-3.5 text-blue-600" />
        <span>{method}</span>
      </span>
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
      
      {/* Header of Feed */}
      <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-3">
        
        {/* Title & Live Status Indicator */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-2.5 py-1 bg-emerald-50 border border-emerald-200/80 text-emerald-800 rounded-full text-xs font-extrabold tracking-wide">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600"></span>
            </span>
            <span>AO VIVO</span>
          </div>

          <div>
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <span>Passagens na Catraca</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                {filteredLogs.length} registros
              </span>
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Registros simulados • Meta: 95% processados para envio em até 5s na homologação
            </p>
          </div>
        </div>

        {/* View toggles & Quick search */}
        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
          {/* Search box */}
          <div className="relative flex-1 sm:flex-initial">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar aluno, turma, catraca..."
              className="pl-9 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 w-full sm:w-56 transition-all font-medium"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>

          {/* Export CSV button */}
          <button
            onClick={exportCSV}
            title="Exportar registros filtrados para CSV"
            className="px-3 py-2 text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 rounded-xl border border-slate-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span className="hidden sm:inline">Exportar CSV</span>
          </button>

          {/* Table / Cards toggle */}
          <div className="flex items-center bg-slate-200/70 p-1 rounded-xl border border-slate-300/80">
            <button
              onClick={() => setViewMode('table')}
              title="Visualização em Lista / Tabela"
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'table' ? 'bg-white text-slate-900 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutList className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('cards')}
              title="Visualização em Grade de Cards"
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'cards' ? 'bg-white text-slate-900 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>

        </div>

      </div>

      {/* Main Feed Content */}
      <div className="flex-1 overflow-y-auto max-h-[640px] divide-y divide-slate-100">
        
        {filteredLogs.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-orange-50 text-orange-600 mx-auto flex items-center justify-center mb-3.5 border border-orange-200">
              <Search className="w-7 h-7" />
            </div>
            <p className="text-base font-bold text-slate-800">Nenhum registro de acesso encontrado</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Nenhuma passagem corresponde aos filtros selecionados (Turno: {selectedTurno}, Turma: {selectedTurma}) ou ao termo pesquisado.
            </p>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="mt-3 px-3 py-1.5 rounded-lg bg-orange-600 text-white text-xs font-bold hover:bg-orange-700 cursor-pointer"
              >
                Limpar Busca
              </button>
            )}
          </div>
        ) : viewMode === 'table' ? (
          
          /* Table View */
          <div className="overflow-x-auto w-full">
            <table className="min-w-[860px] w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100/90 text-slate-600 font-extrabold uppercase tracking-wider text-[11px] border-b border-slate-200 sticky top-0 z-10 backdrop-blur-xs">
                <tr>
                  <th className="py-3.5 px-4">Estudante</th>
                  <th className="py-3.5 px-3">Turma & Turno</th>
                  <th className="py-3.5 px-3">Evento & Horário</th>
                  <th className="py-3.5 px-3">Catraca</th>
                  <th className="py-3.5 px-3">Método</th>
                  <th className="py-3.5 px-3">Status</th>
                  <th className="py-3.5 px-4 text-left">Notificação aos Pais</th>
                  <th className="py-3.5 px-3 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredLogs.map((log, index) => {
                  const isRecent = index === 0 && log.isNew;
                  return (
                    <tr 
                      key={log.id}
                      className={`hover:bg-slate-50/90 transition-colors group ${
                        isRecent ? 'bg-orange-50/70 border-l-4 border-orange-500' : ''
                      }`}
                    >
                      {/* Student Info */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="relative shrink-0">
                            <img
                              src={log.avatar}
                              alt={log.studentName}
                              className="w-10 h-10 rounded-full object-cover ring-2 ring-slate-200 group-hover:ring-orange-400 transition-all shadow-xs"
                              loading="lazy"
                            />
                            {log.status === 'Autorizado' && (
                              <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full"></span>
                            )}
                            {log.status === 'Tolerância' && (
                              <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-amber-500 border-2 border-white rounded-full"></span>
                            )}
                            {log.status === 'LiberacaoManual' && (
                              <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-blue-500 border-2 border-white rounded-full"></span>
                            )}
                          </div>
                          
                          <div className="min-w-0">
                            <button
                              onClick={() => onSelectStudent(log.studentId)}
                              className="font-extrabold text-slate-900 hover:text-orange-600 text-sm transition-colors text-left flex items-center gap-1.5 group/name truncate cursor-pointer"
                            >
                              <span>{log.studentName}</span>
                              <ExternalLink className="w-3.5 h-3.5 text-slate-300 group-hover/name:text-orange-500 transition-colors opacity-0 group-hover/name:opacity-100 shrink-0" />
                            </button>
                            <div className="flex items-center gap-2 mt-0.5 text-slate-500 text-xs">
                              <span className="font-mono text-slate-600 font-bold">Matr: {log.matricula}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Turma & Turno */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <div className="font-bold text-slate-800 text-xs">
                          {log.turma}
                        </div>
                        <div className="text-[11px] text-slate-500 font-medium">
                          Turno {log.shift}
                        </div>
                      </td>

                      {/* Exact Time */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <div className={`text-[10px] font-extrabold uppercase tracking-wide mb-1 ${
                          log.direction === 'entry' ? 'text-emerald-700' : 'text-blue-700'
                        }`}>
                          {log.direction === 'entry' ? 'Entrada' : 'Saída'}
                        </div>
                        <div className="font-mono font-extrabold text-slate-900 text-xs bg-slate-100 px-2 py-0.5 rounded-md inline-block">
                          {log.exactTime}
                        </div>
                        <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                          {log.relativeTime || 'Agora'}
                        </div>
                      </td>

                      {/* Turnstile Gate */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <div className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                          <span>{log.turnstileName}</span>
                        </div>
                      </td>

                      {/* Method */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        {renderMethodBadge(log.method)}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        {log.status === 'Autorizado' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>No Horário</span>
                          </span>
                        )}
                        {log.status === 'Tolerância' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-900 border border-amber-300">
                            <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            <span>Tolerância (+5m)</span>
                          </span>
                        )}
                        {log.status === 'LiberacaoManual' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200" title={log.reason}>
                            <Shield className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                            <span>Manual ({log.operator ? 'Portaria' : 'Supervisão'})</span>
                          </span>
                        )}
                      </td>

                      {/* Notification Status to Parents */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex flex-col items-start gap-1">
                          <div 
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-50 text-sky-900 border border-sky-200 text-xs font-bold"
                            title={`Notificação Push enviada ao App dos Pais às ${log.notification.sentAt}`}
                          >
                            <Smartphone className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                            <span>Push no App: {log.notification.pushApp === 'Lido' ? 'Lido' : 'Entregue'}</span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono">
                            Disparado às {log.notification.sentAt}
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => onResendNotification(log.id)}
                            className="px-2.5 py-1.5 text-emerald-800 hover:text-white bg-emerald-50 hover:bg-emerald-600 rounded-lg transition-all cursor-pointer border border-emerald-200 font-bold text-xs flex items-center gap-1 shadow-xs"
                            title="Entrar em contato com o responsável via WhatsApp"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span className="hidden lg:inline">WhatsApp</span>
                          </button>
                          
                          <button
                            onClick={() => onSelectStudent(log.studentId)}
                            className="p-1.5 text-slate-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors cursor-pointer border border-slate-200"
                            title="Ver ficha do aluno e histórico completo"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          
          /* Cards Grid View */
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredLogs.map((log) => (
              <div 
                key={log.id}
                className="p-4 rounded-2xl border border-slate-200 hover:border-orange-300 bg-white hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="flex items-start gap-3.5">
                  <img
                    src={log.avatar}
                    alt={log.studentName}
                    className="w-12 h-12 rounded-xl object-cover ring-2 ring-slate-100 shadow-xs shrink-0"
                    loading="lazy"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 
                        onClick={() => onSelectStudent(log.studentId)}
                        className="text-sm font-extrabold text-slate-900 truncate hover:text-orange-600 cursor-pointer"
                      >
                        {log.studentName}
                      </h4>
                      <span className="font-mono text-xs font-extrabold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md shrink-0">
                        {log.exactTime}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 font-semibold mt-0.5 truncate">
                      {log.turma} • <span className="font-mono">#{log.matricula}</span> • Turno {log.shift}
                    </p>

                    <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                      <span className={`text-xs font-bold px-2.5 py-0.5 rounded-lg border ${
                        log.direction === 'entry'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : 'bg-blue-50 text-blue-800 border-blue-200'
                      }`}>
                        {log.direction === 'entry' ? 'Entrada' : 'Saída'}
                      </span>
                      <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-lg border border-slate-200">
                        {log.turnstileName}
                      </span>
                      {renderMethodBadge(log.method)}
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-xs text-sky-900 font-bold">
                    <Smartphone className="w-4 h-4 text-sky-600 shrink-0" />
                    <span>App: {log.notification.pushApp === 'Lido' ? 'Lido' : 'Entregue'} ({log.notification.sentAt})</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onResendNotification(log.id)}
                      className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 px-2 py-1 bg-emerald-50 rounded-lg hover:bg-emerald-100 border border-emerald-200 cursor-pointer"
                      title="Contatar responsável no WhatsApp"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </button>

                    <button
                      onClick={() => onSelectStudent(log.studentId)}
                      className="text-xs font-bold text-orange-600 hover:text-orange-700 px-2 py-1 bg-orange-50 rounded-lg hover:bg-orange-100 cursor-pointer"
                    >
                      Ver Ficha
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* Footer info & Count */}
      <div className="p-3.5 sm:p-4 bg-slate-50 border-t border-slate-200 text-xs text-slate-600 flex flex-col sm:flex-row items-center justify-between gap-2 font-semibold">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
          <span>Exibindo {filteredLogs.length} registros simulados de passagem</span>
        </div>
        <div className="text-slate-500 text-xs">
          Filtros ativos: <span className="font-bold text-slate-800">Turno {selectedTurno}</span> • <span className="font-bold text-slate-800">{selectedTurma}</span>
        </div>
      </div>

    </div>
  );
};
