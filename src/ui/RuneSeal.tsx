import { useId } from 'react';

interface RuneSealProps {
  symbol: string;
  /** Liga a animação de inscrição (a única animação marcante do jogo). */
  animate?: boolean;
  size?: number;
}

/**
 * Selo da runa. Na conquista, o anel e o símbolo são inscritos traço a traço,
 * recebem a folha de ouro e um brilho passa por cima. Com
 * `prefers-reduced-motion`, o selo aparece pronto, sem movimento.
 */
export function RuneSeal({ symbol, animate = false, size = 160 }: RuneSealProps) {
  const fontSize = symbol.length > 2 ? 46 : 64;
  // Ids únicos: vários selos convivem na mesma página.
  const uid = useId().replace(/:/g, '');
  const gold = `${uid}-gold`;
  const shine = `${uid}-shine`;
  const clip = `${uid}-clip`;
  return (
    <svg
      className={animate ? 'seal seal--animate' : 'seal'}
      width={size}
      height={size}
      viewBox="0 0 200 200"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={gold} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#d9b25a" />
          <stop offset="0.5" stopColor="#b0862b" />
          <stop offset="1" stopColor="#8a6418" />
        </linearGradient>
        <linearGradient id={shine} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fff8e0" stopOpacity="0" />
          <stop offset="0.5" stopColor="#fff8e0" stopOpacity="0.85" />
          <stop offset="1" stopColor="#fff8e0" stopOpacity="0" />
        </linearGradient>
        <clipPath id={clip}>
          <circle cx="100" cy="100" r="86" />
        </clipPath>
      </defs>
      <circle className="seal-disc" cx="100" cy="100" r="86" />
      <circle className="seal-ring" cx="100" cy="100" r="88" pathLength="100" />
      <circle className="seal-inner" cx="100" cy="100" r="72" />
      <text
        className="seal-glyph"
        style={{ fill: `url(#${gold})` }}
        x="100"
        y="104"
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={fontSize}
      >
        {symbol}
      </text>
      <g clipPath={`url(#${clip})`}>
        <rect className="seal-glint" x="-60" y="-20" width="50" height="240" fill={`url(#${shine})`} />
      </g>
    </svg>
  );
}
