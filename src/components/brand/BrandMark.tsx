import React from 'react';

export const BRAND_SEAL_SRC = '/apresentacao/selo-escuro.webp';

const BRAND_ARTWORK_SRC = '/apresentacao/logo-catraca-troia.webp';
const SEAL_ASPECT_RATIO = 564 / 186;

export const BrandLockup: React.FC<{ size?: number; className?: string }> = ({
  size = 34,
  className,
}) => (
  <img
    src={BRAND_SEAL_SRC}
    width={Math.round(size * SEAL_ASPECT_RATIO)}
    height={size}
    alt="Catraca de Troia"
    className={`block h-auto max-w-full shrink-0 select-none rounded-lg ${className ?? ''}`}
    draggable={false}
  />
);

export const BrandArtwork: React.FC<Pick<React.ImgHTMLAttributes<HTMLImageElement>, 'className' | 'loading'>> = ({
  className,
  loading,
}) => (
  <img
    src={BRAND_ARTWORK_SRC}
    width={708}
    height={476}
    alt="Catraca de Troia — Controle de Acesso Escolar"
    className={className}
    loading={loading}
  />
);
