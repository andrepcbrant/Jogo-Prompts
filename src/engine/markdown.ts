import MarkdownIt from 'markdown-it';

/**
 * Única configuração de markdown do jogo: o preview e os validadores leem o
 * texto do mesmo jeito.
 *
 * - html: false       → HTML cru vira texto (primeira camada contra XSS).
 * - typographer: false → `--` e aspas não viram travessão/aspas curvas; o
 *   preview precisa mostrar exatamente o que o jogador escreveu.
 * - linkify: false     → nada aparece "de graça" que o jogador não escreveu.
 */
export const md = new MarkdownIt({
  html: false,
  linkify: false,
  typographer: false,
});

export type MdToken = ReturnType<typeof md.parse>[number];

/**
 * Normaliza diferenças invisíveis que não são lição de markdown:
 * quebras de linha do Windows e espaços inquebráveis colados do Word.
 */
export function normalizeSource(source: string): string {
  return source.replace(/\r\n?/g, '\n').replace(/\u00a0/g, ' ');
}
