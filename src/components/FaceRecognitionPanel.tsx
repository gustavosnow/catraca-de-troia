import React, { useEffect, useState } from 'react';
import { Camera, ShieldAlert, ScanFace } from 'lucide-react';
import type {
  AccessDenialRecord,
  AccessDeviceRecord,
  DenialReason,
} from '../../shared/contracts/accessDevices';
import { accessDevicesApi } from '../services/accessDevicesApi';

const DENIAL_LABELS: Record<DenialReason, string> = {
  UNKNOWN_FACE: 'Rosto não cadastrado',
  LOW_SCORE: 'Similaridade abaixo do limiar',
  STUDENT_NOT_REGISTERED: 'Estudante fora do cadastro',
};

/** Câmera considerada ativa se enviou leitura nos últimos 2 minutos. */
const ONLINE_WINDOW_MS = 2 * 60 * 1000;

const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

/**
 * Situação do protótipo de reconhecimento facial (MC-036): câmeras cadastradas
 * e últimas leituras negadas. Negações não guardam imagem nem identificam pessoa.
 */
export const FaceRecognitionPanel: React.FC<{ enabled: boolean }> = ({ enabled }) => {
  const [devices, setDevices] = useState<AccessDeviceRecord[]>([]);
  const [denials, setDenials] = useState<AccessDenialRecord[]>([]);
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (!enabled) return;
    let active = true;
    const load = async () => {
      try {
        const [nextDevices, nextDenials] = await Promise.all([
          accessDevicesApi.listDevices(),
          accessDevicesApi.listDenials(5),
        ]);
        if (!active) return;
        setDevices(nextDevices);
        setDenials(nextDenials);
        setError(undefined);
      } catch (loadError) {
        if (!active) return;
        setError(loadError instanceof Error ? loadError.message : 'Não foi possível consultar as câmeras.');
      }
    };
    void load();
    const interval = window.setInterval(() => void load(), 5000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
      <div className="flex items-center justify-between gap-2 mb-3">
        <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <ScanFace className="w-4 h-4 text-orange-600" />
          Protótipo Facial
        </h3>
        <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
          Laboratório
        </span>
      </div>

      {error && <p className="text-[11px] text-rose-700 mb-2">{error}</p>}

      {devices.length === 0 ? (
        <p className="text-[11px] text-slate-500 leading-relaxed">
          Nenhuma câmera cadastrada. Use <code className="font-mono">npm run device:register</code> e
          o agente em <code className="font-mono">edge/</code>.
        </p>
      ) : (
        <ul className="space-y-2">
          {devices.map((device) => {
            const online = Boolean(device.lastSeenAt)
              && Date.now() - Date.parse(device.lastSeenAt!) < ONLINE_WINDOW_MS;
            return (
              <li key={device.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                    <span className="truncate">{device.turnstile.name}</span>
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {device.direction === 'ENTRY' ? 'Entrada' : 'Saída'} • limiar {device.minScore.toFixed(2)}
                    {!device.active && ' • desativada'}
                  </p>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${
                  online
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-slate-100 text-slate-600 border-slate-200'
                }`}>
                  {online ? 'Lendo' : 'Sem leitura'}
                </span>
              </li>
            );
          })}
        </ul>
      )}

      {denials.length > 0 && (
        <div className="mt-3 pt-3 border-t border-slate-100">
          <p className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
            Últimas leituras negadas
          </p>
          <ul className="space-y-1.5">
            {denials.map((denial) => (
              <li key={denial.id} className="text-[11px] text-slate-700 flex justify-between gap-2">
                <span className="truncate">{DENIAL_LABELS[denial.reason]}</span>
                <span className="font-mono text-slate-500 shrink-0">
                  {Math.round(denial.matchScore * 100)}% • {formatTime(denial.occurredAt)}
                </span>
              </li>
            ))}
          </ul>
          <p className="text-[10px] text-slate-500 mt-2">
            Sem imagem armazenada. Use a passagem assistida quando necessário.
          </p>
        </div>
      )}
    </div>
  );
};
