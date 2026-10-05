import type { RuleDef } from '../types';
import { normalizeText } from '../text';
import { capitalize, fail, locateAnchors, pass, quoted } from './helpers';

export const fenceClosed: RuleDef<void> = {
  label: () => 'Todo bloco de código foi fechado',
  messages: {
    open: 'O bloco aberto na linha {line} nunca foi fechado, então ele engoliu todo o texto que vem depois. Feche com três crases (```) numa linha só delas.',
  },
  check(doc) {
    const open = doc.fences.find((f) => !f.closed);
    return open ? fail('open', {}, open.line) : pass();
  },
};

export interface FencedParams {
  /** Trechos que precisam estar dentro do mesmo bloco. */
  anchors: readonly string[];
  /** Como chamar este conteúdo nas mensagens, por exemplo "a consulta SQL". */
  what: string;
  /** Se informado, o bloco precisa declarar uma destas linguagens. */
  languages?: readonly string[];
}

export const fenced: RuleDef<FencedParams> = {
  label: ({ what, languages }) =>
    languages ? `${capitalize(what)} num bloco com a linguagem informada` : `${capitalize(what)} num bloco`,
  messages: {
    notFenced:
      '{What} (linha {line}) não está dentro de um bloco. Escreva três crases (```) na linha de cima e outras três na linha de baixo.',
    split: '{What} ficou dividido: parte está fora do bloco (linha {line}). Coloque tudo dentro do mesmo bloco.',
    noLanguage:
      'O bloco da linha {line} não diz a linguagem. Escreva o nome logo depois das crases de abertura, assim: ```{example}',
    wrongLanguage:
      'O bloco da linha {line} diz `{info}`, mas {what} é {expected}. Troque a primeira linha do bloco por ```{example}',
  },
  check(doc, { anchors, what, languages }) {
    const vars = { what, What: capitalize(what) };
    const placed = locateAnchors(doc, anchors);
    const fences = placed.map((p) => ({
      ...p,
      fence: doc.fences.find((f) => p.line > f.line && p.line <= (f.closed ? f.endLine - 1 : f.endLine)),
    }));
    const outside = fences.find((p) => !p.fence);
    if (outside) {
      const someInside = fences.some((p) => p.fence);
      return fail(someInside ? 'split' : 'notFenced', vars, outside.line);
    }
    const fence = fences[0]?.fence;
    if (!fence || !languages || languages.length === 0) return pass();
    const info = fence.info.split(/\s+/)[0] ?? '';
    const example = languages[0] ?? '';
    if (info === '') return fail('noLanguage', { ...vars, example }, fence.line);
    if (!languages.some((l) => normalizeText(l) === normalizeText(info))) {
      return fail(
        'wrongLanguage',
        { ...vars, info, example, expected: languages.map((l) => `\`${l}\``).join(' ou ') },
        fence.line,
      );
    }
    return pass();
  },
};

export interface InlineCodeParams {
  anchors: readonly string[];
}

export const inlineCode: RuleDef<InlineCodeParams> = {
  label: () => 'Nomes técnicos entre crases simples',
  messages: {
    missing:
      '{anchor} (linha {line}) é um nome técnico e deveria estar entre crases simples, assim: `{raw}`.',
  },
  check(doc, { anchors }) {
    for (const { anchor, line } of locateAnchors(doc, anchors)) {
      const inCode = doc.inline.codeSpans.some((span) =>
        normalizeText(span.content).includes(normalizeText(anchor)),
      );
      if (!inCode) return fail('missing', { anchor: quoted(anchor), raw: anchor }, line);
    }
    return pass();
  },
};
