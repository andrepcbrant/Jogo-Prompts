import { useCallback, useEffect, useMemo, useState } from 'react';
import { BOSS, LEVELS, MISSIONS } from '../content';
import { evaluateBoss, type BossEvaluation } from '../engine/boss';
import { evaluate } from '../engine/evaluate';
import type { Mission } from '../engine/mission';
import {
  emptyProgress,
  isUnlocked,
  levelStatus,
  recordBossCast,
  recordCast,
  revealHint as revealHintPure,
  saveDraft as saveDraftPure,
  totalXp,
  type Level,
  type Progress,
} from '../engine/progression';
import type { Evaluation } from '../engine/types';
import { clearProgress, loadProgress, saveProgress, storageAvailable } from './storage';

export interface MissionCast {
  evaluation: Evaluation;
  reward: number;
  firstTry: boolean;
  newlyCompleted: boolean;
  /** Título conquistado neste lançamento, se houve subida. */
  levelUp: Level | null;
  /** Missões (e o Oráculo) que este lançamento abriu. */
  unlocked: { missions: Mission[]; boss: boolean };
}

export interface BossCast {
  evaluation: BossEvaluation;
  reward: number;
  newlyDefeated: boolean;
  levelUp: Level | null;
}

function newlyUnlocked(before: Progress, after: Progress) {
  return {
    missions: MISSIONS.filter((m) => !isUnlocked(before, m) && isUnlocked(after, m)),
    boss: !isUnlocked(before, BOSS) && isUnlocked(after, BOSS),
  };
}

function levelOf(progress: Progress): Level {
  return levelStatus(LEVELS, totalXp(progress), progress.boss.defeated).current;
}

export function useGame() {
  const [progress, setProgress] = useState<Progress>(() => loadProgress());
  const [canSave] = useState(() => storageAvailable());

  useEffect(() => {
    saveProgress(progress);
  }, [progress]);

  const xp = totalXp(progress);
  const level = useMemo(() => levelStatus(LEVELS, xp, progress.boss.defeated), [xp, progress.boss.defeated]);

  const castMission = useCallback(
    (mission: Mission, text: string): MissionCast => {
      const evaluation = evaluate(mission.rules, text);
      const outcome = recordCast(progress, mission, evaluation.passed);
      const before = levelOf(progress);
      const after = levelOf(outcome.progress);
      setProgress(saveDraftPure(outcome.progress, mission.id, text));
      return {
        evaluation,
        reward: outcome.reward,
        firstTry: outcome.firstTry,
        newlyCompleted: outcome.newlyCompleted,
        levelUp: after.title !== before.title ? after : null,
        unlocked: newlyUnlocked(progress, outcome.progress),
      };
    },
    [progress],
  );

  const castBoss = useCallback(
    (text: string): BossCast => {
      const evaluation = evaluateBoss(BOSS, text);
      const outcome = recordBossCast(progress, BOSS, evaluation);
      const before = levelOf(progress);
      const after = levelOf(outcome.progress);
      setProgress(saveDraftPure(outcome.progress, BOSS.id, text));
      return {
        evaluation,
        reward: outcome.reward,
        newlyDefeated: outcome.newlyDefeated,
        levelUp: after.title !== before.title ? after : null,
      };
    },
    [progress],
  );

  const revealHint = useCallback((mission: Mission) => {
    setProgress((p) => revealHintPure(p, mission));
  }, []);

  const saveDraft = useCallback((id: string, text: string) => {
    setProgress((p) => saveDraftPure(p, id, text));
  }, []);

  const reset = useCallback(() => {
    clearProgress();
    setProgress(emptyProgress());
  }, []);

  return { progress, xp, level, canSave, castMission, castBoss, revealHint, saveDraft, reset };
}

export type Game = ReturnType<typeof useGame>;
