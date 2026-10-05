import { BOSS, MISSIONS } from '../content';
import {
  BOSS_ROOM,
  corridor,
  DUNGEON_NARROW,
  DUNGEON_WIDE,
  edgesOf,
  type DungeonLayout,
  type RoomPlacement,
} from '../content/dungeon';
import type { Mission } from '../engine/mission';
import { isCompleted, isUnlocked, missionState, type Progress } from '../engine/progression';
import { RUNE_NAMES } from '../engine/runes';
import { hrefFor } from '../state/useHashRoute';
import { RuneSeal } from './RuneSeal';
import { OracleEye, Scribe, Torch } from './sprites';

/** Proporção de cada célula da planta (largura x altura), em unidades do SVG. */
const CELLS = { wide: { w: 10, h: 8 }, narrow: { w: 10, h: 12 } } as const;

const nameOf = (id: string) => MISSIONS.find((m) => m.id === id)?.rune.name ?? id;

export function MapView({ progress }: { progress: Progress }) {
  const learned = MISSIONS.filter((m) => isCompleted(progress, m.id)).length;
  // O escriba fica na primeira sala aberta ainda não vencida.
  const current =
    MISSIONS.find((m) => isUnlocked(progress, m) && !isCompleted(progress, m.id))?.id ??
    (isUnlocked(progress, BOSS) && !progress.boss.defeated ? BOSS_ROOM : null);

  return (
    <main id="conteudo" className="map">
      <section className="map-intro">
        <h1 className="page-title">A Masmorra das Runas</h1>
        <p className="lede">
          Bem-vindo à Guilda dos Escribas. Aqui, prompts são feitiços, e cada símbolo de markdown é uma runa: muda o
          jeito como o Oráculo lê o que você escreve. Cada sala guarda uma runa. Vença as sete e desça até o salão do
          Oráculo Confuso.
        </p>
        <p className="map-status">
          {learned === 0
            ? 'Comece pela Sala do Título, na entrada. As outras portas se abrem conforme você avança.'
            : `${learned} de ${MISSIONS.length} runas aprendidas.`}
        </p>
      </section>

      <nav aria-label="Salas da masmorra" className="dungeon">
        <DungeonPlan layout={DUNGEON_WIDE} progress={progress} current={current} variant="wide" />
        <DungeonPlan layout={DUNGEON_NARROW} progress={progress} current={current} variant="narrow" />
      </nav>
    </main>
  );
}

interface PlanProps {
  layout: DungeonLayout;
  progress: Progress;
  current: string | null;
  variant: 'wide' | 'narrow';
}

