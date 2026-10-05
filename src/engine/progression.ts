import type { Boss, Mission } from './mission';

/** Recompensa mínima de uma missão, mesmo pedindo todas as dicas. */
export const REWARD_FLOOR = 25;

export interface MissionState {
  attempts: number;
  hintsUsed: number;
  completed: boolean;
  firstTry: boolean;
  xpEarned: number;
}

export interface BossState {
  attempts: number;
  defeated: boolean;
  bestScore: number;
  xpEarned: number;
}

export interface Progress {
  version: 1;
  missions: Record<string, MissionState>;
  boss: BossState;
  /** Último texto do editor em cada missão (e no Oráculo). */
  drafts: Record<string, string>;
}

export interface Level {
  title: string;
  description: string;
  minXp: number;
  /** Título concedido só ao vencer o Oráculo, independente do XP. */
  requiresBoss?: boolean;
}

export const emptyMissionState = (): MissionState => ({
  attempts: 0,
  hintsUsed: 0,
  completed: false,
  firstTry: false,
  xpEarned: 0,
});

export const emptyProgress = (): Progress => ({
  version: 1,
  missions: {},
  boss: { attempts: 0, defeated: false, bestScore: 0, xpEarned: 0 },
  drafts: {},
});

export function missionState(progress: Progress, id: string): MissionState {
  return progress.missions[id] ?? emptyMissionState();
}

export function isCompleted(progress: Progress, id: string): boolean {
  return missionState(progress, id).completed;
}

export function isUnlocked(progress: Progress, item: { requires: string[] }): boolean {
  return item.requires.every((id) => isCompleted(progress, id));
}

export function hintCost(mission: Mission, hintsUsed: number): number {
  return mission.hints.slice(0, hintsUsed).reduce((sum, h) => sum + h.cost, 0);
}

/** XP que a missão daria agora, se o próximo lançamento passar. */
export function pendingReward(mission: Mission, state: MissionState): number {
  if (state.completed) return 0;
  const bonus = state.attempts === 0 ? mission.xp.firstTryBonus : 0;
  return Math.max(REWARD_FLOOR, mission.xp.base + bonus - hintCost(mission, state.hintsUsed));
}

export interface CastOutcome {
  progress: Progress;
  /** XP ganho neste lançamento (0 se falhou ou se a missão já estava concluída). */
  reward: number;
  firstTry: boolean;
  newlyCompleted: boolean;
}

export function recordCast(progress: Progress, mission: Mission, passed: boolean): CastOutcome {
  const before = missionState(progress, mission.id);
  if (before.completed) {
    return { progress, reward: 0, firstTry: false, newlyCompleted: false };
  }
  const reward = passed ? pendingReward(mission, before) : 0;
  const firstTry = passed && before.attempts === 0;
  const after: MissionState = {
    ...before,
    attempts: before.attempts + 1,
    completed: passed,
    firstTry,
    xpEarned: reward,
  };
  return {
    progress: { ...progress, missions: { ...progress.missions, [mission.id]: after } },
    reward,
    firstTry,
    newlyCompleted: passed,
  };
}

export function revealHint(progress: Progress, mission: Mission): Progress {
  const state = missionState(progress, mission.id);
  if (state.hintsUsed >= mission.hints.length) return progress;
  return {
    ...progress,
    missions: {
      ...progress.missions,
      [mission.id]: { ...state, hintsUsed: state.hintsUsed + 1 },
    },
  };
}

export interface BossCastOutcome {
  progress: Progress;
  reward: number;
  newlyDefeated: boolean;
}

/** XP do Oráculo: base + a nota (0 a 100), só na primeira vitória. */
export function recordBossCast(
  progress: Progress,
  boss: Boss,
  result: { passed: boolean; score: number },
): BossCastOutcome {
  const before = progress.boss;
  const newlyDefeated = result.passed && !before.defeated;
  const reward = newlyDefeated ? boss.xp.base + result.score : 0;
  return {
    progress: {
      ...progress,
      boss: {
        attempts: before.attempts + 1,
        defeated: before.defeated || result.passed,
        bestScore: Math.max(before.bestScore, result.score),
        xpEarned: before.xpEarned + reward,
      },
    },
    reward,
    newlyDefeated,
  };
}

export function totalXp(progress: Progress): number {
  const missions = Object.values(progress.missions).reduce((sum, m) => sum + m.xpEarned, 0);
  return missions + progress.boss.xpEarned;
}

export interface LevelStatus {
  current: Level;
  next: Level | null;
  /** 0 a 1: quanto falta para o próximo título por XP. */
  progressToNext: number;
}

export function levelStatus(levels: Level[], xp: number, bossDefeated: boolean): LevelStatus {
  const reached = levels.filter((l) => (l.requiresBoss ? bossDefeated : xp >= l.minXp));
  const current = reached[reached.length - 1] ?? levels[0];
  if (!current) throw new Error('Nenhum título da guilda configurado.');
  const next = levels[levels.indexOf(current) + 1] ?? null;
  let progressToNext = 1;
  if (next && !next.requiresBoss) {
    progressToNext = Math.min(1, (xp - current.minXp) / (next.minXp - current.minXp));
  }
  return { current, next, progressToNext };
}

export function saveDraft(progress: Progress, id: string, text: string): Progress {
  if (progress.drafts[id] === text) return progress;
  return { ...progress, drafts: { ...progress.drafts, [id]: text } };
}
