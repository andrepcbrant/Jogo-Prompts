import type { RuleDef } from '../types';
import { normalizeText } from '../text';
import { fail, pass, quoted } from './helpers';

export const emphasisSyntax: RuleDef<void> = {
  label: () => 'Todo `**` virou negrito',
  messages: {
    unparsed:
      'Na linha {line}, os `**` não viraram negrito. Não deixe espaço logo depois do `**` de abertura nem antes do de fechamento, e confira se abriu e fechou.',
  },
  check(doc) {
    const line = doc.inline.unparsedStrongLines[0];
    return line === undefined ? pass() : fail('unparsed', {}, line);
  },
};

export interface BoldMinParams {
  min: number;
}

export const boldMin: RuleDef<BoldMinParams> = {
  label: ({ min }) => (min === 1 ? 'Ao menos um trecho em negrito' : `Ao menos ${min} trechos em negrito`),
  messages: {
    few: 'Encontrei {found} em negrito. Envolva o que não pode ser esquecido com dois asteriscos de cada lado, assim: `**não invente números**`.',
  },
  check(doc, { min }) {
    const found = doc.inline.strongCount;
    if (found >= min) return pass();
    return fail('few', { found: found === 0 ? 'nenhum trecho' : `${found} trecho(s)` });
  },
};

export interface BoldRatioParams {
  /** Fração máxima de palavras em negrito (0.1 = 10%). */
  max: number;
}

export const boldMaxRatio: RuleDef<BoldRatioParams> = {
  label: ({ max }) => `No máximo ${Math.round(max * 100)}% do texto em negrito`,
  messages: {
    tooMuch:
      '{percent}% do texto está em negrito ({strong} de {total} palavras). O limite é {max}%. Quando tudo é destaque, nada é: deixe em negrito só o que não pode ser esquecido.',
  },
  check(doc, { max }) {
    const { strongWords, totalWords } = doc.inline;
    if (totalWords === 0 || strongWords / totalWords <= max) return pass();
    return fail('tooMuch', {
      percent: Math.round((strongWords / totalWords) * 100),
      strong: strongWords,
      total: totalWords,
      max: Math.round(max * 100),
    });
  },
};

export interface BoldTargetsParams {
  /** Basta um destes trechos estar em negrito. */
  anyOf: readonly string[];
}

export const boldTargets: RuleDef<BoldTargetsParams> = {
  label: () => 'O negrito está no que é mais crítico',
  messages: {
    missed:
      'O negrito não está na regra mais crítica do pedido. Pense no que causaria estrago se o Oráculo esquecesse, como {anchor}, e destaque isso.',
  },
  check(doc, { anyOf }) {
    const hit = doc.inline.strongTexts.some((raw) => {
      const strong = normalizeText(raw);
      return anyOf.some((target) => {
        const anchor = normalizeText(target);
        // Vale destacar a frase inteira ou um pedaço substancial dela, não só "não".
        if (strong.includes(anchor)) return true;
        return anchor.includes(strong) && strong.length >= Math.max(8, anchor.length * 0.4);
      });
    });
    if (hit) return pass();
    return fail('missed', { anchor: quoted(anyOf[0] ?? '') });
  },
};
