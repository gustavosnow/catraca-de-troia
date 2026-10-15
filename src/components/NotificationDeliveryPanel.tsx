import React from 'react';
import { AlertTriangle, CheckCircle2, Clock3, RefreshCw, Send, WifiOff } from 'lucide-react';
import type { NotificationDeliverySnapshot } from '../../shared/contracts/notificationDelivery';

interface NotificationDeliveryPanelProps {
  snapshot?: NotificationDeliverySnapshot;
  state: 'loading' | 'persistent' | 'unavailable';
  error?: string;
  busy: boolean;
  onRefresh: () => void;
  onProcess: (outcome: 'DELIVER' | 'FAIL_RETRY') => void;
  onRetry: () => void;
}

export const NotificationDeliveryPanel: React.FC<NotificationDeliveryPanelProps> = ({
  snapshot,
  state,
  error,
  busy,
  onRefresh,
  onProcess,
  onRetry,
}) => <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
    <div>
      <div className="flex items-center gap-2"><Send className="h-5 w-5 text-orange-600" /><h2 className="text-sm font-bold text-slate-900">Fila demonstrativa de entrega</h2></div>
      <p className="mt-1 text-[11px] text-slate-500">Estados e retentativas persistem no SQLite. O canal PUSH_DEMO não envia mensagens reais.</p>
    </div>
    <div className="flex flex-wrap gap-2">
      <button type="button" onClick={onRefresh} disabled={busy} className="flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] font-bold text-slate-700 disabled:opacity-50"><RefreshCw className={`h-3.5 w-3.5 ${state === 'loading' ? 'animate-spin' : ''}`} />Atualizar</button>
      <button type="button" onClick={onRetry} disabled={busy || !snapshot?.counts.FAILED} className="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-[11px] font-bold text-amber-800 disabled:opacity-50">Reenfileirar falhas</button>
      <button type="button" onClick={() => onProcess('FAIL_RETRY')} disabled={busy || !snapshot?.counts.PENDING} className="flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-[11px] font-bold text-rose-800 disabled:opacity-50"><WifiOff className="h-3.5 w-3.5" />Simular indisponibilidade</button>
      <button type="button" onClick={() => onProcess('DELIVER')} disabled={busy || (!snapshot?.counts.PENDING && !snapshot?.counts.FAILED)} className="flex items-center gap-1 rounded-lg bg-orange-600 px-2.5 py-1.5 text-[11px] font-bold text-white disabled:opacity-50"><Send className="h-3.5 w-3.5" />Processar simulação</button>
    </div>
  </div>
  {state === 'unavailable' && <p role="alert" className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">{error || 'Fila indisponível.'}</p>}
  <div className="mt-3 grid grid-cols-3 gap-2">
    <div className="rounded-xl bg-amber-50 p-3"><Clock3 className="h-4 w-4 text-amber-700" /><p className="mt-1 text-xl font-black text-amber-900">{snapshot?.counts.PENDING ?? 0}</p><p className="text-[10px] font-bold text-amber-800">Pendentes</p></div>
    <div className="rounded-xl bg-emerald-50 p-3"><CheckCircle2 className="h-4 w-4 text-emerald-700" /><p className="mt-1 text-xl font-black text-emerald-900">{snapshot?.counts.DELIVERED ?? 0}</p><p className="text-[10px] font-bold text-emerald-800">Entregues na simulação</p></div>
    <div className="rounded-xl bg-rose-50 p-3"><AlertTriangle className="h-4 w-4 text-rose-700" /><p className="mt-1 text-xl font-black text-rose-900">{snapshot?.counts.FAILED ?? 0}</p><p className="text-[10px] font-bold text-rose-800">Aguardando retentativa</p></div>
  </div>
  <div className="mt-3 max-h-72 overflow-auto rounded-xl border border-slate-100">
    {snapshot?.records.map((record) => <div key={record.id} className="grid gap-1 border-b border-slate-100 p-3 text-[11px] last:border-0 sm:grid-cols-[minmax(0,1fr)_auto]">
      <div className="min-w-0"><p className="truncate font-bold text-slate-800">{record.title}</p><p className="truncate text-slate-500">{record.recipientName} • PUSH_DEMO • {record.attemptCount} tentativa(s)</p>{record.lastError && <p className="mt-1 text-rose-700">{record.lastError}</p>}</div>
      <span className={`self-start rounded-full px-2 py-0.5 font-bold ${record.state === 'DELIVERED' ? 'bg-emerald-100 text-emerald-800' : record.state === 'FAILED' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'}`}>{record.state === 'DELIVERED' ? 'Entregue (simulação)' : record.state === 'FAILED' ? 'Falha' : 'Pendente'}</span>
    </div>)}
    {state !== 'loading' && !snapshot?.records.length && <p className="p-3 text-xs text-slate-500">A fila será alimentada por novos eventos, justificativas, vínculos e comunicados.</p>}
  </div>
</section>;
