/**
 * Planta da masmorra: onde fica a sala de cada runa, numa grade de células.
 * Há uma planta larga (desktop) e uma estreita (celular). Os corredores saem
 * dos pré-requisitos das missões: descem pela coluna da sala de origem e
 * depois seguem na horizontal até a sala de destino. Por isso, ao mudar a
 * planta, confira que nenhum corredor atravessa outra sala (o teste de
 * conteúdo verifica).
 */

export interface RoomPlacement {
  col: number;
  row: number;
  /** Quantas colunas a sala ocupa (o salão do Oráculo é mais largo). */
  span?: number;
}

export interface DungeonLayout {
  cols: number;
  rows: number;
  rooms: Record<string, RoomPlacement>;
  /** Salas ligadas ao salão do Oráculo por corredor. */
  bossLinks: string[];
}

export const BOSS_ROOM = 'oraculo';

export const DUNGEON_WIDE: DungeonLayout = {
  cols: 5,
  rows: 4,
  rooms: {
    'runa-titulo': { col: 2, row: 0 },
    'runa-lista': { col: 0, row: 1 },
    'runa-enfase': { col: 1, row: 1 },
    'runa-bloco': { col: 3, row: 1 },
    'runa-divisoria': { col: 4, row: 1 },
    'runa-tabela': { col: 0, row: 2 },
    'runa-citacao': { col: 4, row: 2 },
    [BOSS_ROOM]: { col: 1, row: 3, span: 3 },
  },
  bossLinks: ['runa-tabela', 'runa-enfase', 'runa-bloco', 'runa-citacao'],
};

export const DUNGEON_NARROW: DungeonLayout = {
  cols: 3,
  rows: 5,
  rooms: {
    'runa-titulo': { col: 1, row: 0 },
    'runa-lista': { col: 0, row: 1 },
    'runa-divisoria': { col: 2, row: 1 },
    'runa-tabela': { col: 0, row: 2 },
    'runa-citacao': { col: 2, row: 2 },
    'runa-enfase': { col: 0, row: 3 },
    'runa-bloco': { col: 2, row: 3 },
    [BOSS_ROOM]: { col: 0, row: 4, span: 3 },
  },
  bossLinks: ['runa-enfase', 'runa-bloco'],
};

export interface Point {
  x: number;
  y: number;
}

/** Centro de uma sala, em unidades de célula (0.5 = meio da primeira célula). */
export function roomCenter(room: RoomPlacement): Point {
  return { x: room.col + (room.span ?? 1) / 2, y: room.row + 0.5 };
}

/**
 * Corredor entre duas salas: sai da origem, segue até a borda de cima da
 * fileira de destino (o vão entre as fileiras), anda na horizontal por esse
 * vão e entra na sala de destino. Assim não atravessa outras salas.
 */
export function corridor(from: RoomPlacement, to: RoomPlacement): Point[] {
  const a = roomCenter(from);
  const left = to.col + 0.5;
  const right = to.col + (to.span ?? 1) - 0.5;
  // Numa sala larga, entra pela coluna mais próxima da origem.
  const b = { x: Math.min(Math.max(a.x, left), right), y: to.row + 0.5 };
  if (a.x === b.x) return [a, b];
  const gap = to.row;
  return [a, { x: a.x, y: gap }, { x: b.x, y: gap }, b];
}

export interface Edge {
  from: string;
  to: string;
}

/** Todas as ligações da planta: pré-requisitos + entradas do salão do Oráculo. */
export function edgesOf(layout: DungeonLayout, missions: { id: string; requires: string[] }[]): Edge[] {
  const edges: Edge[] = [];
  for (const mission of missions) {
    for (const req of mission.requires) edges.push({ from: req, to: mission.id });
  }
  for (const id of layout.bossLinks) edges.push({ from: id, to: BOSS_ROOM });
  return edges;
}
