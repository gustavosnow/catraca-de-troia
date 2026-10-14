import React from 'react';

interface CatracaTroiaLogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
  variant?: 'light' | 'dark' | 'contrast';
  subtitle?: string;
}

/**
 * Logotipo oficial do projeto para cabeçalhos, avatares e credenciais.
 * A arte original é horizontal e deve manter sua proporção, sem compressão em
 * uma caixa quadrada.
 */
export const CatracaTroiaLogo: React.FC<CatracaTroiaLogoProps> = ({
  className = '',
  size = 40,
  showText = false,
  variant = 'dark',
  subtitle = 'Ensino Fundamental • Rede Pública',
}) => {
  const isDark = variant === 'dark' || variant === 'contrast';
  const imageFrame = variant === 'light'
    ? 'bg-white ring-1 ring-slate-300/80'
    : variant === 'contrast'
      ? 'bg-white ring-2 ring-orange-400/70'
      : 'bg-white ring-1 ring-white/20';
  const logoWidth = Math.round(size * (1470 / 1070));

  return (
    <div className={`inline-flex items-center gap-3 shrink-0 ${className}`}>
      <span
        className={`shrink-0 inline-flex items-center justify-center overflow-hidden rounded-xl p-0.5 shadow-sm ${imageFrame}`}
        style={{ width: `${logoWidth}px`, height: `${size}px` }}
      >
        <img
          src="/logo-catraca-troia.png"
          alt="Logotipo oficial Catraca de Tróia"
          width={1470}
          height={1070}
          className="block h-full w-full object-contain select-none transition-transform duration-200 hover:scale-[1.02]"
          referrerPolicy="no-referrer"
        />
      </span>

      {/* Tipografia da Marca (Opcional) */}
      {showText && (
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5 leading-none">
            <span
              className={`font-extrabold tracking-tight text-base sm:text-lg ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}
            >
              Catraca de Tróia
            </span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-orange-500/20 text-orange-400 border border-orange-500/30 shrink-0">
              EMEF
            </span>
          </div>
          <span
            className={`text-[11px] font-medium tracking-wide mt-0.5 truncate ${
              isDark ? 'text-slate-400' : 'text-slate-500'
            }`}
          >
            {subtitle}
          </span>
        </div>
      )}
    </div>
  );
};
