import type { Doc } from '../parse';
import type { RuleDef } from '../types';
import { findAnchorSpan } from '../text';
import { fail, isBlank, pass, quoted } from './helpers';

const QUOTED_LINE = /^\s{0,3}>/;

export const quotePresent: RuleDef<void> = {
  label: () => 'Uma citação com `>`',
  messages: {
    none: 'Nenhuma citação encontrada. Comece cada linha do texto de terceiros com `> ` (sinal de maior e espaço).',
  },
  check(doc) {
    return doc.quotes.length > 0 ? pass() : fail('none');
  },
};

/** Linhas que o markdown incluiu na citação sem o `>` (continuação "preguiçosa"). */
export function lazyQuoteLine(doc: Doc): number | null {
  for (const quote of doc.quotes) {
    for (let n = quote.line; n <= quote.endLine; n++) {
      const line = doc.lines[n - 1];
      if (!isBlank(line) && !QUOTED_LINE.test(line ?? '')) return n;
    }
  }
  return null;
}

export interface QuoteLinesParams {
  /** Trechos do texto citado; o intervalo vai do primeiro ao último. */
  anchors: readonly string[];
}

export const quoteAllLines: RuleDef<QuoteLinesParams> = {
  label: () => 'Todas as linhas do trecho citado começam com `>`',
  messages: {
    notQuoted:
      'O trecho {anchor} (linha {line}) não está citado. Comece cada linha dele com `> `.',
    missingPrefix:
      'A linha {line} faz parte do texto citado, mas não começa com `>`. No preview ela até parece citada, mas o modelo lê o texto cru: marque todas as linhas.',
    blankLine:
      'A linha {line} está vazia e quebra a citação em duas. Escreva só `>` nela para manter o texto inteiro na mesma citação.',
  },
  check(doc, { anchors }) {
    const spans = anchors
      .map((anchor) => ({ anchor, span: findAnchorSpan(doc.flat, anchor) }))
      .filter((a): a is { anchor: string; span: { start: number; end: number } } => a.span !== null);
    if (spans.length === 0) return pass(); // `content.preserved` cuida do que sumiu
    const start = Math.min(...spans.map((s) => s.span.start));
    const end = Math.max(...spans.map((s) => s.span.end));

    const anyQuoted = doc.lines.slice(start - 1, end).some((line) => QUOTED_LINE.test(line));
    if (!anyQuoted) {
      return fail('notQuoted', { anchor: quoted(spans[0]?.anchor ?? '') }, start);
    }
    for (let n = start; n <= end; n++) {
      const line = doc.lines[n - 1] ?? '';
      if (QUOTED_LINE.test(line)) continue;
      return fail(isBlank(line) ? 'blankLine' : 'missingPrefix', {}, n);
    }
    return pass();
  },
};
