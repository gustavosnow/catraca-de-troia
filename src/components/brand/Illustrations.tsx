import React from 'react';

/*
 * Ilustrações de linha no mesmo vocabulário da identidade visual:
 * traço azul-marinho de 1,6 px e nós laranja que marcam o ponto de leitura.
 * São decorativas (aria-hidden) — o texto ao lado sempre carrega o sentido.
 */

const NAVY = '#1b2a41';
const ORANGE = '#f66a0a';
const SOFT = '#fff2e8';

type IllustrationProps = { className?: string };

const Svg: React.FC<React.PropsWithChildren<{ viewBox: string; className?: string }>> = ({ viewBox, className, children }) => (
  <svg viewBox={viewBox} fill="none" aria-hidden="true" className={className} strokeLinecap="round" strokeLinejoin="round">
    {children}
  </svg>
);

/** Etapa 01 — a portaria identifica o estudante. */
export const IdentifyIllustration: React.FC<IllustrationProps> = ({ className }) => (
  <Svg viewBox="0 0 160 110" className={className}>
    <rect x="18" y="14" width="124" height="84" rx="10" fill={SOFT} />
    {/* Rosto em perfil, simplificado */}
    <path d="M70 30c-11 0-19 9-19 21 0 8 3 14 8 18l-1 11h22l1-7h5c3 0 4-2 4-4v-6l4-2-4-7c0-14-9-24-20-24Z" stroke={NAVY} strokeWidth="1.6" />
    <path d="M78 49h4" stroke={NAVY} strokeWidth="1.6" />
    {/* Malha de reconhecimento */}
    <path d="M61 45l9-5 9 6-4 10-11 1Z" stroke={ORANGE} strokeWidth="1.3" />
    {[[61, 45], [70, 40], [79, 46], [75, 56], [64, 57]].map(([x, y]) => (
      <circle key={`${x}-${y}`} cx={x} cy={y} r="2.2" fill={ORANGE} />
    ))}
    {/* Cantos do enquadramento */}
    <path d="M44 28v-6h8M96 22h8v6M44 74v6h8M104 74v6h-8" stroke={ORANGE} strokeWidth="1.8" />
    {/* Sinal de leitura */}
    <path d="M118 44a10 10 0 0 1 0 16M124 38a18 18 0 0 1 0 28" stroke={NAVY} strokeWidth="1.6" />
  </Svg>
);

/** Etapa 02 — cada passagem vira um registro. */
export const RecordIllustration: React.FC<IllustrationProps> = ({ className }) => (
  <Svg viewBox="0 0 160 110" className={className}>
    <rect x="18" y="14" width="124" height="84" rx="10" fill={SOFT} />
    {/* Catraca */}
    <path d="M34 40l14-6 14 6-14 6Z" stroke={NAVY} strokeWidth="1.6" />
    <path d="M34 40v34l14 6V46M62 40v34l-14 6" stroke={NAVY} strokeWidth="1.6" />
    <path d="M42 56l-12 6M42 56l-4 13" stroke={NAVY} strokeWidth="1.6" />
    <circle cx="42" cy="56" r="3" fill={ORANGE} />
    {/* Fluxo até o registro */}
    <path d="M66 56h14" stroke={ORANGE} strokeWidth="1.4" strokeDasharray="3 3" />
    {/* Linhas da tabela */}
    <rect x="84" y="30" width="46" height="52" rx="6" fill="#fff" stroke={NAVY} strokeWidth="1.6" />
    <path d="M84 42h46" stroke={NAVY} strokeWidth="1.2" />
    {[52, 62, 72].map((y, index) => (
      <g key={y}>
        <circle cx="92" cy={y} r="2.6" fill={index === 0 ? ORANGE : 'none'} stroke={index === 0 ? ORANGE : NAVY} strokeWidth="1.2" />
        <path d={`M99 ${y}h${index === 0 ? 22 : 17}`} stroke={NAVY} strokeWidth="1.4" />
      </g>
    ))}
    <path d="M90 36h12" stroke={NAVY} strokeWidth="1.4" />
  </Svg>
);

/** Etapa 03 — a família acompanha pelo celular. */
export const FamilyIllustration: React.FC<IllustrationProps> = ({ className }) => (
  <Svg viewBox="0 0 160 110" className={className}>
    <rect x="18" y="14" width="124" height="84" rx="10" fill={SOFT} />
    {/* Escola */}
    <path d="M30 78V52l18-12 18 12v26" stroke={NAVY} strokeWidth="1.6" />
    <path d="M26 78h44M42 78V64h12v14M48 40v-9h8" stroke={NAVY} strokeWidth="1.6" />
    <circle cx="48" cy="52" r="3.2" stroke={NAVY} strokeWidth="1.4" />
    {/* Conexão */}
    <path d="M72 58c8-10 18-10 26 0" stroke={ORANGE} strokeWidth="1.4" strokeDasharray="3 3" />
    <circle cx="85" cy="51" r="2.2" fill={ORANGE} />
    {/* Celular */}
    <rect x="102" y="28" width="30" height="54" rx="6" fill="#fff" stroke={NAVY} strokeWidth="1.6" />
    <path d="M113 33h8" stroke={NAVY} strokeWidth="1.4" />
    <rect x="107" y="42" width="20" height="14" rx="3" fill="#edf8f1" />
    <path d="M112 49l3 3 6-6" stroke="#18734b" strokeWidth="1.6" />
    <path d="M108 62h18M108 68h12" stroke={NAVY} strokeWidth="1.3" />
  </Svg>
);

