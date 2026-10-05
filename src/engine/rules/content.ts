import type { RuleDef } from '../types';
import { containsTerm } from '../text';
import { fail, headingMatches, joinPt, locateAnchors, pass, quoted } from './helpers';

export interface PreservedParams {
  anchors: readonly string[];
}

export const preserved: RuleDef<PreservedParams> = {
  label: () => 'Nenhuma informação do pedido foi apagada',
  messages: {
    missing:
      'Sumiu o trecho {anchor}{extra}. Reorganize o texto à vontade, mas não apague informação: o Oráculo precisa dela.',
  },
  check(doc, { anchors }) {
    const found = new Set(locateAnchors(doc, anchors).map((a) => a.anchor));
    const missing = anchors.filter((a) => !found.has(a));
    const first = missing[0];
    if (first === undefined) return pass();
    const extra =
      missing.length === 1
        ? ''
        : ` (e mais ${missing.length - 1} ${missing.length === 2 ? 'trecho' : 'trechos'})`;
    return fail('missing', { anchor: quoted(first), extra });
  },
};

export interface InSectionParams {
  placements: readonly { anchor: string; sections: readonly string[] }[];
}

export const inSection: RuleDef<InSectionParams> = {
  label: () => 'Cada informação está na seção que combina com ela',
  messages: {
    wrongSection:
      'O trecho {anchor} (linha {line}) está {where}. Ele combina mais com {expected}: mova-o para lá.',
  },
  check(doc, { placements }) {
    for (const { anchor, sections } of placements) {
      const [located] = locateAnchors(doc, [anchor]);
      if (!located) continue; // `content.preserved` cuida do que sumiu
      const stack = doc.lineInfo[located.line - 1]?.sections ?? [];
      if (stack.some((h) => headingMatches(h.text, sections))) continue;
      const current = stack[stack.length - 1];
      return fail(
        'wrongSection',
        {
          anchor: quoted(anchor),
          where: current ? `na seção ${quoted(current.text)}` : 'fora de qualquer seção',
          expected: `a seção ${joinPt(sections.map((s) => quoted(s)), 'ou')}`,
        },
        located.line,
      );
    }
    return pass();
  },
};

export interface MentionsParams {
  /** O que o feitiço precisa mencionar, em linguagem de gente. */
  label: string;
  /** Qualquer uma destas expressões satisfaz o item. */
  anyOf: readonly string[];
}

export const mentions: RuleDef<MentionsParams> = {
  label: ({ label }) => `Menciona ${label}`,
  messages: {
    missing: 'O feitiço não menciona {label}. Inclua isso no texto, por exemplo: {example}.',
  },
  check(doc, { label, anyOf }) {
    const hit = anyOf.some((term) => containsTerm(doc.flat, term));
    if (hit) return pass();
    return fail('missing', { label, example: quoted(anyOf[0] ?? '') });
  },
};
