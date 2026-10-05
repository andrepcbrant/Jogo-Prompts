import { md, normalizeSource, type MdToken } from './markdown';
import { buildFlatText, countWords, type FlatText } from './text';

/*
 * Converte o texto do jogador num modelo simples e consultável pelas regras.
 * Todas as linhas são 1-based, como o jogador as vê.
 */

export interface Heading {
  level: number;
  text: string;
  line: number;
  /** Última linha do título (no título "sublinhado", a linha do `---`). */
  endLine: number;
  /** Título "sublinhado" (texto + linha de `---` ou `===` embaixo). */
  setext: boolean;
}

export interface ListItem {
  index: number;
  line: number;
  endLine: number;
  text: string;
}

export interface ListBlock {
  id: number;
  ordered: boolean;
  /** Marcador do primeiro item: `-`, `*`, `+`, `.` ou `)`. */
  marker: string;
  line: number;
  endLine: number;
  depth: number;
  items: ListItem[];
}

export interface Fence {
  line: number;
  endLine: number;
  info: string;
  content: string;
  closed: boolean;
}

export interface Hr {
  line: number;
  markup: string;
}

export interface Block {
  line: number;
  endLine: number;
}

export interface CodeSpan {
  content: string;
  line: number | null;
}

export interface InlineStats {
  totalWords: number;
  strongWords: number;
  strongCount: number;
  emCount: number;
  strongTexts: string[];
  codeSpans: CodeSpan[];
  /** Linhas com `**` que não viraram negrito. */
  unparsedStrongLines: number[];
}

export interface LineInfo {
  listId: number | null;
  itemIndex: number | null;
  quote: boolean;
  fence: boolean;
  table: boolean;
  /** Pilha de títulos ativos nesta linha (do mais externo ao mais interno). */
  sections: Heading[];
}

export interface Doc {
  source: string;
  lines: string[];
  tokens: MdToken[];
  headings: Heading[];
  lists: ListBlock[];
  fences: Fence[];
  hrs: Hr[];
  quotes: Block[];
  tables: Block[];
  inline: InlineStats;
  lineInfo: LineInfo[];
  flat: FlatText;
}

