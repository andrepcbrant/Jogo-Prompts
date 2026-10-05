import { parse } from '../../src/engine/parse';
import { runRule } from '../../src/engine/evaluate';
import type { RuleRef } from '../../src/engine/rules';

/** Roda uma regra isolada sobre um texto. */
export function check(ref: RuleRef, text: string) {
  return runRule(parse(text), ref);
}

/** Junta linhas com \n (deixa os textos de teste legíveis). */
export const lines = (...rows: string[]) => rows.join('\n');
