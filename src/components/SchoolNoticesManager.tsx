import React, { useState } from 'react';
import { 
  Megaphone, 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  Clock, 
  FileText, 
  AlertCircle, 
  CheckCircle2, 
  Trash2, 
  Edit3, 
  Send, 
  Eye, 
  Users, 
  Bell, 
  Sparkles,
  Paperclip,
  CheckCheck,
  Smartphone,
  ExternalLink,
  X
} from 'lucide-react';
import { SchoolNotice } from '../types';

interface SchoolNoticesManagerProps {
  notices: SchoolNotice[];
  onAddNotice: (notice: Omit<SchoolNotice, 'id'>, notifyGuardians: boolean) => Promise<void>;
  onUpdateNotice: (notice: SchoolNotice) => Promise<void>;
  onDeleteNotice: (id: string) => Promise<void>;
  onBroadcastPush: (notice: SchoolNotice) => Promise<void>;
  canManage: boolean;
  persistenceState: 'loading' | 'persistent' | 'unavailable';
  persistenceError?: string;
}

export const SchoolNoticesManager: React.FC<SchoolNoticesManagerProps> = ({
  notices,
  onAddNotice,
  onUpdateNotice,
  onDeleteNotice,
  onBroadcastPush,
  canManage,
  persistenceState,
  persistenceError,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas');
  const [selectedPriority, setSelectedPriority] = useState<string>('Todas');
  
  // Modal states
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [editingNotice, setEditingNotice] = useState<SchoolNotice | null>(null);
  const [previewNotice, setPreviewNotice] = useState<SchoolNotice | null>(null);
  const [broadcastSuccess, setBroadcastSuccess] = useState<string | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<SchoolNotice['category']>('Pedagógico');
  const [priority, setPriority] = useState<SchoolNotice['priority']>('important');
  const [author, setAuthor] = useState('Diretoria Pedagógica');
  const [role, setRole] = useState('Profa. Regina Vasconcelos');
  const [summary, setSummary] = useState('');
  const [fullContent, setFullContent] = useState('');
  const [attachmentName, setAttachmentName] = useState('');
  const [autoBroadcast, setAutoBroadcast] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [operationError, setOperationError] = useState<string>();

  // Open composer for new notice
  const handleOpenNew = () => {
    setEditingNotice(null);
    setTitle('');
    setCategory('Pedagógico');
    setPriority('important');
    setAuthor('Diretoria Pedagógica');
    setRole('Profa. Regina Vasconcelos');
    setSummary('');
    setFullContent('');
    setAttachmentName('');
    setAutoBroadcast(true);
    setIsComposerOpen(true);
  };

  // Open composer for editing
  const handleOpenEdit = (n: SchoolNotice) => {
    setEditingNotice(n);
    setTitle(n.title);
    setCategory(n.category);
    setPriority(n.priority);
    setAuthor(n.author);
    setRole(n.role);
    setSummary(n.summary);
    setFullContent(n.fullContent);
    setAttachmentName(n.attachmentName || '');
    setAutoBroadcast(false);
    setIsComposerOpen(true);
  };

  // Save notice (create or update)
  const handleSaveNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !summary.trim() || !fullContent.trim()) return;

    const now = new Date();
    const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const dateStr = 'Hoje, ' + timeStr;

    setIsSaving(true);
    setOperationError(undefined);
    try {
    if (editingNotice) {
      const updated: SchoolNotice = {
        ...editingNotice,
        title,
        category,
        priority,
        author,
        role,
        summary,
        fullContent,
        attachmentName: attachmentName.trim() || undefined,
      };
      await onUpdateNotice(updated);
    } else {
      const newNotice: Omit<SchoolNotice, 'id'> = {
        title,
        category,
        priority,
        author,
        role,
        date: dateStr,
        time: timeStr,
        summary,
        fullContent,
        isUnread: true,
        attachmentName: attachmentName.trim() || undefined,
      };
      await onAddNotice(newNotice, autoBroadcast);
    }

    setIsComposerOpen(false);
    } catch (error) {
      setOperationError(error instanceof Error ? error.message : 'Não foi possível salvar o comunicado.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTriggerBroadcast = async (notice: SchoolNotice) => {
    setOperationError(undefined);
    try {
      await onBroadcastPush(notice);
      setBroadcastSuccess(notice.id);
      setTimeout(() => setBroadcastSuccess(null), 3000);
    } catch (error) {
      setOperationError(error instanceof Error ? error.message : 'Não foi possível gerar as notificações internas.');
    }
  };

  // Filter notices
  const filteredNotices = notices.filter((n) => {
    const matchesSearch =
      n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.fullContent.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCat = selectedCategory === 'Todas' || n.category === selectedCategory;
    const matchesPrio = selectedPriority === 'Todas' || n.priority === selectedPriority;

    return matchesSearch && matchesCat && matchesPrio;
  });

  const urgentCount = notices.filter(n => n.priority === 'urgent').length;
  const pedagogicalCount = notices.filter(n => n.category === 'Pedagógico').length;

  return (
    <div className="space-y-5">
      
      {/* Top Concise Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Publicados</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Megaphone className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-slate-900">{notices.length}</span>
            <span className="text-xs text-slate-400">avisos</span>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Persistência</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-sm font-bold text-slate-900">SQLite</span>
            <span className="text-xs text-emerald-600 font-semibold">API local</span>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Urgentes</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-slate-900">{urgentCount}</span>
            <span className="text-xs text-rose-600 font-semibold">destacados</span>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Canal Implementado</span>
            <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
              <Smartphone className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-sm font-bold text-slate-900">Interno no app</span>
            <span className="text-xs text-slate-500 font-semibold">demonstrativo</span>
          </div>
        </div>

      </div>

      {/* Action Bar & Controls */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-orange-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Comunicados Oficiais da Escola
            </h3>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {canManage && <button
              id="btn-create-school-notice"
              onClick={handleOpenNew}
              className="px-3.5 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Novo Comunicado</span>
            </button>}
          </div>
        </div>

        {/* Filter controls */}
        <div className="pt-3 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-3">
          
          {/* Search box */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar comunicados por título, texto ou autor..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium text-slate-800"
            />
          </div>

          {/* Category & Priority chips */}
          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            <span className="text-xs font-semibold text-slate-400 hidden lg:inline">Categoria:</span>
            {['Todas', 'Pedagógico', 'Segurança', 'Eventos', 'Plantão', 'Geral'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}

            <span className="text-slate-300 mx-1">|</span>

            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 border border-slate-200 text-slate-700 focus:outline-none"
            >
              <option value="Todas">Todas as Prioridades</option>
              <option value="urgent">Urgente</option>
              <option value="important">Importante</option>
              <option value="info">Informativo</option>
            </select>
          </div>

        </div>
      </div>

      {(persistenceState !== 'persistent' || operationError) && (
        <div className={`rounded-xl border px-4 py-3 text-xs ${
          persistenceState === 'loading' && !operationError
            ? 'border-blue-200 bg-blue-50 text-blue-800'
            : 'border-amber-200 bg-amber-50 text-amber-900'
        }`}>
          {operationError || persistenceError || 'Carregando comunicados persistidos…'}
        </div>
      )}

      {/* Notices Grid / List */}
      <div className="space-y-3.5">
        {filteredNotices.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
              <Megaphone className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-800">Nenhum comunicado encontrado</h4>
            <p className="text-xs text-slate-500 mt-1">
              Tente alterar os termos de busca ou clique no botão acima para criar o primeiro comunicado.
            </p>
          </div>
        ) : (
          filteredNotices.map((item) => {
            const isUrgent = item.priority === 'urgent';
            const isImportant = item.priority === 'important';

            return (
              <div
                key={item.id}
                className={`bg-white rounded-2xl border transition-all p-5 shadow-xs hover:shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                  isUrgent 
                    ? 'border-rose-200 bg-rose-50/20' 
                    : isImportant
                    ? 'border-amber-200/80 bg-amber-50/10'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 mt-0.5 shadow-xs ${
                    isUrgent
                      ? 'bg-rose-100 text-rose-700'
                      : isImportant
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-purple-100 text-purple-700'
                  }`}>
                    {isUrgent ? <AlertCircle className="w-5 h-5" /> : <Megaphone className="w-5 h-5" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider ${
                        isUrgent
                          ? 'bg-rose-500 text-white'
                          : isImportant
                          ? 'bg-amber-500 text-white'
                          : 'bg-slate-200 text-slate-800'
                      }`}>
                        {isUrgent ? 'Urgente' : isImportant ? 'Importante' : 'Informativo'}
                      </span>

                      <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        {item.category}
                      </span>

                      <span className="text-xs text-slate-400 flex items-center gap-1 font-medium">
                        <Clock className="w-3 h-3" />
                        {item.date}
                      </span>
                    </div>

                    <h4 className="text-base font-bold text-slate-900 tracking-tight hover:text-orange-600 transition-colors">
                      {item.title}
                    </h4>

                    <p className="text-xs text-slate-600 line-clamp-2 mt-1 leading-relaxed">
                      {item.summary}
                    </p>

                    <div className="flex items-center gap-4 mt-2.5 text-xs text-slate-500 flex-wrap">
                      <span className="font-medium text-slate-700">
                        Por: <strong>{item.author}</strong> ({item.role})
                      </span>

                      {item.attachmentName && (
                        <span className="inline-flex items-center gap-1 text-blue-600 font-semibold bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                          <Paperclip className="w-3 h-3" />
                          <span>{item.attachmentName}</span>
                        </span>
                      )}

                      <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[11px] font-semibold">
                        <CheckCheck className="w-3 h-3 text-emerald-600" />
                        <span>Sincronizado no App dos Pais</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions on this Notice */}
                <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                  {canManage && <button
                    onClick={() => handleTriggerBroadcast(item)}
                    title="Gerar notificações internas para os responsáveis"
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      broadcastSuccess === item.id
                        ? 'bg-emerald-600 text-white'
                        : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
                    }`}
                  >
                    {broadcastSuccess === item.id ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Notificações geradas</span>
                      </>
                    ) : (
                      <>
                        <Smartphone className="w-3.5 h-3.5" />
                        <span>Notificar no app</span>
                      </>
                    )}
                  </button>}

                  {canManage && <button
                    onClick={() => setPreviewNotice(item)}
                    title="Visualizar comunicado completo"
                    className="p-2 rounded-xl text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                  </button>}

                  <button
                    onClick={() => handleOpenEdit(item)}
                    title="Editar comunicado"
                    className="p-2 rounded-xl text-slate-600 hover:text-orange-600 bg-slate-100 hover:bg-orange-50 border border-slate-200 transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  {canManage && <button
                    onClick={async () => {
                      if (confirm(`Deseja realmente remover o comunicado "${item.title}"?`)) {
                        try {
                          await onDeleteNotice(item.id);
                        } catch (error) {
                          setOperationError(error instanceof Error ? error.message : 'Não foi possível remover o comunicado.');
                        }
                      }
                    }}
                    title="Excluir comunicado"
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal 1: Notice Composer (Create & Edit) */}
      {isComposerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div 
            className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400">
                  <Megaphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {editingNotice ? 'Editar Comunicado Oficial' : 'Novo Comunicado da Gestão Escolar'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    O aviso será exibido no aplicativo familiar e catalogado nos registros escolares.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsComposerOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSaveNotice} className="p-6 overflow-y-auto space-y-4 flex-1">
              
              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Título do Comunicado *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Reunião Pedagógica com Pais do Ensino Médio"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                />
              </div>

              {/* Category and Priority row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Categoria
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as SchoolNotice['category'])}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  >
                    <option value="Pedagógico">Pedagógico</option>
                    <option value="Segurança">Segurança & Catracas</option>
                    <option value="Eventos">Eventos & Projetos</option>
                    <option value="Plantão">Plantão de Dúvidas</option>
                    <option value="Geral">Geral / Institucional</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Nível de Prioridade
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as SchoolNotice['priority'])}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  >
                    <option value="important">Importante (Destaque Âmbar)</option>
                    <option value="urgent">Urgente (Destaque Vermelho com Alerta)</option>
                    <option value="info">Informativo (Padrão)</option>
                  </select>
                </div>
              </div>

              {/* Author and Role row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Setor / Departamento Autor
                  </label>
                  <input
                    type="text"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    placeholder="Ex: Diretoria Pedagógica"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Nome do Emissor / Responsável
                  </label>
                  <input
                    type="text"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder="Ex: Profa. Regina Vasconcelos"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  />
                </div>
              </div>

              {/* Summary */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Resumo Breve (Exibido na notificação interna e na lista) *
                </label>
                <input
                  type="text"
                  required
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="Ex: Convocação para entrega das notas e cronograma do 3º trimestre."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>

              {/* Full Content */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Conteúdo Completo do Comunicado *
                </label>
                <textarea
                  required
                  rows={4}
                  value={fullContent}
                  onChange={(e) => setFullContent(e.target.value)}
                  placeholder="Escreva detalhadamente o comunicado institucional, orientações, horários e observações aos pais..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 leading-relaxed resize-none"
                ></textarea>
              </div>

              {/* Attachment / Document */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Paperclip className="w-3.5 h-3.5 text-slate-500" />
                    <span>Nome do Anexo ou Documento Oficial (Opcional)</span>
                  </label>
                </div>
                <input
                  type="text"
                  value={attachmentName}
                  onChange={(e) => setAttachmentName(e.target.value)}
                  placeholder="Ex: cronograma_oficial_2026.pdf ou edital_reuniao.docx"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>

              {/* Broadcast Option */}
              <div className="flex items-center gap-2 text-xs font-medium text-slate-700 pt-1">
                <input
                  type="checkbox"
                  id="chk-auto-notification"
                  checked={autoBroadcast}
                  onChange={(e) => setAutoBroadcast(e.target.checked)}
                  className="rounded text-orange-600 focus:ring-orange-500 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="chk-auto-notification" className="cursor-pointer">
                  Gerar <strong>notificação interna no app dos responsáveis</strong> ao publicar este comunicado
                </label>
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsComposerOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSaving ? 'Salvando…' : editingNotice ? 'Atualizar Comunicado' : 'Publicar Comunicado'}</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Notice Preview Detail */}
      {previewNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div 
            className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Megaphone className="w-5 h-5 text-orange-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-orange-400">
                  Visualização do Comunicado
                </span>
              </div>
              <button
                onClick={() => setPreviewNotice(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-orange-50 text-orange-700 border border-orange-200">
                  {previewNotice.category}
                </span>
                <span className="text-xs text-slate-400">•</span>
                <span className="text-xs text-slate-500">{previewNotice.date}</span>
              </div>

              <h3 className="text-lg font-bold text-slate-900">
                {previewNotice.title}
              </h3>

              <div className="p-3.5 rounded-xl bg-slate-50 text-slate-600 text-xs italic border border-slate-200">
                "{previewNotice.summary}"
              </div>

              <div className="text-xs text-slate-700 leading-relaxed space-y-3 whitespace-pre-line">
                {previewNotice.fullContent}
              </div>

              {previewNotice.attachmentName && (
                <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-blue-900 font-semibold">
                    <Paperclip className="w-4 h-4 text-blue-600" />
                    <span>{previewNotice.attachmentName}</span>
                  </div>
                  <span className="text-[11px] text-blue-600 font-mono">PDF Anexo</span>
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Publicado por: <strong>{previewNotice.author}</strong> ({previewNotice.role})</span>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setPreviewNotice(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-white text-xs font-bold hover:bg-slate-700 transition-colors cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
