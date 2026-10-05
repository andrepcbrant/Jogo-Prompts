import { detectRunes, RUNE_IDS, RUNE_NAMES } from '../runes';
import type { RuleDef, Severity } from '../types';
import * as code from './code';
import * as content from './content';
import * as divider from './divider';
import * as emphasis from './emphasis';
import * as headings from './headings';
import { fail, joinPt, pass } from './helpers';
import * as lists from './lists';
import * as quote from './quote';
import * as table from './table';

export interface RunesUsedParams {
  min: number;
}

const runesUsed: RuleDef<RunesUsedParams> = {
  label: ({ min }) => `Pelo menos ${min} das 7 runas bem usadas`,
  messages: {
    few: 'Você usou bem {count} de 7 runas ({used}). São necessárias pelo menos {min}. Ainda dá para usar: {missing}.',
  },
  check(doc, { min }) {
    const found = detectRunes(doc);
    const used = RUNE_IDS.filter((id) => found[id]);
    if (used.length >= min) return pass();
    const missing = RUNE_IDS.filter((id) => !found[id]);
    return fail('few', {
      count: used.length,
      used: used.length === 0 ? 'nenhuma' : joinPt(used.map((id) => RUNE_NAMES[id])),
      min,
      missing: joinPt(missing.map((id) => RUNE_NAMES[id])),
    });
  },
};

/**
 * Catálogo de regras. A chave é o id usado nos arquivos de missão; o tipo do
 * valor define os parâmetros aceitos (o editor autocompleta e acusa erro).
 */
export const RULES = {
  'content.preserved': content.preserved,
  'content.inSection': content.inSection,
  'content.mentions': content.mentions,

  'heading.syntax': headings.headingSyntax,
  'heading.h1.exactlyOne': headings.h1ExactlyOne,
  'heading.minCount': headings.headingMinCount,
  'heading.noSkippedLevels': headings.noSkippedLevels,
  'heading.requiredSections': headings.requiredSections,

  'list.syntax': lists.listSyntax,
  'list.ordered': lists.orderedSteps,
  'list.bullet': lists.bulletItems,
  'list.bulletMarker': lists.bulletMarker,

  'emphasis.syntax': emphasis.emphasisSyntax,
  'emphasis.boldMin': emphasis.boldMin,
  'emphasis.boldMaxRatio': emphasis.boldMaxRatio,
  'emphasis.boldTargets': emphasis.boldTargets,

  'code.fenceClosed': code.fenceClosed,
  'code.fenced': code.fenced,
  'code.inline': code.inlineCode,

  'hr.present': divider.hrPresent,
  'hr.notSetext': divider.hrNotSetext,
  'hr.blankAround': divider.hrBlankAround,
  'hr.between': divider.hrBetween,

  'quote.present': quote.quotePresent,
  'quote.allLinesPrefixed': quote.quoteAllLines,

  'table.present': table.tablePresent,
  'table.delimiterRow': table.tableDelimiterRow,
  'table.consistentColumns': table.tableConsistentColumns,
  'table.noStrayPipe': table.tableNoStrayPipe,
  'table.contains': table.tableContains,

  'runes.used': runesUsed,
} as const;

export type RuleId = keyof typeof RULES;

type ParamsOf<K extends RuleId> = (typeof RULES)[K] extends RuleDef<infer P> ? P : never;

interface RefBase {
  /** `required` (padrão) bloqueia o feitiço; `advice` só aconselha. */
  severity?: Severity;
  /** Troca o nome curto da verificação mostrado ao jogador. */
  label?: string;
  /** Sobrescreve mensagens da regra (mesmas chaves, mesmo formato). */
  messages?: Record<string, string>;
}

/** Referência a uma regra dentro de uma missão. */
export type RuleRef = {
  [K in RuleId]: ParamsOf<K> extends void
    ? RefBase & { rule: K; params?: undefined }
    : RefBase & { rule: K; params: ParamsOf<K> };
}[RuleId];
