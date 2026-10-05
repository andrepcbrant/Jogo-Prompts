import { describe, expect, it } from 'vitest';
import { evaluate } from '../../src/engine/evaluate';
import { check, lines } from './helpers';

describe('Runa do Título', () => {
  it('h1: exige exatamente um', () => {
    expect(check({ rule: 'heading.h1.exactlyOne' }, '# A\n## B').passed).toBe(true);
    const none = check({ rule: 'heading.h1.exactlyOne' }, '## B');
    expect(none.passed).toBe(false);
    expect(none.message).toContain('Falta o título');
    const two = check({ rule: 'heading.h1.exactlyOne' }, '# A\n\n# B');
    expect(two.message).toContain('linhas 1 e 3');
  });

  it('syntax: aponta # sem espaço com a correção', () => {
    const r = check({ rule: 'heading.syntax' }, '# Título\n\n##Regras');
    expect(r.passed).toBe(false);
    expect(r.line).toBe(3);
    expect(r.message).toContain('`## Regras`');
  });

  it('syntax: aponta ## no meio da frase', () => {
    const r = check({ rule: 'heading.syntax' }, 'Faça isso ## Regras não invente');
    expect(r.passed).toBe(false);
  });

  it('syntax: ignora # dentro de bloco de código', () => {
    expect(check({ rule: 'heading.syntax' }, '```\n#include\n```').passed).toBe(true);
  });

  it('minCount', () => {
    const ref = { rule: 'heading.minCount', params: { level: 2, min: 2 } } as const;
    expect(check(ref, '# A\n## B\n## C').passed).toBe(true);
    expect(check(ref, '# A\n## B').message).toContain('Há só 1 seção');
  });

  it('noSkippedLevels', () => {
    expect(check({ rule: 'heading.noSkippedLevels' }, '# A\n## B\n### C\n## D').passed).toBe(true);
    const skip = check({ rule: 'heading.noSkippedLevels' }, '# A\n### C');
    expect(skip.line).toBe(2);
    expect(skip.message).toContain('de `#` para `###`');
    expect(check({ rule: 'heading.noSkippedLevels' }, '## A').message).toContain('começa pelo `#`');
  });

  it('requiredSections aceita acento faltando e sinônimos', () => {
    const ref = {
      rule: 'heading.requiredSections',
      params: { level: 2, sections: [{ label: 'Tarefa' }, { label: 'Formato de saída', aliases: ['Formato'] }] },
    } as const;
    expect(check(ref, '# X\n## tarefa\n## Formato de saida').passed).toBe(true);
    expect(check(ref, '# X\n## Tarefa\n## Formato').passed).toBe(true);
    expect(check(ref, '# X\n## Tarefa').message).toContain('“Formato de saída”');
    expect(check(ref, '# X\n### Tarefa\n## Formato').message).toContain('está com `###`');
  });
});

describe('conteúdo', () => {
  it('preserved: acusa trecho apagado', () => {
    const ref = { rule: 'content.preserved', params: { anchors: ['Viaduto Norte', '200 palavras'] } } as const;
    expect(check(ref, 'Obra do **Viaduto\nNorte**, até 200 palavras').passed).toBe(true);
    const r = check(ref, 'Obra qualquer');
    expect(r.message).toContain('“Viaduto Norte” (e mais 1 trecho)');
  });

  it('inSection: aponta a seção atual e a esperada', () => {
    const ref = {
      rule: 'content.inSection',
      params: { placements: [{ anchor: 'não invente', sections: ['Regras'] }] },
    } as const;
    expect(check(ref, '# A\n## Regras\nNão invente.').passed).toBe(true);
    const r = check(ref, '# A\n## Contexto\nNão invente.');
    expect(r.message).toContain('está na seção “Contexto”');
    expect(r.line).toBe(3);
  });

  it('mentions', () => {
    const ref = { rule: 'content.mentions', params: { label: 'o replan', anyOf: ['replan', 'reprogramação'] } } as const;
    expect(check(ref, 'Compare com o Replan.').passed).toBe(true);
    expect(check(ref, 'Compare com o plano.').passed).toBe(false);
  });
});

