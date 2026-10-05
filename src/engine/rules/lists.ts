import type { Doc } from '../parse';
import type { RuleDef } from '../types';
import { fail, locateAnchors, pass, quoted } from './helpers';

export const listSyntax: RuleDef<void> = {
  label: () => 'Itens de lista escritos do jeito certo',
  messages: {
    noSpace:
      'Na linha {line}, falta um espaço depois de `{marker}`, então a linha não vira item de lista. Escreva `{fixed}`.',
  },
  check(doc) {
    for (let i = 0; i < doc.lines.length; i++) {
      if (doc.lineInfo[i]?.fence) continue;
      const line = doc.lines[i] ?? '';
      const match = /^\s*([-+]|\d{1,3}[.)])(\p{L}.*)$/u.exec(line);
      if (match?.[1] && match[2] !== undefined) {
        return fail(
          'noSpace',
          { marker: match[1], fixed: `${match[1]} ${match[2]}`.trim() },
          i + 1,
        );
      }
    }
    return pass();
  },
};

function placeAnchors(doc: Doc, anchors: readonly string[]) {
  return locateAnchors(doc, anchors).map(({ anchor, line }) => {
    const info = doc.lineInfo[line - 1];
    const list = info?.listId != null ? doc.lists[info.listId] : undefined;
    return { anchor, line, list, itemIndex: info?.itemIndex ?? null };
  });
}

export interface ListAnchorsParams {
  anchors: readonly string[];
}

export const orderedSteps: RuleDef<ListAnchorsParams> = {
  label: () => 'Passos em sequência numerados com `1.`',
  messages: {
    notInList:
      'O passo {anchor} (linha {line}) não está numa lista. Passos em sequência começam com `1.`, `2.`, `3.`…',
    bullet:
      'O passo {anchor} (linha {line}) está com traço, mas aqui a ordem importa. Troque o `-` por número: `1.`, `2.`, `3.`…',
    split:
      'Os passos estão em listas separadas (veja a linha {line}). Deixe todos na mesma lista numerada, um embaixo do outro, sem texto entre eles.',
    merged:
      '{anchor} e {other} estão no mesmo item (linha {line}). Cada passo vai numa linha própria, com seu número.',
    order:
      'O passo {anchor} (linha {line}) deveria vir antes de {next}. Reordene a lista para seguir a ordem em que as coisas acontecem.',
  },
  check(doc, { anchors }) {
    const placed = placeAnchors(doc, anchors);
    for (const p of placed) {
      if (!p.list) return fail('notInList', { anchor: quoted(p.anchor) }, p.line);
      if (!p.list.ordered) return fail('bullet', { anchor: quoted(p.anchor) }, p.line);
    }
    const first = placed[0];
    for (let i = 1; i < placed.length; i++) {
      const prev = placed[i - 1];
      const curr = placed[i];
      if (!prev || !curr || !first) continue;
      if (curr.list !== first.list) return fail('split', {}, curr.line);
      if (curr.itemIndex === prev.itemIndex) {
        return fail('merged', { anchor: quoted(prev.anchor), other: quoted(curr.anchor) }, curr.line);
      }
      if ((curr.itemIndex ?? 0) < (prev.itemIndex ?? 0)) {
        return fail('order', { anchor: quoted(prev.anchor), next: quoted(curr.anchor) }, prev.line);
      }
    }
    return pass();
  },
};

export const bulletItems: RuleDef<ListAnchorsParams> = {
  label: () => 'Itens independentes com `-`',
  messages: {
    notInList:
      'O item {anchor} (linha {line}) não está numa lista. Comece a linha com `- ` (traço e espaço).',
    ordered:
      'O item {anchor} (linha {line}) está numerado, mas não é um passo de sequência. Use `-` para itens independentes.',
    merged:
      '{anchor} e {other} estão no mesmo item (linha {line}). Cada item vai numa linha própria, começando com `- `.',
  },
  check(doc, { anchors }) {
    const placed = placeAnchors(doc, anchors);
    for (const p of placed) {
      if (!p.list) return fail('notInList', { anchor: quoted(p.anchor) }, p.line);
      if (p.list.ordered) return fail('ordered', { anchor: quoted(p.anchor) }, p.line);
    }
    for (let i = 1; i < placed.length; i++) {
      const prev = placed[i - 1];
      const curr = placed[i];
      if (prev && curr && prev.list === curr.list && prev.itemIndex === curr.itemIndex) {
        return fail('merged', { anchor: quoted(prev.anchor), other: quoted(curr.anchor) }, curr.line);
      }
    }
    return pass();
  },
};

export const bulletMarker: RuleDef<void> = {
  label: () => 'Listas com traço usam `-`',
  messages: {
    other:
      'Na linha {line} a lista usa `{marker}`. Funciona, mas `-` é o marcador mais comum e não se confunde com o `*` do negrito.',
  },
  check(doc) {
    const odd = doc.lists.find((l) => !l.ordered && l.marker !== '-');
    if (!odd) return pass();
    return fail('other', { marker: odd.marker }, odd.line);
  },
};