const FENCE_CLOSE = /^\s{0,3}(`{3,}|~{3,})\s*$/;

function isFenceClosed(token: MdToken, lines: string[]): boolean {
  if (!token.map) return false;
  const [start, end] = token.map;
  if (end - start < 2) return false;
  const closing = lines[end - 1] ?? '';
  const match = FENCE_CLOSE.exec(closing);
  if (!match?.[1]) return false;
  return match[1][0] === token.markup[0] && match[1].length >= token.markup.length;
}

function lineOfInline(token: MdToken, lines: string[], needle: string): number | null {
  if (!token.map) return null;
  const [start, end] = token.map;
  for (let i = start; i < end; i++) {
    if ((lines[i] ?? '').includes(needle)) return i + 1;
  }
  return start + 1;
}

export function parse(input: string): Doc {
  const source = normalizeSource(input);
  const lines = source.split('\n');
  const tokens = md.parse(source, {});

  const lineInfo: LineInfo[] = lines.map(() => ({
    listId: null,
    itemIndex: null,
    quote: false,
    fence: false,
    table: false,
    sections: [],
  }));
  const mark = (map: [number, number] | null, apply: (info: LineInfo) => void) => {
    if (!map) return;
    for (let i = map[0]; i < map[1] && i < lineInfo.length; i++) {
      const info = lineInfo[i];
      if (info) apply(info);
    }
  };

  const headings: Heading[] = [];
  const lists: ListBlock[] = [];
  const listStack: ListBlock[] = [];
  const fences: Fence[] = [];
  const hrs: Hr[] = [];
  const quotes: Block[] = [];
  const tables: Block[] = [];
  const inline: InlineStats = {
    totalWords: 0,
    strongWords: 0,
    strongCount: 0,
    emCount: 0,
    strongTexts: [],
    codeSpans: [],
    unparsedStrongLines: [],
  };

  for (let t = 0; t < tokens.length; t++) {
    const token = tokens[t];
    if (!token) continue;
    switch (token.type) {
      case 'heading_open': {
        const content = tokens[t + 1]?.type === 'inline' ? (tokens[t + 1]?.content ?? '') : '';
        headings.push({
          level: Number(token.tag.slice(1)),
          text: content.trim(),
          line: (token.map?.[0] ?? 0) + 1,
          endLine: token.map?.[1] ?? 0,
          setext: !token.markup.startsWith('#'),
        });
        break;
      }
      case 'bullet_list_open':
      case 'ordered_list_open': {
        const list: ListBlock = {
          id: lists.length,
          ordered: token.type === 'ordered_list_open',
          marker: tokens[t + 1]?.markup ?? token.markup,
          line: (token.map?.[0] ?? 0) + 1,
          endLine: token.map?.[1] ?? 0,
          depth: listStack.length,
          items: [],
        };
        lists.push(list);
        listStack.push(list);
        mark(token.map, (info) => {
          info.listId = list.id;
          info.itemIndex = null;
        });
        break;
      }
      case 'bullet_list_close':
      case 'ordered_list_close':
        listStack.pop();
        break;
      case 'list_item_open': {
        const list = listStack[listStack.length - 1];
        if (!list) break;
        const item: ListItem = {
          index: list.items.length,
          line: (token.map?.[0] ?? 0) + 1,
          endLine: token.map?.[1] ?? 0,
          text: '',
        };
        list.items.push(item);
        mark(token.map, (info) => {
          info.listId = list.id;
          info.itemIndex = item.index;
        });
        break;
      }
      case 'fence':
        fences.push({
          line: (token.map?.[0] ?? 0) + 1,
          endLine: token.map?.[1] ?? 0,
          info: token.info.trim(),
          content: token.content,
          closed: isFenceClosed(token, lines),
        });
        mark(token.map, (info) => (info.fence = true));
        break;
      case 'code_block':
        mark(token.map, (info) => (info.fence = true));
        break;
      case 'hr':
        hrs.push({ line: (token.map?.[0] ?? 0) + 1, markup: token.markup });
        break;
      case 'blockquote_open':
        quotes.push({ line: (token.map?.[0] ?? 0) + 1, endLine: token.map?.[1] ?? 0 });
        mark(token.map, (info) => (info.quote = true));
        break;
      case 'table_open':
        tables.push({ line: (token.map?.[0] ?? 0) + 1, endLine: token.map?.[1] ?? 0 });
        mark(token.map, (info) => (info.table = true));
        break;
      case 'inline': {
        const list = listStack[listStack.length - 1];
        const item = list?.items[list.items.length - 1];
        if (item && item.text === '') item.text = token.content.trim();
        collectInline(token, lines, inline);
        break;
      }
    }
  }

  // Pilha de seções: cada linha sabe sob quais títulos está.
  const stack: Heading[] = [];
  let next = 0;
  lineInfo.forEach((info, i) => {
    const heading = headings[next];
    if (heading && heading.line === i + 1) {
      while (stack.length > 0 && (stack[stack.length - 1]?.level ?? 0) >= heading.level) {
        stack.pop();
      }
      stack.push(heading);
      next++;
    }
    info.sections = [...stack];
  });

  return {
    source,
    lines,
    tokens,
    headings,
    lists,
    fences,
    hrs,
    quotes,
    tables,
    inline,
    lineInfo,
    flat: buildFlatText(lines),
  };
}

function collectInline(token: MdToken, lines: string[], stats: InlineStats) {
  let strongDepth = 0;
  let strongBuffer = '';
  for (const child of token.children ?? []) {
    switch (child.type) {
      case 'strong_open':
        strongDepth++;
        stats.strongCount++;
        break;
      case 'strong_close':
        strongDepth = Math.max(0, strongDepth - 1);
        if (strongDepth === 0) {
          stats.strongTexts.push(strongBuffer.trim());
          strongBuffer = '';
        }
        break;
      case 'em_open':
        stats.emCount++;
        break;
      case 'code_inline':
        stats.codeSpans.push({ content: child.content, line: lineOfInline(token, lines, child.content) });
        break;
      case 'text': {
        const words = countWords(child.content);
        stats.totalWords += words;
        if (strongDepth > 0) {
          stats.strongWords += words;
          strongBuffer += child.content;
        }
        if (child.content.includes('**')) {
          const line = lineOfInline(token, lines, '**');
          if (line !== null) stats.unparsedStrongLines.push(line);
        }
        break;
      }
      case 'softbreak':
      case 'hardbreak':
        if (strongDepth > 0) strongBuffer += ' ';
        break;
    }
  }
}

/** Linhas que parecem tabela: 2+ linhas seguidas com `|`, fora de código. */
export function tableLikeBlocks(doc: Doc): Block[] {
  const blocks: Block[] = [];
  let start: number | null = null;
  doc.lines.forEach((line, i) => {
    const candidate = line.includes('|') && !doc.lineInfo[i]?.fence;
    if (candidate && start === null) start = i;
    if (!candidate && start !== null) {
      if (i - start >= 2) blocks.push({ line: start + 1, endLine: i });
      start = null;
    }
  });
  if (start !== null && doc.lines.length - start >= 2) {
    blocks.push({ line: start + 1, endLine: doc.lines.length });
  }
  return blocks;
}

/** Divide uma linha de tabela em células, respeitando `\|`. */
export function splitRow(line: string): string[] {
  let body = line.trim();
  if (body.startsWith('|')) body = body.slice(1);
  if (body.endsWith('|') && !body.endsWith('\\|')) body = body.slice(0, -1);
  return body.split(/(?<!\\)\|/).map((cell) => cell.trim());
}

export const DELIMITER_ROW = /^\s*\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)*\|?\s*$/;