/** Painel do login — portaria, malha e o registro chegando à família. */
export const GateScene: React.FC<IllustrationProps> = ({ className }) => (
  <Svg viewBox="0 0 420 300" className={className}>
    {/* Piso */}
    <path d="M30 246h360" stroke={NAVY} strokeWidth="1.4" opacity="0.35" />
    {/* Pórtico escolar */}
    <path d="M60 246V120l90-52 90 52v126" stroke={NAVY} strokeWidth="1.6" />
    <path d="M150 68V44h26" stroke={NAVY} strokeWidth="1.6" />
    <path d="M176 44l-6 4 6 4" stroke={ORANGE} strokeWidth="1.6" />
    <circle cx="150" cy="122" r="12" stroke={NAVY} strokeWidth="1.6" />
    <path d="M150 115v7l5 3" stroke={NAVY} strokeWidth="1.4" />
    <path d="M72 246v-62h36v62M192 246v-62h36v62" stroke={NAVY} strokeWidth="1.6" />
    {/* Catraca no vão central */}
    <path d="M132 198l18-8 18 8-18 8Z" stroke={NAVY} strokeWidth="1.6" />
    <path d="M132 198v40l18 8v-40M168 198v40l-18 8" stroke={NAVY} strokeWidth="1.6" />
    <path d="M141 216l-16 7M141 216l-6 17M141 216l-2-14" stroke={NAVY} strokeWidth="1.6" />
    <circle cx="141" cy="216" r="14" stroke={ORANGE} strokeWidth="1.3" strokeDasharray="3 3" />
    <circle cx="141" cy="216" r="3.6" fill={ORANGE} />
    <circle cx="125" cy="223" r="2.6" fill={ORANGE} />
    {/* Linha do registro até o celular */}
    <path d="M168 214c40 0 58-46 104-46" stroke={ORANGE} strokeWidth="1.4" strokeDasharray="4 4" />
    {[[196, 204], [226, 182], [256, 170]].map(([x, y]) => (
      <circle key={x} cx={x} cy={y} r="2.6" fill={ORANGE} />
    ))}
    {/* Celular */}
    <rect x="276" y="110" width="78" height="136" rx="14" fill="#fff" stroke={NAVY} strokeWidth="1.6" />
    <path d="M304 120h22" stroke={NAVY} strokeWidth="1.4" />
    <rect x="288" y="136" width="54" height="40" rx="7" fill="#edf8f1" />
    <path d="M302 156l7 7 14-14" stroke="#18734b" strokeWidth="1.8" />
    <path d="M288 190h46M288 202h32M288 214h40" stroke={NAVY} strokeWidth="1.4" opacity="0.7" />
  </Svg>
);

/** Estado vazio — nenhum resultado. */
export const EmptySearchIllustration: React.FC<IllustrationProps> = ({ className }) => (
  <Svg viewBox="0 0 120 88" className={className}>
    <rect x="14" y="12" width="70" height="60" rx="8" fill={SOFT} />
    <path d="M26 30h40M26 42h28M26 54h34" stroke={NAVY} strokeWidth="1.5" opacity="0.45" />
    <circle cx="80" cy="50" r="15" fill="#fff" stroke={NAVY} strokeWidth="1.6" />
    <path d="M91 61l12 12" stroke={NAVY} strokeWidth="2" />
    <circle cx="80" cy="50" r="3" fill={ORANGE} />
  </Svg>
);

/** Estado vazio — caixa de comunicados sem itens. */
export const EmptyInboxIllustration: React.FC<IllustrationProps> = ({ className }) => (
  <Svg viewBox="0 0 120 88" className={className}>
    <rect x="18" y="14" width="84" height="60" rx="8" fill={SOFT} />
    <path d="M30 46l10-18h40l10 18v16a4 4 0 0 1-4 4H34a4 4 0 0 1-4-4Z" fill="#fff" stroke={NAVY} strokeWidth="1.6" />
    <path d="M30 46h18l4 7h16l4-7h18" stroke={NAVY} strokeWidth="1.6" />
    <circle cx="60" cy="34" r="3" fill={ORANGE} />
  </Svg>
);

/** Estado vazio — tudo em ordem. */
export const AllClearIllustration: React.FC<IllustrationProps> = ({ className }) => (
  <Svg viewBox="0 0 120 88" className={className}>
    <rect x="18" y="14" width="84" height="60" rx="8" fill="#edf8f1" />
    <path d="M60 24l20 8v14c0 12-8 20-20 24-12-4-20-12-20-24V32Z" fill="#fff" stroke={NAVY} strokeWidth="1.6" />
    <path d="M51 46l6 6 12-12" stroke="#18734b" strokeWidth="2" />
    <circle cx="80" cy="32" r="3" fill={ORANGE} />
  </Svg>
);
