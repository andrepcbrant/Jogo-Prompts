import type { Doc } from './parse';

export type Severity = 'required' | 'advice';

/** O que uma regra devolve ao examinar o texto. */
export interface Outcome {
  passed: boolean;
  /** Chave da mensagem de erro (em `messages` da regra). */
  code?: string;
  vars?: Record<string, string | number>;
  line?: number;
}

export interface RuleDef<P> {
  /** Nome curto da verificação, mostrado na lista do feedback. */
  label: (params: P) => string;
  /** Mensagens de erro por código. Precisam dizer exatamente o que corrigir. */
  messages: Record<string, string>;
  check: (doc: Doc, params: P) => Outcome;
}

/** Resultado de uma verificação, pronto para a interface. */
export interface RuleResult {
  key: string;
  ruleId: string;
  label: string;
  severity: Severity;
  passed: boolean;
  message: string;
  line?: number;
}

export interface Evaluation {
  passed: boolean;
  results: RuleResult[];
}
