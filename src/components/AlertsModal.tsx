import React from 'react';
import { 
  X, 
  AlertTriangle, 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  Cpu, 
  Check
} from 'lucide-react';
import { SecurityAlert } from '../types';
import { useAccessibleDialog } from '../hooks/useAccessibleDialog';

interface AlertsModalProps {
  alerts: SecurityAlert[];
  isOpen: boolean;
  onClose: () => void;
  onResolveAlert: (alertId: string) => void;
}

export const AlertsModal: React.FC<AlertsModalProps> = ({
  alerts,
  isOpen,
  onClose,
  onResolveAlert,
}) => {
  const dialogRef = useAccessibleDialog({ isOpen, onClose });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="alerts-modal-title"
        tabIndex={-1}
        className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="p-5 bg-amber-500 text-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-black/10 text-slate-950">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 id="alerts-modal-title" className="font-extrabold text-base tracking-tight text-slate-950">
                Alertas de Acesso & Inconsistências
              </h3>
              <p className="text-slate-900/80 text-xs font-medium">
                Monitoramento de Segurança em Tempo Real
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar alertas"
            className="p-1.5 rounded-lg text-slate-950/70 hover:text-slate-950 hover:bg-black/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List of Alerts */}
        <div className="p-5 space-y-3 max-h-[420px] overflow-y-auto">
          {alerts.length === 0 ? (
            <div className="py-8 text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-slate-800">Tudo limpo!</p>
              <p className="text-xs text-slate-500">Nenhuma inconsistência ou tentativa não autorizada pendente.</p>
            </div>
          ) : (
            alerts.map((alert) => (
              <div 
                key={alert.id}
                className={`p-4 rounded-xl border transition-all ${
                  alert.resolved 
                    ? 'bg-slate-50 border-slate-200 opacity-60' 
                    : 'bg-amber-50/60 border-amber-300'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle className={`w-4 h-4 mt-0.5 shrink-0 ${alert.resolved ? 'text-slate-400' : 'text-amber-600'}`} />
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 leading-tight">
                        {alert.title}
                      </h4>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                        {alert.description}
                      </p>
                      <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-500 font-medium">
                        <span className="flex items-center gap-1 font-mono">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {alert.time}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Cpu className="w-3 h-3 text-slate-400" />
                          {alert.turnstile}
                        </span>
                      </div>
                    </div>
                  </div>

                  {!alert.resolved && (
                    <button
                      type="button"
                      onClick={() => onResolveAlert(alert.id)}
                      className="px-2.5 py-1 bg-white hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-lg text-xs font-semibold shrink-0 transition-colors flex items-center gap-1 cursor-pointer"
                      title="Marcar como verificado"
                    >
                      <Check className="w-3 h-3" />
                      <span>Resolver</span>
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
};
