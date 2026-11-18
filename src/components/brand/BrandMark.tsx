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

/** Proporção do recorte do logo oficial usado nos cabeçalhos (480 × 336). */
const OFFICIAL_LOGO_RATIO = 480 / 336;

/**
 * Logo oficial (a mesma arte de /logo-catraca-troia.png, recortada e com fundo
 * transparente) para cabeçalhos da apresentação, do login e dos portais.
 */
export const OfficialLogo: React.FC<{ height?: number; className?: string; alt?: string }> = ({
  height = 40,
  className,
  alt = '',
}) => (
  <img
    src="/logo-catraca-troia-header.png"
    width={Math.round(height * OFFICIAL_LOGO_RATIO)}
    height={height}
    alt={alt}
    className={`block shrink-0 select-none ${className ?? ''}`}
    draggable={false}
  />
);

/**
 * Assinatura da marca: logo oficial + nome. `compact` troca o logo pelo
 * símbolo simplificado, reservado a espaços pequenos onde o traço fino da arte
 * oficial não fica legível.
 */
export const BrandLockup: React.FC<{ size?: number; className?: string; inverted?: boolean; compact?: boolean }> = ({
  size = 34,
  className,
  inverted,
  compact,
}) => (
  <span className={`inline-flex items-center gap-2.5 ${className ?? ''}`}>
    {compact ? <BrandMark size={size} /> : <OfficialLogo height={size} />}
    <span className={`flex flex-col text-[17px] font-bold leading-[1.02] tracking-tight ${inverted ? 'text-white' : 'text-ink'}`}>
      <span>Catraca</span>
      <span>de Troia</span>
    </span>
  </span>
);
