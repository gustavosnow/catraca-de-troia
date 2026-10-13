import React from 'react';

interface CatracaTroiaLogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
  variant?: 'light' | 'dark' | 'contrast';
  subtitle?: string;
}

/**
 * CatracaTroiaLogo - Logotipo Oficial do Projeto Catraca de Tróia
 * Exibe diretamente o arquivo original da identidade visual fornecida (/logo-catraca-troia.png).
 */
export const CatracaTroiaLogo: React.FC<CatracaTroiaLogoProps> = ({
  className = '',
  size = 40,
  showText = false,
  variant = 'dark',
  subtitle = 'Ensino Fundamental • Rede Pública',
}) => {
  const isDark = variant === 'dark';

  return (
    <div className={`inline-flex items-center gap-3 shrink-0 ${className}`}>
      {/* Imagem Oficial da Identidade Visual Fornecida */}
      <img
        src="/logo-catraca-troia.png"
        alt="Logotipo Oficial Catraca de Tróia"
        width={size}
        height={size}
        style={{ width: `${size}px`, height: `${size}px` }}
        className="shrink-0 object-contain rounded-xl select-none drop-shadow-sm transition-transform duration-200 hover:scale-105"
        referrerPolicy="no-referrer"
      />

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