describe('Runa da Lista', () => {
  const steps = { rule: 'list.ordered', params: { anchors: ['baixar', 'filtrar', 'comparar'] } } as const;
  const loose = { rule: 'list.bullet', params: { anchors: ['planilha', 'ata'] } } as const;

  it('aceita passos numerados em ordem e itens soltos com traço', () => {
    const text = lines('1. baixar', '2. filtrar', '3. comparar', '', '- planilha', '- ata');
    expect(check(steps, text).passed).toBe(true);
    expect(check(loose, text).passed).toBe(true);
  });

  it('acusa passo com traço', () => {
    const r = check(steps, lines('- baixar', '- filtrar', '- comparar'));
    expect(r.message).toContain('Troque o `-` por número');
  });

  it('acusa ordem errada', () => {
    const r = check(steps, lines('1. filtrar', '2. baixar', '3. comparar'));
    expect(r.message).toContain('“baixar”');
    expect(r.message).toContain('deveria vir antes de “filtrar”');
  });

  it('acusa dois passos no mesmo item', () => {
    expect(check(steps, lines('1. baixar e filtrar', '2. comparar')).message).toContain('mesmo item');
  });

  it('acusa listas separadas', () => {
    expect(check(steps, lines('1. baixar', '2. filtrar', '', 'texto', '', '1. comparar')).message).toContain(
      'listas separadas',
    );
  });

  it('acusa item solto numerado', () => {
    expect(check(loose, lines('1. planilha', '2. ata')).message).toContain('numerado');
  });

  it('syntax: traço sem espaço', () => {
    const r = check({ rule: 'list.syntax' }, '-planilha');
    expect(r.message).toContain('`- planilha`');
    expect(check({ rule: 'list.syntax' }, '---').passed).toBe(true);
  });

  it('bulletMarker aconselha `-`', () => {
    expect(check({ rule: 'list.bulletMarker' }, '* a\n* b').passed).toBe(false);
  });
});

describe('Runa da Ênfase', () => {
  const ratio = { rule: 'emphasis.boldMaxRatio', params: { max: 0.1 } } as const;
  const text = (bold: string) => `${bold} ${'palavra '.repeat(18)}`;

  it('boldMin', () => {
    expect(check({ rule: 'emphasis.boldMin', params: { min: 1 } }, 'sem nada').passed).toBe(false);
    expect(check({ rule: 'emphasis.boldMin', params: { min: 1 } }, 'com **algo**').passed).toBe(true);
  });

  it('boldMaxRatio mede palavras', () => {
    expect(check(ratio, text('**duas palavras**')).passed).toBe(true); // 2/20
    const r = check(ratio, text('**três palavras aqui**')); // 3/21
    expect(r.passed).toBe(false);
    expect(r.message).toContain('14% do texto');
  });

  it('syntax: ** com espaço não vira negrito', () => {
    const r = check({ rule: 'emphasis.syntax' }, 'linha\n** não invente**');
    expect(r.passed).toBe(false);
    expect(r.line).toBe(2);
  });

  it('boldTargets exige destaque substancial', () => {
    const ref = { rule: 'emphasis.boldTargets', params: { anyOf: ['não invente números'] } } as const;
    expect(check(ref, '**Não invente números** nunca').passed).toBe(true);
    expect(check(ref, '**Não** invente números').passed).toBe(false);
  });
});

describe('Runa do Bloco', () => {
  const sql = {
    rule: 'code.fenced',
    params: { anchors: ['select', 'from obras'], what: 'a consulta SQL', languages: ['sql'] },
  } as const;

  it('aceita bloco fechado com linguagem', () => {
    expect(check(sql, lines('```sql', 'select *', 'from obras', '```')).passed).toBe(true);
  });

  it('acusa ausência de linguagem', () => {
    const r = check(sql, lines('```', 'select *', 'from obras', '```'));
    expect(r.message).toContain('não diz a linguagem');
    expect(r.message).toContain('```sql');
  });

  it('acusa linguagem errada', () => {
    expect(check(sql, lines('```python', 'select *', 'from obras', '```')).message).toContain('diz `python`');
  });

  it('acusa conteúdo fora do bloco', () => {
    expect(check(sql, lines('select *', 'from obras')).message).toContain('não está dentro de um bloco');
    expect(check(sql, lines('select *', '```sql', 'from obras', '```')).message).toContain('dividido');
  });

  it('fenceClosed acusa bloco aberto', () => {
    const r = check({ rule: 'code.fenceClosed' }, lines('texto', '```sql', 'select 1'));
    expect(r.line).toBe(2);
    expect(r.message).toContain('engoliu');
  });

  it('inline: nome de arquivo entre crases', () => {
    const ref = { rule: 'code.inline', params: { anchors: ['obra_A375.xlsx'] } } as const;
    expect(check(ref, 'Abra `obra_A375.xlsx`').passed).toBe(true);
    expect(check(ref, 'Abra obra_A375.xlsx').message).toContain('crases simples');
  });
});

