import { describe, expect, it } from 'vitest';
import { parse, splitRow } from '../../src/engine/parse';
import { buildFlatText, containsTerm, findAnchorLine, normalizeText } from '../../src/engine/text';
import { lines } from './helpers';

describe('normalizeText', () => {
  it('ignora acentos, maiúsculas, markdown e espaços repetidos', () => {
    expect(normalizeText('Não  **INVENTE**\n números')).toBe('nao invente numeros');
    expect(normalizeText('`obra_A375.xlsx`')).toBe('obraa375.xlsx');
  });
});

describe('âncoras', () => {
  it('acha o trecho mesmo quebrado em linhas e com marcadores', () => {
    const flat = buildFlatText(['# Título', '', '- Não invente', '  **números** da ata']);
    expect(findAnchorLine(flat, 'não invente números')).toBe(3);
  });

  it('retorna null quando o trecho sumiu', () => {
    expect(findAnchorLine(buildFlatText(['abc']), 'xyz')).toBeNull();
  });

  it('containsTerm casa palavra inteira', () => {
    const flat = buildFlatText(['Vamos realizar a análise']);
    expect(containsTerm(flat, 'real')).toBe(false);
    expect(containsTerm(flat, 'análise')).toBe(true);
  });
});

describe('parse', () => {
  it('normaliza CRLF e espaço inquebrável', () => {
    const doc = parse('# Título\r\n\r\ntexto');
    expect(doc.lines).toEqual(['# Título', '', 'texto']);
    expect(doc.headings[0]?.text).toBe('Título');
  });

  it('marca título sublinhado (setext)', () => {
    const doc = parse(lines('Instruções', '---', '', 'Referência'));
    expect(doc.headings[0]).toMatchObject({ text: 'Instruções', setext: true, level: 2, endLine: 2 });
    expect(doc.hrs).toHaveLength(0);
  });

  it('registra seções ativas por linha', () => {
    const doc = parse(lines('# A', '## Regras', 'texto', '### Sub', 'mais'));
    expect(doc.lineInfo[2]?.sections.map((h) => h.text)).toEqual(['A', 'Regras']);
    expect(doc.lineInfo[4]?.sections.map((h) => h.text)).toEqual(['A', 'Regras', 'Sub']);
  });

  it('detecta bloco de código não fechado', () => {
    const doc = parse(lines('```sql', 'select 1', '', 'resto'));
    expect(doc.fences[0]?.closed).toBe(false);
    expect(parse(lines('```sql', 'select 1', '```')).fences[0]?.closed).toBe(true);
  });

  it('conta palavras em negrito fora de código', () => {
    const doc = parse(lines('Um **dois três** quatro `cinco`', '', '```', 'seis sete', '```'));
    expect(doc.inline.totalWords).toBe(4);
    expect(doc.inline.strongWords).toBe(2);
    expect(doc.inline.strongTexts).toEqual(['dois três']);
  });

  it('associa itens de lista às linhas', () => {
    const doc = parse(lines('1. um', '2. dois', '', '- a', '- b'));
    expect(doc.lists).toHaveLength(2);
    expect(doc.lineInfo[1]).toMatchObject({ listId: 0, itemIndex: 1 });
    expect(doc.lineInfo[4]).toMatchObject({ listId: 1, itemIndex: 1 });
    expect(doc.lists[1]?.items.map((i) => i.text)).toEqual(['a', 'b']);
  });

  it('splitRow respeita \\|', () => {
    expect(splitRow('| a | b \\| c | d |')).toEqual(['a', 'b \\| c', 'd']);
    expect(splitRow('a | b')).toEqual(['a', 'b']);
  });
});
