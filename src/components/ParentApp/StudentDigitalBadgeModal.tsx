import React, { useState } from 'react';
import { 
  X, 
  QrCode, 
  ShieldCheck, 
  GraduationCap, 
  Phone, 
  AlertCircle, 
  Sparkles,
  RefreshCw,
  Copy,
  Check
} from 'lucide-react';
import { Student } from '../../types';
import { CatracaTroiaLogo } from '../CatracaTroiaLogo';
import { useAccessibleDialog } from '../../hooks/useAccessibleDialog';

interface StudentDigitalBadgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student;
}

export const StudentDigitalBadgeModal: React.FC<StudentDigitalBadgeModalProps> = ({
  isOpen,
  onClose,
  student,
}) => {
  const [copied, setCopied] = useState(false);
  const [qrToken, setQrToken] = useState('TROIA-AUTH-' + Math.floor(100000 + Math.random() * 900000));
  const dialogRef = useAccessibleDialog({ isOpen, onClose });

  if (!isOpen) return null;

  const handleRefreshQr = () => {
    setQrToken('TROIA-AUTH-' + Math.floor(100000 + Math.random() * 900000));
  };

  const handleCopyMatricula = () => {
    navigator.clipboard.writeText(student.matricula);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-xs animate-in fade-in">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="student-badge-title"
        tabIndex={-1}
        className="bg-slate-900 text-white w-full max-w-xs sm:max-w-sm rounded-3xl shadow-2xl border border-slate-700/80 overflow-hidden flex flex-col relative animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-orange-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header */}
        <div className="p-4 flex items-center justify-between border-b border-slate-800 relative z-10">
          <div className="flex items-center gap-2">
            <CatracaTroiaLogo size={38} variant="dark" subtitle="EMEF Profª. Cecília Meireles" />
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar carteirinha demonstrativa"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Badge Card Container */}
        <div className="p-5 relative z-10 space-y-4">
          {/* Card Body */}
          <div className="bg-gradient-to-b from-slate-800 to-slate-850 rounded-2xl p-4 border border-slate-700 shadow-xl space-y-4">
            <div className="flex items-center gap-3">
              <img
                src={student.avatar}
                alt={student.name}
                className="w-16 h-16 rounded-xl object-cover ring-2 ring-orange-500/80 shadow-md"
                referrerPolicy="no-referrer"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-orange-500/20 text-orange-300 border border-orange-500/30">
                    Estudante Regular
                  </span>
                  {student.stage && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-700 text-slate-200">
                      {student.stage}
                    </span>
                  )}
                </div>
                <h3 id="student-badge-title" className="text-sm font-bold text-white truncate mt-1">
                  {student.name} {student.age ? `(${student.age} anos)` : ''}
                </h3>
                <div className="text-xs text-slate-300 font-medium truncate">
                  {student.turma} • Turno {student.shift}
                </div>
              </div>
            </div>

            {/* Dynamic QR Code for Turnstile Access */}
            <div className="bg-white p-3.5 rounded-xl flex flex-col items-center justify-center text-slate-900 text-center shadow-inner">
              <div className="w-36 h-36 bg-slate-100 rounded-lg p-2 flex items-center justify-center border border-slate-200 relative group">
                {/* Simulated SVG QR Code */}
                <svg viewBox="0 0 100 100" className="w-full h-full text-slate-900 fill-current">
                  <path d="M0 0h30v30H0zm5 5v20h20V5zm5 5h10v10H10zM70 0h30v30H70zm5 5v20h20V5zm5 5h10v10H80zM0 70h30v30H0zm5 5v20h20V5zm5 5h10v10H10zM40 10h10v10H40zm10 10h10v10H50zm-10 20h10v10H40zm20 0h10v10H60zm10 10h10v10H70zm-30 10h10v10H40zm20 0h10v10H60zm10 10h10v10H70zm10-20h10v10H80zm0 20h10v10H80zm-40 20h10v10H40zm20 0h10v10H60z" />
                </svg>
              </div>

              <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-600 mt-2">
                <span>Token dinâmico: {qrToken}</span>
                <button
                  type="button"
                  onClick={handleRefreshQr}
                  aria-label="Gerar novo código ilustrativo"
                  className="text-orange-600 hover:text-orange-800 p-0.5"
                  title="Atualizar QR Code"
                >
                  <RefreshCw className="w-3 h-3" />
                </button>
              </div>
              <p className="text-[9px] text-slate-400 mt-0.5">
                Válido para leitura instantânea nas catracas eletrônicas
              </p>
            </div>

            {/* Student metadata info */}
            <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-700/60">
              <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                <div className="text-[10px] text-slate-400">Matrícula EMEF</div>
                <div className="font-mono font-bold text-white flex items-center justify-between">
                  <span>{student.matricula}</span>
                  <button type="button" onClick={handleCopyMatricula} aria-label="Copiar matrícula" className="text-slate-400 hover:text-white">
                    {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-400" />}
                  </button>
                </div>
              </div>

              <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                <div className="text-[10px] text-slate-400">Crachá RFID</div>
                <div className="font-mono font-bold text-orange-400">
                  {student.rfidCard}
                </div>
              </div>
            </div>

            {/* Exit authorization & emergency */}
            <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400">Regra de Portaria:</span>
                <span className="text-[10px] font-bold text-amber-300">
                  {student.exitAuthorization ? 'Com Autorização' : 'Com Acompanhante'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400">Emergência:</span>
                <span className="font-mono text-[11px] font-semibold text-slate-200">{student.emergencyContact}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 text-center relative z-10">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold transition-colors cursor-pointer"
          >
            Fechar Carteirinha
          </button>
        </div>
      </div>
    </div>
  );
};
