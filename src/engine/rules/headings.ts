import type { RuleDef } from '../types';
import { fail, headingMatches, joinPt, pass, quoted } from './helpers';

const hashes = (level: number) => '#'.repeat(level);

export const headingSyntax: RuleDef<void> = {
  label: () => 'Títulos escritos do jeito certo',
  messages: {
    noSpace:
      'Na linha {line}, `{text}` não vira título porque falta um espaço depois do `{marks}`. Escreva `{fixed}`.',
    midLine:
      'Na linha {line}, o `{marks}` está no meio da frase e não vira título. Títulos precisam começar a linha: quebre a linha antes do `{marks}`.',
  },
  check(doc) {
    for (let i = 0; i < doc.lines.length; i++) {
      if (doc.lineInfo[i]?.fence) continue;
      const line = doc.lines[i] ?? '';
      const noSpace = /^\s{0,3}(#{1,6})(\p{L}.*)$/u.exec(line);
      if (noSpace?.[1] && noSpace[2] !== undefined) {
        const marks = noSpace[1];
        const rest = noSpace[2];
        return fail(
          'noSpace',
          { text: `${marks}${rest}`.trim(), marks, fixed: `${marks} ${rest}`.trim() },
          i + 1,
        );
      }
      const mid = /\S\s+(#{2,6})\s+\p{L}/u.exec(line);
      if (mid?.[1] && !line.includes('`')) {
        return fail('midLine', { marks: mid[1] }, i + 1);
      }
    }
    return pass();
  },
};

export const h1ExactlyOne: RuleDef<void> = {
  label: () => 'Um único título principal com `#`',
  messages: {
    missing:
      'Falta o título do feitiço. Na primeira linha, escreva `#`, um espaço e o nome. Exemplo: `# Resumo da reunião de obra`.',
    tooMany:
      'Há {count} títulos com um só `#` (linhas {lines}). Mantenha só um `#` para o feitiço inteiro e troque os outros por `##`.',
  },
  check(doc) {
    const h1 = doc.headings.filter((h) => h.level === 1);
    if (h1.length === 1) return pass();
    if (h1.length === 0) return fail('missing');
    return fail(
      'tooMany',
      { count: h1.length, lines: joinPt(h1.map((h) => String(h.line))) },
      h1[1]?.line,
    );
  },
};

export interface MinCountParams {
  level: number;
  min: number;
}

export const headingMinCount: RuleDef<MinCountParams> = {
  label: ({ level, min }) => `Pelo menos ${min} seções com \`${hashes(level)}\``,
  messages: {
    none: 'Ainda não há seções com `{marks}`. São necessárias pelo menos {min}: comece cada seção numa linha nova com `{marks} Nome da seção`.',
    few: 'Há {found} com `{marks}`, mas são necessárias pelo menos {min}. Comece cada seção numa linha nova com `{marks} Nome da seção`.',
  },
  check(doc, { level, min }) {
    const found = doc.headings.filter((h) => h.level === level).length;
    if (found >= min) return pass();
    return fail(found === 0 ? 'none' : 'few', {
      found: found === 1 ? 'só 1 seção' : `${found} seções`,
      marks: hashes(level),
      min,
    });
  },
};

export const noSkippedLevels: RuleDef<void> = {
  label: () => 'Nenhum nível de título pulado',
  messages: {
    firstNotH1:
      'O primeiro título (linha {line}) usa `{to}`. O feitiço começa pelo `#`; as seções vêm depois, com `##`.',
    skipped:
      'Na linha {line} você saltou de `{from}` para `{to}`. Use `{expected}` aqui, ou crie antes uma seção com `{expected}`.',
  },
  check(doc) {
    let previous = 0;
    for (const heading of doc.headings) {
      if (heading.level > previous + 1) {
        if (previous === 0) {
          return fail('firstNotH1', { to: hashes(heading.level) }, heading.line);
        }
        return fail(
          'skipped',
          { from: hashes(previous), to: hashes(heading.level), expected: hashes(previous + 1) },
          heading.line,
        );
      }
      previous = heading.level;
    }
    return pass();
  },
};

export interface RequiredSectionsParams {
  level: number;
  sections: readonly { label: string; aliases?: readonly string[] }[];
}

export const requiredSections: RuleDef<RequiredSectionsParams> = {
  label: ({ sections }) => `Seções ${joinPt(sections.map((s) => s.label))}`,
  messages: {
    missingOne: 'Falta a seção {names}. Crie-a numa linha própria: `{marks} {first}`.',
    missingMany: 'Faltam as seções {names}. Crie cada uma numa linha própria, como `{marks} {first}`.',
    wrongLevel:
      'A seção {section} (linha {line}) está com `{found}`. Use `{marks}`, como as outras seções.',
  },
  check(doc, { level, sections }) {
    const missing: string[] = [];
    for (const section of sections) {
      const names = [section.label, ...(section.aliases ?? [])];
      const matches = doc.headings.filter((h) => headingMatches(h.text, names));
      if (matches.some((h) => h.level === level)) continue;
      const wrong = matches[0];
      if (wrong) {
        return fail(
          'wrongLevel',
          { section: quoted(section.label), found: hashes(wrong.level), marks: hashes(level) },
          wrong.line,
        );
      }
      missing.push(section.label);
    }
    if (missing.length === 0) return pass();
    return fail(missing.length === 1 ? 'missingOne' : 'missingMany', {
      names: joinPt(missing.map((m) => quoted(m))),
      first: missing[0] ?? '',
      marks: hashes(level),
    });
  },
};
