import type { Doc } from '../parse';
import { findAnchorLine, normalizeText } from '../text';
import type { Outcome } from '../types';

export const pass = (): Outcome => ({ passed: true });

export const fail = (
  code: string,
  vars: Record<string, string | number> = {},
  line?: number,
): Outcome => ({ passed: false, code, vars, line });

/** Lista em português: "A, B e C". */
export function joinPt(items: readonly string[], conjunction = 'e'): string {
  if (items.length <= 1) return items.join('');
  return `${items.slice(0, -1).join(', ')} ${conjunction} ${items[items.length - 1]}`;
}

export const quoted = (text: string) => `“${text}”`;

/** Encurta textos longos citados nas mensagens. */
export function excerpt(text: string, max = 48): string {
  return text.length <= max ? text : `${text.slice(0, max - 1).trimEnd()}…`;
}

/** Âncoras encontradas no texto, com a linha de cada uma. */
export function locateAnchors(doc: Doc, anchors: readonly string[]) {
  return anchors.flatMap((anchor) => {
    const line = findAnchorLine(doc.flat, anchor);
    return line === null ? [] : [{ anchor, line }];
  });
}

/** `a` contém `b` ou `b` contém `a`, de forma tolerante. */
export function overlaps(a: string, b: string): boolean {
  const na = normalizeText(a);
  const nb = normalizeText(b);
  if (na.length === 0 || nb.length === 0) return false;
  return na.includes(nb) || nb.includes(na);
}

/** O nome do título bate com o rótulo esperado (aceita texto a mais). */
export function headingMatches(headingText: string, names: readonly string[]): boolean {
  const heading = normalizeText(headingText);
  return names.some((name) => {
    const n = normalizeText(name);
    return heading === n || heading.startsWith(`${n} `) || heading.includes(n);
  });
}

export const isBlank = (line: string | undefined) => (line ?? '').trim() === '';

/** Divisórias feitas só de hífens (`---`, `- - -`, `-----`). */
export const dashHrs = (doc: Doc) => doc.hrs.filter((hr) => /^[-\s]+$/.test(hr.markup));

export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
