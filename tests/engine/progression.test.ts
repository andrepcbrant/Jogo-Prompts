import { describe, expect, it } from 'vitest';
import { BOSS, LEVELS, MISSIONS } from '../../src/content';
import {
  emptyProgress,
  isUnlocked,
  levelStatus,
  missionState,
  pendingReward,
  recordBossCast,
  recordCast,
  REWARD_FLOOR,
  revealHint,
  totalXp,
} from '../../src/engine/progression';

const [titulo, lista] = MISSIONS;
if (!titulo || !lista) throw new Error('missões base ausentes');

describe('recompensa', () => {
  it('acerto de primeira dá base + bônus', () => {
    const { reward, firstTry, progress } = recordCast(emptyProgress(), titulo, true);
    expect(reward).toBe(150);
    expect(firstTry).toBe(true);
    expect(totalXp(progress)).toBe(150);
  });

  it('errar antes tira o bônus', () => {
    const p = recordCast(emptyProgress(), titulo, false).progress;
    expect(missionState(p, titulo.id).attempts).toBe(1);
    const second = recordCast(p, titulo, true);
    expect(second.reward).toBe(100);
    expect(second.firstTry).toBe(false);
  });

  it('dicas descontam da recompensa da missão, com piso', () => {
    let p = revealHint(emptyProgress(), titulo);
    expect(pendingReward(titulo, missionState(p, titulo.id))).toBe(140);
    p = revealHint(revealHint(p, titulo), titulo);
    p = revealHint(p, titulo); // além do número de dicas: ignorado
    expect(missionState(p, titulo.id).hintsUsed).toBe(3);
    p = recordCast(p, titulo, false).progress;
    expect(pendingReward(titulo, missionState(p, titulo.id))).toBe(Math.max(REWARD_FLOOR, 100 - 70));
  });

  it('rejogar missão concluída não dá XP', () => {
    const p = recordCast(emptyProgress(), titulo, true).progress;
    const again = recordCast(p, titulo, true);
    expect(again.reward).toBe(0);
    expect(totalXp(again.progress)).toBe(150);
  });
});

describe('desbloqueio', () => {
  it('missão só abre com os pré-requisitos concluídos', () => {
    expect(isUnlocked(emptyProgress(), titulo)).toBe(true);
    expect(isUnlocked(emptyProgress(), lista)).toBe(false);
    const p = recordCast(emptyProgress(), titulo, true).progress;
    expect(isUnlocked(p, lista)).toBe(true);
    expect(isUnlocked(p, BOSS)).toBe(false);
  });
});

describe('Oráculo', () => {
  it('dá XP só na primeira vitória', () => {
    const first = recordBossCast(emptyProgress(), BOSS, { passed: true, score: 85 });
    expect(first.reward).toBe(285);
    expect(first.newlyDefeated).toBe(true);
    const second = recordBossCast(first.progress, BOSS, { passed: true, score: 100 });
    expect(second.reward).toBe(0);
    expect(second.progress.boss.bestScore).toBe(100);
  });

  it('derrota registra tentativa sem XP', () => {
    const r = recordBossCast(emptyProgress(), BOSS, { passed: false, score: 40 });
    expect(r.reward).toBe(0);
    expect(r.progress.boss).toMatchObject({ attempts: 1, defeated: false, bestScore: 40 });
  });
});

describe('títulos da guilda', () => {
  it('sobe por XP e o último só com o Oráculo', () => {
    expect(levelStatus(LEVELS, 0, false).current.title).toBe('Aprendiz de Tinta');
    expect(levelStatus(LEVELS, 260, false).current.title).toBe('Rubricador');
    const top = levelStatus(LEVELS, 5000, false);
    expect(top.current.title).toBe('Iluminador');
    expect(top.next?.requiresBoss).toBe(true);
    expect(levelStatus(LEVELS, 10, true).current.title).toBe('Mestre Escriba');
  });

  it('calcula progresso até o próximo título', () => {
    const s = levelStatus(LEVELS, 175, false);
    expect(s.current.title).toBe('Copista');
    expect(s.progressToNext).toBeCloseTo(0.5);
  });
});
