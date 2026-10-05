import type { Doc } from '../parse';
import type { RuleDef } from '../types';
import { dashHrs, excerpt, fail, isBlank, locateAnchors, pass, quoted } from './helpers';

/** Linhas onde o teclado trocou `---` por travessão. */
function emDashLine(doc: Doc): number | null {
  const index = doc.lines.findIndex(
    (line, i) => !doc.lineInfo[i]?.fence && /^\s*[—–][—–-]*\s*$/.test(line),
  );
  return index < 0 ? null : index + 1;
}

const setextDash = (doc: Doc) => doc.headings.find((h) => h.setext && h.level === 2);

const SETEXT_MESSAGE =
  'O `---` da linha {line} está colado no texto de cima, e o markdown transformou {text} em título em vez de divisória. Deixe uma linha em branco antes do `---`.';

export const hrPresent: RuleDef<void> = {
  label: () => 'Uma divisória `---`',
  messages: {
    none: 'Não há divisória. Escreva `---` sozinho numa linha, com uma linha em branco antes e outra depois.',
    emDash:
      'Na linha {line} aparece um travessão (—), não três hífens. O teclado trocou o `---` sozinho. Apague e digite três hífens seguidos; no celular, use o botão `---` da barra de runas.',
    otherMarkup:
      'Na linha {line} você usou `{markup}`. Também vira divisória, mas a runa desta missão é `---`: troque por três hífens.',
    setext: SETEXT_MESSAGE,
  },
  check(doc) {
    if (dashHrs(doc).length > 0) return pass();
    const dash = emDashLine(doc);
    if (dash !== null) return fail('emDash', {}, dash);
    const heading = setextDash(doc);
    if (heading) return fail('setext', { text: quoted(excerpt(heading.text)) }, heading.endLine);
    const other = doc.hrs[0];
    if (other) return fail('otherMarkup', { markup: other.markup }, other.line);
    return fail('none');
  },
};

export const hrNotSetext: RuleDef<void> = {
  label: () => 'Nenhum `---` virou título sem querer',
  messages: { setext: SETEXT_MESSAGE },
  check(doc) {
    const heading = setextDash(doc);
    return heading ? fail('setext', { text: quoted(excerpt(heading.text)) }, heading.endLine) : pass();
  },
};

export const hrBlankAround: RuleDef<void> = {
  label: () => 'Linha em branco antes e depois da divisória',
  messages: {
    before: 'A divisória da linha {line} precisa de uma linha em branco logo antes dela.',
    after: 'A divisória da linha {line} precisa de uma linha em branco logo depois dela.',
    none: 'Escreva a divisória `---` primeiro.',
  },
  check(doc) {
    const hrs = dashHrs(doc);
    if (hrs.length === 0) return fail('none');
    for (const hr of hrs) {
      const index = hr.line - 1;
      if (index > 0 && !isBlank(doc.lines[index - 1])) return fail('before', {}, hr.line);
      if (index < doc.lines.length - 1 && !isBlank(doc.lines[index + 1])) {
        return fail('after', {}, hr.line);
      }
    }
    return pass();
  },
};

export interface HrBetweenParams {
  /** Trechos que precisam ficar acima da divisória (as instruções). */
  before: readonly string[];
  /** Trechos que precisam ficar abaixo (o material de referência). */
  after: readonly string[];
}

export const hrBetween: RuleDef<HrBetweenParams> = {
  label: () => 'A divisória separa as instruções do material de referência',
  messages: {
    none: 'Escreva a divisória `---` primeiro.',
    edge: 'A divisória da linha {line} está {where} do texto. Ela precisa ficar entre duas partes com conteúdo.',
    wrongSide:
      'O trecho {anchor} (linha {line}) está do lado errado da divisória. Acima do `---` ficam as instruções; abaixo, o material de referência.',
  },
  check(doc, { before, after }) {
    const hrs = dashHrs(doc);
    if (hrs.length === 0) return fail('none');
    const content = doc.lines
      .map((line, i) => (isBlank(line) ? null : i + 1))
      .filter((n): n is number => n !== null);
    const firstContent = content[0] ?? 0;
    const lastContent = content[content.length - 1] ?? 0;
    const above = locateAnchors(doc, before);
    const below = locateAnchors(doc, after);
    const good = hrs.find(
      (hr) =>
        hr.line > firstContent &&
        hr.line < lastContent &&
        above.every((a) => a.line < hr.line) &&
        below.every((b) => b.line > hr.line),
    );
    if (good) return pass();
    const hr = hrs[0];
    if (!hr) return fail('none');
    if (hr.line <= firstContent) return fail('edge', { where: 'no começo' }, hr.line);
    if (hr.line >= lastContent) return fail('edge', { where: 'no fim' }, hr.line);
    const wrong = above.find((a) => a.line > hr.line) ?? below.find((b) => b.line < hr.line);
    return fail('wrongSide', { anchor: quoted(wrong?.anchor ?? '') }, wrong?.line);
  },
};
