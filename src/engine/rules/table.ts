import { DELIMITER_ROW, splitRow, tableLikeBlocks, type Block, type Doc } from '../parse';
import type { RuleDef } from '../types';
import { fail, headingMatches, locateAnchors, pass, quoted } from './helpers';

const NONE = 'Escreva a tabela primeiro.';

interface Row {
  line: number;
  cells: string[];
}

interface Candidate {
  block: Block;
  header: Row;
  delimiter: Row | null;
  body: Row[];
}

function candidates(doc: Doc): Candidate[] {
  return tableLikeBlocks(doc).map((block) => {
    const rows: Row[] = [];
    for (let n = block.line; n <= block.endLine; n++) {
      rows.push({ line: n, cells: splitRow(doc.lines[n - 1] ?? '') });
    }
    const [header, second, ...rest] = rows;
    const hasDelimiter = second !== undefined && DELIMITER_ROW.test(doc.lines[second.line - 1] ?? '');
    return {
      block,
      header: header ?? { line: block.line, cells: [] },
      delimiter: hasDelimiter ? (second ?? null) : null,
      body: hasDelimiter ? rest : second ? [second, ...rest] : rest,
    };
  });
}

export const tablePresent: RuleDef<void> = {
  label: () => 'Uma tabela',
  messages: {
    none: 'Nenhuma tabela encontrada. Comece com um cabeçalho como `| Item | Real | Replan |` e, logo abaixo, a linha `| --- | --- | --- |`.',
    noDelimiter:
      'As linhas {line} a {end} parecem uma tabela, mas falta a linha de separação. Logo abaixo do cabeçalho, escreva `| --- | --- |`, com um `---` para cada coluna.',
    headerMismatch:
      'O cabeçalho (linha {line}) tem {header} colunas e a linha de separação tem {delimiter}. As duas precisam ter o mesmo número de colunas.',
  },
  check(doc) {
    if (doc.tables.length > 0) return pass();
    const candidate = candidates(doc)[0];
    if (!candidate) return fail('none');
    if (!candidate.delimiter) {
      return fail('noDelimiter', { end: candidate.block.endLine }, candidate.block.line);
    }
    return fail(
      'headerMismatch',
      { header: candidate.header.cells.length, delimiter: candidate.delimiter.cells.length },
      candidate.header.line,
    );
  },
};

export const tableDelimiterRow: RuleDef<void> = {
  label: () => 'Linha de separação com traços logo abaixo do cabeçalho',
  messages: {
    none: NONE,
    missing:
      'Falta a linha de separação na tabela que começa na linha {line}. Logo abaixo do cabeçalho, escreva `| --- | --- |`, com um `---` para cada coluna.',
  },
  check(doc) {
    const all = candidates(doc);
    if (all.length === 0) return fail('none');
    const bad = all.find((c) => !c.delimiter);
    return bad ? fail('missing', {}, bad.block.line) : pass();
  },
};

export const tableConsistentColumns: RuleDef<void> = {
  label: () => 'Todas as linhas da tabela com o mesmo número de colunas',
  messages: {
    none: NONE,
    delimiter:
      'A linha de separação (linha {line}) tem {count} colunas, mas o cabeçalho tem {header}. Use um `---` para cada coluna do cabeçalho.',
    fewer:
      'A linha {line} tem {count} colunas, mas o cabeçalho tem {header}. Complete as células que faltam (use `-` se não houver valor).',
  },
  check(doc) {
    const all = candidates(doc).filter((c) => c.delimiter);
    if (all.length === 0) return fail('none');
    for (const c of all) {
      const header = c.header.cells.length;
      if (c.delimiter && c.delimiter.cells.length !== header) {
        return fail('delimiter', { count: c.delimiter.cells.length, header }, c.delimiter.line);
      }
      const short = c.body.find((row) => row.cells.length < header);
      if (short) return fail('fewer', { count: short.cells.length, header }, short.line);
    }
    return pass();
  },
};

export const tableNoStrayPipe: RuleDef<void> = {
  label: () => 'Nenhum `|` solto dentro de uma célula',
  messages: {
    none: NONE,
    stray:
      'A linha {line} tem {count} colunas, mas o cabeçalho tem {header}: sobrou um `|` dentro de alguma célula. O preview esconde a célula a mais, mas o modelo lê o `|` no texto cru. Troque o `|` por uma palavra ou escreva `\\|`.',
  },
  check(doc) {
    const all = candidates(doc).filter((c) => c.delimiter);
    if (all.length === 0) return fail('none');
    for (const c of all) {
      const header = c.header.cells.length;
      const long = c.body.find((row) => row.cells.length > header);
      if (long) return fail('stray', { count: long.cells.length, header }, long.line);
    }
    return pass();
  },
};

export interface TableContainsParams {
  /** Colunas que o cabeçalho precisa ter. */
  columns: readonly string[];
  /** Itens que precisam virar linhas da tabela. */
  rows: readonly string[];
}

export const tableContains: RuleDef<TableContainsParams> = {
  label: () => 'A tabela compara os itens certos',
  messages: {
    none: NONE,
    missingColumn: 'Falta a coluna {column} no cabeçalho da tabela (linha {line}).',
    rowOutside:
      '{anchor} (linha {line}) está fora da tabela. Cada item que você quer comparar vira uma linha da tabela.',
  },
  check(doc, { columns, rows }) {
    const table = candidates(doc).find((c) => c.delimiter);
    if (!table) return fail('none');
    for (const column of columns) {
      if (!table.header.cells.some((cell) => headingMatches(cell, [column]))) {
        return fail('missingColumn', { column: quoted(column) }, table.header.line);
      }
    }
    for (const { anchor, line } of locateAnchors(doc, rows)) {
      const inside = line >= table.block.line && line <= table.block.endLine;
      if (!inside) return fail('rowOutside', { anchor: quoted(anchor) }, line);
    }
    return pass();
  },
};
