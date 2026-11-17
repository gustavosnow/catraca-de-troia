import React from 'react';

/**
 * Símbolo compacto derivado da identidade visual: a catraca tripé em traço
 * azul-marinho, com o rotor e o retículo de leitura em laranja.
 */
export const BrandMark: React.FC<{ size?: number; className?: string; title?: string }> = ({
  size = 32,
  className,
  title,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 40 40"
    fill="none"
    className={className}
    role={title ? 'img' : undefined}
    aria-label={title}
    aria-hidden={title ? undefined : true}
  >
    {/* Pedestal isométrico */}
    <path d="M18 10.5 26 6.5l8 4-8 4Z" stroke="#1b2a41" strokeWidth="1.7" strokeLinejoin="round" />
    <path d="M18 10.5V29l8 4.5V14.5M34 10.5V29l-8 4.5" stroke="#1b2a41" strokeWidth="1.7" strokeLinejoin="round" />
    {/* Braços da catraca tripé */}
    <path d="M18 19.5 5.5 23M18 19.5l-6.5 10.5M18 19.5 10 11" stroke="#1b2a41" strokeWidth="1.7" strokeLinecap="round" />
    {/* Retículo de leitura */}
    <circle cx="18" cy="19.5" r="6.5" stroke="#f66a0a" strokeWidth="1.4" strokeDasharray="2.3 2.1" />
    <circle cx="18" cy="19.5" r="2.5" fill="#f66a0a" />
    <circle cx="5.5" cy="23" r="1.9" fill="#f66a0a" />
  </svg>
);

export const BrandLockup: React.FC<{ size?: number; className?: string; inverted?: boolean }> = ({
  size = 34,
  className,
  inverted,
}) => (
  <span className={`inline-flex items-center gap-2.5 ${className ?? ''}`}>
    <BrandMark size={size} />
    <span className={`flex flex-col text-[17px] font-bold leading-[1.02] tracking-tight ${inverted ? 'text-white' : 'text-ink'}`}>
      <span>Catraca</span>
      <span>de Troia</span>
    </span>
  </span>
);
