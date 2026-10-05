import { runRule } from './evaluate';
import type { Boss } from './mission';
import { parse } from './parse';
import type { RuleResult } from './types';

export interface BossItemResult extends RuleResult {
  points: number;
  earned: number;
  mandatory: boolean;
}

export interface BossEvaluation {
  score: number;
  maxScore: number;
  passScore: number;
  /** Todos os obrigatórios cumpridos e nota mínima atingida. */
  passed: boolean;
  missingMandatory: number;
  items: BossItemResult[];
}

export function evaluateBoss(boss: Boss, text: string): BossEvaluation {
  const doc = parse(text);
  const items = boss.items.map((item, i): BossItemResult => {
    const result = runRule(doc, item.check, i);
    return {
      ...result,
      key: item.id,
      severity: 'required',
      points: item.points,
      earned: result.passed ? item.points : 0,
      mandatory: item.mandatory ?? false,
    };
  });
  const maxScore = items.reduce((sum, item) => sum + item.points, 0);
  const raw = items.reduce((sum, item) => sum + item.earned, 0);
  const score = maxScore === 0 ? 0 : Math.round((raw / maxScore) * 100);
  const missingMandatory = items.filter((i) => i.mandatory && !i.passed).length;
  return {
    score,
    maxScore: 100,
    passScore: boss.passScore,
    passed: missingMandatory === 0 && score >= boss.passScore,
    missingMandatory,
    items,
  };
}
