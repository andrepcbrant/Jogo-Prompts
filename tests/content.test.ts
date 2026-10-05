import { describe, expect, it } from 'vitest';
import { BOSS, LEVELS, MISSIONS } from '../src/content';
import { evaluateBoss } from '../src/engine/boss';
import { evaluate } from '../src/engine/evaluate';
import { RULES } from '../src/engine/rules';
import { RUNE_IDS } from '../src/engine/runes';

/*
 * Rede de segurança para quem escreve missões: se uma missão nova estiver
 * quebrada (solução que não passa, texto inicial que já passa, pré-requisito
 * inexistente), este teste acusa antes de publicar.
 */

const ids = MISSIONS.map((m) => m.id);

describe('conteúdo: estrutura', () => {
  it('ids de missão são únicos', () => {
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('cada runa aparece em exatamente uma missão e todas as 7 existem', () => {
    const runes = MISSIONS.map((m) => m.rune.id).sort();
    expect(runes).toEqual([...RUNE_IDS].sort());
  });

  it('pré-requisitos apontam para missões existentes e não formam ciclo', () => {
    for (const mission of MISSIONS) {
      for (const req of mission.requires) expect(ids, `${mission.id} requer ${req}`).toContain(req);
    }
    for (const req of BOSS.requires) expect(ids).toContain(req);

    const visiting = new Set<string>();
    const done = new Set<string>();
    const visit = (id: string) => {
      if (done.has(id)) return;
      if (visiting.has(id)) throw new Error(`ciclo de pré-requisitos em ${id}`);
      visiting.add(id);
      MISSIONS.find((m) => m.id === id)?.requires.forEach(visit);
      visiting.delete(id);
      done.add(id);
    };
    ids.forEach(visit);
    expect(MISSIONS.some((m) => m.requires.length === 0)).toBe(true);
  });

  it('toda regra referenciada existe', () => {
    const refs = [...MISSIONS.flatMap((m) => m.rules), ...BOSS.items.map((i) => i.check)];
    for (const ref of refs) expect(Object.keys(RULES)).toContain(ref.rule);
  });

  it('toda missão tem dicas com custo positivo e verbete no grimório', () => {
    for (const mission of MISSIONS) {
      expect(mission.hints.length, mission.id).toBeGreaterThan(0);
      for (const hint of mission.hints) expect(hint.cost).toBeGreaterThan(0);
      expect(mission.grimoire.syntax.length).toBeGreaterThan(0);
    }
  });

  it('títulos da guilda estão em ordem crescente de XP', () => {
    const byXp = LEVELS.filter((l) => !l.requiresBoss).map((l) => l.minXp);
    expect(byXp).toEqual([...byXp].sort((a, b) => a - b));
    expect(byXp[0]).toBe(0);
  });
});

describe.each(MISSIONS.map((m) => [m.id, m] as const))('missão %s', (_id, mission) => {
  it('a solução de referência passa em todas as regras, inclusive conselhos', () => {
    const result = evaluate(mission.rules, mission.referenceSolution);
    const failures = result.results.filter((r) => !r.passed).map((r) => r.message);
    expect(failures).toEqual([]);
  });

  it('o texto inicial falha em pelo menos uma regra obrigatória', () => {
    const result = evaluate(mission.rules, mission.starter);
    expect(result.passed).toBe(false);
  });

  it('todas as mensagens de erro têm as variáveis preenchidas', () => {
    const result = evaluate(mission.rules, mission.starter);
    for (const r of result.results) expect(r.message).not.toMatch(/\{\w+\}/);
  });
});

describe('Oráculo Confuso', () => {
  it('a solução de referência vence com nota máxima', () => {
    const result = evaluateBoss(BOSS, BOSS.referenceSolution);
    const failures = result.items.filter((i) => !i.passed).map((i) => i.message);
    expect(failures).toEqual([]);
    expect(result.score).toBe(100);
    expect(result.passed).toBe(true);
  });

  it('o pedido em texto corrido não vence', () => {
    const result = evaluateBoss(BOSS, BOSS.starter);
    expect(result.passed).toBe(false);
    expect(result.missingMandatory).toBeGreaterThan(0);
  });

  it('pontos somam 100', () => {
    expect(BOSS.items.reduce((sum, i) => sum + i.points, 0)).toBe(100);
  });
});
