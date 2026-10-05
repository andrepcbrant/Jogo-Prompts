/*
 * Sprites em pixel art desenhados como SVG: cada caractere do mapa é um pixel.
 * Ficam estáticos; a única animação do jogo continua sendo o selo da runa.
 */

type Palette = Record<string, string>;

function Pixels({ rows, palette, size, className }: { rows: string[]; palette: Palette; size: number; className?: string }) {
  const width = Math.max(...rows.map((r) => r.length));
  const rects: React.ReactNode[] = [];
  rows.forEach((row, y) => {
    [...row].forEach((ch, x) => {
      const fill = palette[ch];
      if (fill) rects.push(<rect key={`${x}-${y}`} x={x} y={y} width={1.02} height={1.02} fill={fill} />);
    });
  });
  return (
    <svg
      className={className}
      viewBox={`0 0 ${width} ${rows.length}`}
      width={(size * width) / rows.length}
      height={size}
      shapeRendering="crispEdges"
      aria-hidden="true"
      focusable="false"
    >
      {rects}
    </svg>
  );
}

const TORCH = [
  '...y...',
  '..yoy..',
  '..ooy..',
  '.orroo.',
  '.orrro.',
  '..rrr..',
  '.bmmmb.',
  '.bbbbb.',
  '..bwb..',
  '..bwb..',
  '..bwb..',
  '..bwb..',
  '...b...',
];

const TORCH_COLORS: Palette = {
  y: '#ffe9a3',
  o: '#ffb24a',
  r: '#e8642c',
  m: '#6b6f78',
  b: '#3a2a20',
  w: '#7a4e2e',
};

export function Torch({ size = 40, className }: { size?: number; className?: string }) {
  return <Pixels rows={TORCH} palette={TORCH_COLORS} size={size} className={className} />;
}

const SCRIBE = [
  '....hhhh....',
  '...hhhhhh...',
  '..hhssssh...',
  '..hseesesh..',
  '..hssssssh..',
  '...hhhhhh..q',
  '..rrrrrrrr.q',
  '.rrrrggrrrrq',
  '.rr.rggr.rs.',
  '.rr.rrrr....',
  '..rrrrrrr...',
  '..rrrrrrr...',
  '..rr...rr...',
  '..kk...kk...',
];

const SCRIBE_COLORS: Palette = {
  h: '#2f4f86',
  s: '#f0c79a',
  e: '#1a120d',
  r: '#3e64a8',
  g: '#f2c14e',
  q: '#f1e3c8',
  k: '#1a120d',
};

/** O escriba (o jogador), parado na sala da próxima missão. */
export function Scribe({ size = 36, className }: { size?: number; className?: string }) {
  return <Pixels rows={SCRIBE} palette={SCRIBE_COLORS} size={size} className={className} />;
}

const EYE = [
  '...pppppp...',
  '.pp......pp.',
  'p...wwww...p',
  'p..wwiiww..p',
  'p..wiikiw..p',
  'p..wwiiww..p',
  'p...wwww...p',
  '.pp......pp.',
  '...pppppp...',
];

const EYE_COLORS: Palette = {
  p: '#b06ad9',
  w: '#f1e3c8',
  i: '#e8642c',
  k: '#1a120d',
};

/** O Oráculo Confuso: um olho que tudo lê e pouco entende. */
export function OracleEye({ size = 36, className }: { size?: number; className?: string }) {
  return <Pixels rows={EYE} palette={EYE_COLORS} size={size} className={className} />;
}