/** Uma planta da masmorra. As duas existem no DOM; o CSS mostra uma conforme a largura da tela. */
function DungeonPlan({ layout, progress, current, variant }: PlanProps) {
  const CELL = CELLS[variant];
  const width = layout.cols * CELL.w;
  const height = layout.rows * CELL.h;
  const edges = edgesOf(layout, MISSIONS);
  const scale = (p: { x: number; y: number }) => `${p.x * CELL.w},${p.y * CELL.h}`;
  const opened = (id: string) => (id === BOSS_ROOM ? progress.boss.defeated : isCompleted(progress, id));

  const rooms = Object.entries(layout.rooms);

  return (
    <div className={`plan plan--${variant}`} style={{ aspectRatio: `${width} / ${height}` }}>
      <svg className="plan-corridors" viewBox={`0 0 ${width} ${height}`} aria-hidden="true" focusable="false">
        {edges.map((edge) => {
          const from = layout.rooms[edge.from];
          const to = layout.rooms[edge.to];
          if (!from || !to) return null;
          const points = corridor(from, to).map(scale).join(' ');
          const lit = opened(edge.from);
          return (
            <g key={`${edge.from}-${edge.to}`} className={lit ? 'corridor corridor--lit' : 'corridor'}>
              <polyline className="corridor-wall" points={points} />
              <polyline className="corridor-floor" points={points} />
            </g>
          );
        })}
      </svg>

      <ul className="plan-rooms">
        {rooms.map(([id, place]) => (
          <li key={id} className="plan-slot" style={slotStyle(place, layout)}>
            {id === BOSS_ROOM ? (
              <BossRoom progress={progress} here={current === BOSS_ROOM} compact={variant === 'narrow'} />
            ) : (
              <RuneRoom
                mission={MISSIONS.find((m) => m.id === id) as Mission}
                progress={progress}
                here={current === id}
                compact={variant === 'narrow'}
              />
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function slotStyle(place: RoomPlacement, layout: DungeonLayout): React.CSSProperties {
  return {
    left: `${(place.col / layout.cols) * 100}%`,
    top: `${(place.row / layout.rows) * 100}%`,
    width: `${((place.span ?? 1) / layout.cols) * 100}%`,
    height: `${(1 / layout.rows) * 100}%`,
  };
}

interface RoomProps {
  progress: Progress;
  here: boolean;
  /** Planta estreita (celular): nome curto e status de uma palavra. */
  compact: boolean;
}

function RuneRoom({ mission, progress, here, compact }: RoomProps & { mission: Mission }) {
  const state = missionState(progress, mission.id);
  const open = isUnlocked(progress, mission);
  const glyph = mission.rune.symbols[0] ?? '?';
  const name = compact ? (
    <span className="room-name">
      <span aria-hidden="true">{RUNE_NAMES[mission.rune.id]}</span>
      <span className="visually-hidden">{mission.rune.name}</span>
    </span>
  ) : (
    <span className="room-name">{mission.rune.name}</span>
  );

  if (!open) {
    return (
      <div className="room room--locked" aria-disabled="true">
        <span className="room-glyph" aria-hidden="true">
          {glyph}
        </span>
        {name}
        <span className="room-meta">
          {compact ? 'Trancada' : `Trancada · requer ${mission.requires.map(nameOf).join(', ')}`}
          {compact && <span className="visually-hidden">: requer {mission.requires.map(nameOf).join(', ')}</span>}
        </span>
      </div>
    );
  }

  return (
    <a
      className={state.completed ? 'room room--done' : 'room room--open'}
      href={hrefFor({ name: 'mission', id: mission.id })}
    >
      <Torch className="room-torch room-torch--left" size={22} />
      <Torch className="room-torch room-torch--right" size={22} />
      {state.completed ? (
        <span className="room-seal">
          <RuneSeal symbol={glyph} size={40} />
        </span>
      ) : (
        <span className="room-glyph" aria-hidden="true">
          {glyph}
        </span>
      )}
      {name}
      <span className="room-meta">
        {compact
          ? state.completed
            ? `${state.xpEarned} XP`
            : 'Aberta'
          : state.completed
            ? `Aprendida · ${state.xpEarned} XP${state.firstTry ? ' · de primeira' : ''}`
            : `Aberta · até ${mission.xp.base + mission.xp.firstTryBonus} XP`}
      </span>
      {here && (
        <span className="room-here">
          <Scribe size={compact ? 24 : 30} />
          <span className="visually-hidden">Você está aqui.</span>
        </span>
      )}
    </a>
  );
}

function BossRoom({ progress, here, compact }: RoomProps) {
  const open = isUnlocked(progress, BOSS);
  const learned = MISSIONS.filter((m) => isCompleted(progress, m.id)).length;

  if (!open) {
    return (
      <div className="room room--boss room--locked" aria-disabled="true">
        <OracleEye className="room-eye" size={44} />
        <span className="room-name">{BOSS.name}</span>
        <span className="room-meta">
          {compact ? `Selado · ${learned}/7 runas` : `Selado até você aprender as 7 runas (${learned}/7)`}
        </span>
      </div>
    );
  }

  return (
    <a className="room room--boss room--open" href={hrefFor({ name: 'boss' })}>
      <Torch className="room-torch room-torch--left" size={26} />
      <Torch className="room-torch room-torch--right" size={26} />
      <OracleEye className="room-eye" size={52} />
      <span className="room-name">{BOSS.name}</span>
      <span className="room-meta">
        {progress.boss.defeated ? `Vencido · melhor nota ${progress.boss.bestScore}` : 'Chefe final · desafiar'}
      </span>
      {here && (
        <span className="room-here">
          <Scribe size={compact ? 24 : 30} />
          <span className="visually-hidden">Você está aqui.</span>
        </span>
      )}
    </a>
  );
}
