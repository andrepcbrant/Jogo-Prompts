import type { RuneId } from '../engine/runes';

/*
 * Inserção de runas pela barra de botões. As edições passam por
 * `execCommand('insertText')` quando o navegador permite, para que o
 * Ctrl+Z continue funcionando; senão, caem para `setRangeText`.
 */

export type ToolKind = 'prefix' | 'wrap' | 'block' | 'divider' | 'insert' | 'tableDelimiter';

export interface Tool {
  label: string;
  /** Nome falado pelo leitor de tela. */
  name: string;
  kind: ToolKind;
  text: string;
}

export const TOOLS: Record<RuneId, Tool[]> = {
  titulo: [
    { label: '#', name: 'Título do feitiço', kind: 'prefix', text: '# ' },
    { label: '##', name: 'Seção', kind: 'prefix', text: '## ' },
    { label: '###', name: 'Subseção', kind: 'prefix', text: '### ' },
  ],
  lista: [
    { label: '-', name: 'Item com traço', kind: 'prefix', text: '- ' },
    { label: '1.', name: 'Passo numerado', kind: 'prefix', text: '1. ' },
  ],
  enfase: [
    { label: '**', name: 'Negrito', kind: 'wrap', text: '**' },
    { label: '*', name: 'Itálico', kind: 'wrap', text: '*' },
  ],
  bloco: [
    { label: '```', name: 'Bloco de código', kind: 'block', text: '```' },
    { label: '`', name: 'Código no meio da frase', kind: 'wrap', text: '`' },
  ],
  divisoria: [{ label: '---', name: 'Divisória', kind: 'divider', text: '---' }],
  citacao: [{ label: '>', name: 'Citação', kind: 'prefix', text: '> ' }],
  tabela: [
    { label: '|', name: 'Separador de coluna', kind: 'insert', text: '| ' },
    { label: '|---|', name: 'Linha de separação da tabela', kind: 'tableDelimiter', text: '' },
  ],
};

export function toolsFor(runes: RuneId[]): Tool[] {
  return runes.flatMap((id) => TOOLS[id]);
}

function replaceRange(
  textarea: HTMLTextAreaElement,
  start: number,
  end: number,
  text: string,
  caret: [number, number],
) {
  textarea.focus();
  textarea.setSelectionRange(start, end);
  let done: boolean;
  try {
    done = document.execCommand('insertText', false, text);
  } catch {
    done = false;
  }
  if (!done) {
    textarea.setRangeText(text, start, end, 'end');
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
  }
  textarea.setSelectionRange(caret[0], caret[1]);
}

const lineStartOf = (value: string, index: number) => value.lastIndexOf('\n', index - 1) + 1;

function lineEndOf(value: string, index: number) {
  const end = value.indexOf('\n', index);
  return end < 0 ? value.length : end;
}

export function applyTool(textarea: HTMLTextAreaElement, tool: Tool): void {
  const { value, selectionStart: start, selectionEnd: end } = textarea;

  switch (tool.kind) {
    case 'prefix': {
      // Aplica o prefixo a todas as linhas selecionadas.
      const from = lineStartOf(value, start);
      const to = lineEndOf(value, Math.max(start, end - (end > start && value[end - 1] === '\n' ? 1 : 0)));
      const block = value.slice(from, to);
      const lines = block.split('\n');
      const next = lines.map((line) => tool.text + line).join('\n');
      const caret: [number, number] =
        lines.length === 1 ? [start + tool.text.length, end + tool.text.length] : [from, from + next.length];
      replaceRange(textarea, from, to, next, caret);
      return;
    }
    case 'wrap': {
      const selected = value.slice(start, end);
      const next = `${tool.text}${selected}${tool.text}`;
      const inner = start + tool.text.length;
      replaceRange(textarea, start, end, next, [inner, inner + selected.length]);
      return;
    }
    case 'block': {
      const selected = value.slice(start, end);
      const atLineStart = start === lineStartOf(value, start);
      const lead = atLineStart ? '' : '\n';
      const body = selected.length > 0 ? `${selected.replace(/\n$/, '')}\n` : '\n';
      const next = `${lead}${tool.text}\n${body}${tool.text}\n`;
      // Cursor logo depois das crases de abertura, para digitar a linguagem.
      const caret = start + lead.length + tool.text.length;
      replaceRange(textarea, start, end, next, [caret, caret]);
      return;
    }
    case 'divider': {
      const before = value.slice(0, start);
      const lead = before.length === 0 || before.endsWith('\n\n') ? '' : before.endsWith('\n') ? '\n' : '\n\n';
      const after = value.slice(end);
      const trail = after.startsWith('\n\n') ? '' : after.startsWith('\n') ? '\n' : '\n\n';
      const next = `${lead}${tool.text}${trail}`;
      const caret = start + next.length;
      replaceRange(textarea, start, end, next, [caret, caret]);
      return;
    }
    case 'tableDelimiter': {
      // Gera `| --- | --- |` com o número de colunas da linha anterior.
      // Numa linha vazia, o cabeçalho é a linha de cima; senão, é a própria
      // linha, e a separação entra logo abaixo dela.
      const from = lineStartOf(value, start);
      const onEmptyLine = value.slice(from, lineEndOf(value, start)).trim() === '';
      const header = onEmptyLine
        ? value.slice(lineStartOf(value, Math.max(0, from - 1)), Math.max(0, from - 1))
        : value.slice(from, lineEndOf(value, start));
      const cells = header.includes('|')
        ? header.trim().replace(/^\|/, '').replace(/\|$/, '').split(/(?<!\\)\|/).length
        : 3;
      const row = `|${' --- |'.repeat(cells)}`;
      const at = onEmptyLine ? start : lineEndOf(value, start);
      const next = onEmptyLine ? `${row}\n` : `\n${row}`;
      const caret = at + next.length;
      replaceRange(textarea, at, onEmptyLine ? end : at, next, [caret, caret]);
      return;
    }
    case 'insert': {
      const caret = start + tool.text.length;
      replaceRange(textarea, start, end, tool.text, [caret, caret]);
      return;
    }
  }
}

/** Seleciona uma linha do editor (usado pelo “Ir para a linha” do feedback). */
export function selectLine(textarea: HTMLTextAreaElement, line: number): void {
  const lines = textarea.value.split('\n');
  const index = Math.min(Math.max(1, line), lines.length) - 1;
  let start = 0;
  for (let i = 0; i < index; i++) start += (lines[i]?.length ?? 0) + 1;
  const end = start + (lines[index]?.length ?? 0);
  textarea.focus();
  textarea.setSelectionRange(start, end);
  const lineHeight = parseFloat(getComputedStyle(textarea).lineHeight) || 24;
  textarea.scrollTop = Math.max(0, index * lineHeight - textarea.clientHeight / 3);
}
