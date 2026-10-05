import { parse, type Doc } from './parse';
import { RULES, type RuleRef } from './rules';
import { fillTemplate } from './text';
import type { Evaluation, Outcome, RuleDef, RuleResult } from './types';

export function runRule(doc: Doc, ref: RuleRef, index = 0): RuleResult {
  // O tipo de RuleRef garante que `params` combina com a regra escolhida.
  const def = RULES[ref.rule] as RuleDef<unknown>;
  const outcome: Outcome = def.check(doc, ref.params);
  const label = ref.label ?? def.label(ref.params);
  const vars = { ...outcome.vars, line: outcome.line ?? '?' };
  const template =
    outcome.code !== undefined ? (ref.messages?.[outcome.code] ?? def.messages[outcome.code]) : undefined;
  return {
    key: `${index}:${ref.rule}`,
    ruleId: ref.rule,
    label,
    severity: ref.severity ?? 'required',
    passed: outcome.passed,
    message: outcome.passed ? label : fillTemplate(template ?? label, vars),
    line: outcome.line,
  };
}

/** Lança o feitiço: roda todas as regras e diz se as obrigatórias passaram. */
export function evaluate(rules: RuleRef[], text: string): Evaluation {
  const doc = parse(text);
  const results = rules.map((ref, i) => runRule(doc, ref, i));
  const passed = results.every((r) => r.passed || r.severity === 'advice');
  return { passed, results };
}
