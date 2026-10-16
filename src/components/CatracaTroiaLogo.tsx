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
  showText = true,
  variant = 'dark',
  subtitle = 'Ensino Fundamental • Rede Pública',
}) => {
  const isDark = variant === 'dark' || variant === 'contrast';
  const imageFrame = variant === 'light'
    ? 'bg-white ring-1 ring-slate-300/80'
    : variant === 'contrast'
      ? 'bg-white ring-2 ring-orange-400/70'
      : 'bg-white ring-1 ring-white/20';
  const logoWidth = Math.round(size * 1.55);

  return (
    <div className={`inline-flex items-center gap-3 shrink-0 ${className}`}>
      <span
        className={`shrink-0 inline-flex items-center justify-center overflow-hidden rounded-xl shadow-lg shadow-black/20 transition-[width,height] duration-300 ${imageFrame}`}
        style={{ width: `${logoWidth}px`, height: `${size}px` }}
      >
        <img
          src="/logo-catraca-troia.png"
          alt={showText ? '' : 'Catraca de Troia'}
          width={1470}
          height={1070}
          className="block h-[128%] w-[128%] max-w-none shrink-0 select-none object-contain transition-transform duration-300 hover:scale-[1.03]"
          referrerPolicy="no-referrer"
        />
      </span>

      {/* Tipografia da Marca (Opcional) */}
      {showText && (
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5 leading-none">
            <span
              className={`font-black tracking-tight text-sm sm:text-lg ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}
            >
              Catraca de Troia
            </span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-orange-500/20 text-orange-400 border border-orange-500/30 shrink-0">
              EMEF
            </span>
          </div>
          <span
            className={`hidden text-[10px] font-medium tracking-wide mt-1 truncate sm:block sm:text-[11px] ${
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