describe('Runa da Divisória', () => {
  it('aceita --- isolado', () => {
    const text = lines('Instruções', '', '---', '', 'Referência');
    expect(check({ rule: 'hr.present' }, text).passed).toBe(true);
    expect(check({ rule: 'hr.blankAround' }, text).passed).toBe(true);
    expect(check({ rule: 'hr.notSetext' }, text).passed).toBe(true);
  });

  it('explica a armadilha do título sublinhado', () => {
    const text = lines('Instruções', '---', '', 'Referência');
    const r = check({ rule: 'hr.present' }, text);
    expect(r.message).toContain('transformou “Instruções” em título');
    expect(r.line).toBe(2);
    expect(check({ rule: 'hr.notSetext' }, text).passed).toBe(false);
  });

  it('detecta travessão do teclado', () => {
    const r = check({ rule: 'hr.present' }, lines('a', '', '—-', '', 'b'));
    expect(r.message).toContain('travessão');
  });

  it('pede linha em branco depois', () => {
    const r = check({ rule: 'hr.blankAround' }, lines('a', '', '---', 'b'));
    expect(r.message).toContain('depois');
  });

  it('between: separa instruções e referência', () => {
    const ref = { rule: 'hr.between', params: { before: ['resuma'], after: ['ata'] } } as const;
    expect(check(ref, lines('Resuma.', '', '---', '', 'Ata')).passed).toBe(true);
    expect(check(ref, lines('---', '', 'Resuma.', 'Ata')).message).toContain('no começo');
    expect(check(ref, lines('Ata', '', '---', '', 'Resuma.')).message).toContain('lado errado');
  });
});

describe('Runa da Citação', () => {
  const ref = { rule: 'quote.allLinesPrefixed', params: { anchors: ['Bom dia', 'Abraços'] } } as const;

  it('aceita todas as linhas com >', () => {
    expect(check(ref, lines('Leia:', '', '> Bom dia', '>', '> Abraços')).passed).toBe(true);
  });

  it('acusa continuação preguiçosa', () => {
    const r = check(ref, lines('> Bom dia', 'meio', '> Abraços'));
    expect(r.line).toBe(2);
    expect(r.message).toContain('o modelo lê o texto cru');
  });

  it('acusa linha em branco que quebra a citação', () => {
    expect(check(ref, lines('> Bom dia', '', '> Abraços')).message).toContain('quebra a citação');
  });

  it('acusa trecho sem citação', () => {
    expect(check(ref, lines('Bom dia', 'Abraços')).message).toContain('não está citado');
  });
});

describe('Runa da Tabela', () => {
  const good = lines('| Item | Real | Replan |', '| --- | --- | --- |', '| Concreto | 10 | 12 |');

  it('aceita tabela correta', () => {
    for (const rule of ['table.present', 'table.delimiterRow', 'table.consistentColumns', 'table.noStrayPipe'] as const) {
      expect(check({ rule }, good).passed, rule).toBe(true);
    }
  });

  it('acusa falta da linha de separação', () => {
    const text = lines('| Item | Real |', '| Concreto | 10 |');
    expect(check({ rule: 'table.present' }, text).message).toContain('falta a linha de separação');
    expect(check({ rule: 'table.delimiterRow' }, text).passed).toBe(false);
  });

  it('acusa coluna faltando', () => {
    const r = check({ rule: 'table.consistentColumns' }, `${good}\n| Aço | 5 |`);
    expect(r.line).toBe(4);
    expect(r.message).toContain('tem 2 colunas');
  });

  it('acusa | solto', () => {
    const r = check({ rule: 'table.noStrayPipe' }, `${good}\n| Aço | CA-50 | CA-60 | 5 |`);
    expect(r.message).toContain('sobrou um `|`');
    expect(check({ rule: 'table.noStrayPipe' }, `${good}\n| Aço \\| CA-50 | 5 | 6 |`).passed).toBe(true);
  });

  it('contains: colunas e itens', () => {
    const ref = { rule: 'table.contains', params: { columns: ['Real', 'Replan'], rows: ['Concreto', 'Aço'] } } as const;
    expect(check(ref, `${good}\n| Aço | 5 | 6 |`).passed).toBe(true);
    expect(check(ref, `${good}\n\nAço fora`).message).toContain('fora da tabela');
  });
});

describe('evaluate', () => {
  it('conselhos não bloqueiam o feitiço', () => {
    const result = evaluate(
      [{ rule: 'heading.h1.exactlyOne' }, { rule: 'list.bulletMarker', severity: 'advice' }],
      '# A\n\n* x\n* y',
    );
    expect(result.passed).toBe(true);
    expect(result.results[1]?.passed).toBe(false);
  });

  it('mensagens podem ser sobrescritas pela missão', () => {
    const result = evaluate(
      [{ rule: 'heading.h1.exactlyOne', messages: { missing: 'O Mestre quer um título.' } }],
      'nada',
    );
    expect(result.results[0]?.message).toBe('O Mestre quer um título.');
  });

  it('runes.used conta só runas bem usadas', () => {
    const text = lines(
      '# Feitiço',
      '## Tarefa',
      'Compare o **real** com o replan e responda com dados verificados da obra inteira.',
      '## Regras',
      '- uma',
      '- duas',
      '',
      '---',
      '',
      '> citação',
    );
    const r = evaluate([{ rule: 'runes.used', params: { min: 6 } }], text).results[0];
    expect(r?.passed).toBe(false);
    expect(r?.message).toContain('5 de 7');
    expect(r?.message).toContain('Bloco e Tabela');
  });
});
