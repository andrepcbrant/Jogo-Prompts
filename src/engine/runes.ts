import type { Doc } from './parse';
import { DELIMITER_ROW, splitRow, tableLikeBlocks } from './parse';
import { dashHrs, isBlank } from './rules/helpers';
import { lazyQuoteLine } from './rules/quote';

export const RUNE_IDS = ['titulo', 'lista', 'enfase', 'bloco', 'divisoria', 'citacao', 'tabela'] as const;
export type RuneId = (typeof RUNE_IDS)[number];

export const RUNE_NAMES: Record<RuneId, string> = {
  titulo: 'Título',
  lista: 'Lista',
  enfase: 'Ênfase',
  bloco: 'Bloco',
  divisoria: 'Divisória',
  citacao: 'Citação',
  tabela: 'Tabela',
};

/**
 * Quais runas aparecem no texto *bem usadas*. É o critério do Oráculo:
 * não basta o símbolo existir, ele precisa cumprir a regra da runa.
 */
export function detectRunes(doc: Doc): Record<RuneId, boolean> {
  const levels = doc.headings.map((h) => h.level);
  const noSkip = levels.every((level, i) => level <= (i === 0 ? 1 : (levels[i - 1] ?? 0) + 1));
  const titulo =
    levels.filter((l) => l === 1).length === 1 && levels.filter((l) => l === 2).length >= 2 && noSkip;

  const lista = doc.lists.some((l) => l.items.length >= 2);

  const { strongCount, strongWords, totalWords, unparsedStrongLines } = doc.inline;
  const enfase =
    strongCount >= 1 && totalWords > 0 && strongWords / totalWords <= 0.1 && unparsedStrongLines.length === 0;

  const bloco =
    (doc.fences.length > 0 && doc.fences.every((f) => f.closed)) ||
    (doc.fences.length === 0 && doc.inline.codeSpans.length > 0);

  const divisoria = dashHrs(doc).some((hr) => {
    const i = hr.line - 1;
    return i > 0 && isBlank(doc.lines[i - 1]) && i < doc.lines.length - 1 && isBlank(doc.lines[i + 1]);
  });

  const citacao = doc.quotes.length > 0 && lazyQuoteLine(doc) === null;

  const tabela =
    doc.tables.length > 0 &&
    tableLikeBlocks(doc).every((block) => {
      const rows = doc.lines.slice(block.line - 1, block.endLine);
      if (!DELIMITER_ROW.test(rows[1] ?? '')) return false;
      const width = splitRow(rows[0] ?? '').length;
      return rows.every((row) => splitRow(row).length === width);
    });

  return { titulo, lista, enfase, bloco, divisoria, citacao, tabela };
}
