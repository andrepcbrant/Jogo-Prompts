/**
 * Comparação tolerante de trechos (âncoras): ignora maiúsculas, acentos,
 * espaços repetidos, quebras de linha e os símbolos de markdown que o
 * jogador acrescenta ao reorganizar o texto.
 */

/** Marcadores de início de linha: citação, título e item de lista. */
const LINE_PREFIX = /^\s{0,3}(?:>\s?)*\s*(?:#{1,6}\s+|[-*+]\s+|\d{1,9}[.)]\s+)?/;
/** Símbolos de ênfase, código e escape que não mudam o conteúdo. */
const INLINE_MARKUP = /[*_`\\]/g;

function foldChar(ch: string): string {
  return ch.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
}

/** Normaliza um trecho solto (sem tratar prefixos de linha). */
export function normalizeText(text: string): string {
  let out = '';
  for (const ch of text.replace(INLINE_MARKUP, '').replace(/\|/g, ' ')) {
    const folded = foldChar(ch);
    if (/\s/.test(folded)) {
      if (out.length > 0 && !out.endsWith(' ')) out += ' ';
    } else {
      out += folded;
    }
  }
  return out.trim();
}

export interface FlatText {
  /** Texto do documento inteiro normalizado, numa linha só. */
  text: string;
  /** Para cada caractere de `text`, a linha (1-based) de origem. */
  lineOf: number[];
}

export function buildFlatText(lines: string[]): FlatText {
  let text = '';
  const lineOf: number[] = [];
  lines.forEach((raw, i) => {
    const lineNumber = i + 1;
    const body = raw.replace(LINE_PREFIX, '');
    const normalized = normalizeText(body);
    if (normalized.length === 0) return;
    if (text.length > 0) {
      text += ' ';
      lineOf.push(lineNumber);
    }
    for (const ch of normalized) {
      text += ch;
      lineOf.push(lineNumber);
    }
  });
  return { text, lineOf };
}

/** Linha (1-based) onde o trecho começa, ou null se não existir. */
export function findAnchorLine(flat: FlatText, anchor: string): number | null {
  const needle = normalizeText(anchor);
  if (needle.length === 0) return null;
  const at = flat.text.indexOf(needle);
  if (at < 0) return null;
  return flat.lineOf[at] ?? null;
}

/** Linhas (1-based) que o trecho ocupa, ou null se não existir. */
export function findAnchorSpan(
  flat: FlatText,
  anchor: string,
): { start: number; end: number } | null {
  const needle = normalizeText(anchor);
  if (needle.length === 0) return null;
  const at = flat.text.indexOf(needle);
  if (at < 0) return null;
  const start = flat.lineOf[at];
  const end = flat.lineOf[at + needle.length - 1];
  if (start === undefined || end === undefined) return null;
  return { start, end };
}

/** Compara nomes (títulos de seção, linguagens) de forma tolerante. */
export function sameName(a: string, b: string): boolean {
  return normalizeText(a) === normalizeText(b);
}

export function countWords(text: string): number {
  return text.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
}

export function fillTemplate(
  template: string,
  vars: Record<string, string | number> = {},
): string {
  return template.replace(/\{(\w+)\}/g, (whole, key: string) =>
    key in vars ? String(vars[key]) : whole,
  );
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** O texto normalizado contém o termo como palavra inteira ("real" não casa com "realizar"). */
export function containsTerm(flat: FlatText, term: string): boolean {
  const needle = normalizeText(term);
  if (needle.length === 0) return false;
  const pattern = new RegExp(`(?:^|[^\\p{L}\\p{N}])${escapeRegExp(needle)}(?=$|[^\\p{L}\\p{N}])`, 'u');
  return pattern.test(flat.text);
}
