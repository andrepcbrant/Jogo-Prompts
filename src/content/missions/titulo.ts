import { defineMission } from '../../engine/mission';

export default defineMission({
  id: 'runa-titulo',
  rune: { id: 'titulo', name: 'Runa do Título', symbols: ['#', '##', '###'] },
  requires: [],
  xp: { base: 100, firstTryBonus: 50 },

  narrative: {
    title: 'O Pergaminho Embolado',
    briefing: [
      'Aprendiz, um engenheiro deixou este pedido na mesa da guilda. O conteúdo está certo, mas está tudo junto. O Oráculo lê de cima a baixo e não sabe onde termina a tarefa e onde começa a regra.',
      'A Runa do Título dá nome às partes de um feitiço. `#` marca o título do feitiço inteiro. `##` marca cada seção. `###` marca uma subseção dentro de uma seção. Sempre com um espaço depois dos símbolos, sempre no começo da linha.',
    ],
    why: 'Títulos dizem ao modelo qual papel cada trecho tem. Uma frase sob “## Regras” pesa como regra, e não como comentário solto no meio do texto.',
    objective:
      'Dê ao pedido um título com `#` e divida-o nas seções `## Tarefa`, `## Contexto`, `## Regras` e `## Formato de saída`. Mova cada frase para a seção certa, sem apagar nenhuma informação.',
    success: 'Agora o Oráculo vê onde cada parte começa. A Runa do Título é sua.',
  },

  starter:
    'Você vai me ajudar a resumir a ata da reunião semanal da obra do Viaduto Norte para a diretoria. Participaram engenharia, suprimentos e segurança do trabalho. A diretoria lê pelo celular e tem pouco tempo. Não invente números que não estejam na ata. Use no máximo 200 palavras. Se algum ponto estiver ambíguo, sinalize em vez de deduzir. Entregue em três blocos: decisões, pendências e riscos.',

  rules: [
    { rule: 'heading.syntax' },
    { rule: 'heading.h1.exactlyOne' },
    { rule: 'heading.minCount', params: { level: 2, min: 2 } },
    { rule: 'heading.noSkippedLevels' },
    {
      rule: 'content.preserved',
      params: {
        anchors: [
          'resumir a ata da reunião semanal',
          'Viaduto Norte',
          'engenharia, suprimentos e segurança do trabalho',
          'lê pelo celular',
          'Não invente números',
          'no máximo 200 palavras',
          'sinalize em vez de deduzir',
          'decisões, pendências e riscos',
        ],
      },
    },
    {
      rule: 'heading.requiredSections',
      severity: 'advice',
      params: {
        level: 2,
        sections: [
          { label: 'Tarefa' },
          { label: 'Contexto' },
          { label: 'Regras', aliases: ['Restrições'] },
          { label: 'Formato de saída', aliases: ['Formato', 'Saída'] },
        ],
      },
    },
    {
      rule: 'content.inSection',
      severity: 'advice',
      params: {
        placements: [
          { anchor: 'resumir a ata da reunião semanal', sections: ['Tarefa'] },
          { anchor: 'lê pelo celular', sections: ['Contexto'] },
          { anchor: 'Não invente números', sections: ['Regras', 'Restrições'] },
          { anchor: 'sinalize em vez de deduzir', sections: ['Regras', 'Restrições'] },
          { anchor: 'decisões, pendências e riscos', sections: ['Formato'] },
        ],
      },
    },
  ],

  hints: [
    { cost: 10, text: 'Comece pela primeira linha: um único `#`, um espaço e o nome do pedido. Por exemplo: `# Resumo da reunião de obra`.' },
    { cost: 20, text: 'Cada seção começa com `##` numa linha só dela. O texto da seção vem nas linhas de baixo. Deixe uma linha em branco entre as seções para facilitar a leitura.' },
    {
      cost: 40,
      text: 'Este é o esqueleto. Agora distribua as frases do pedido entre as seções:',
      example: '# Resumo da reunião de obra\n\n## Tarefa\n…\n\n## Contexto\n…\n\n## Regras\n…\n\n## Formato de saída\n…',
    },
  ],

  grimoire: {
    syntax: '# Título do feitiço\n## Seção\n### Subseção',
    whenToUse: 'Para dividir o prompt em partes com papéis diferentes: tarefa, contexto, regras, formato de saída.',
    pitfall: 'Sempre um espaço depois do `#`: `#Tarefa` não vira título. Não pule de `#` direto para `###`.',
  },

  referenceSolution: `# Resumo da reunião de obra

## Tarefa
Você vai me ajudar a resumir a ata da reunião semanal da obra do Viaduto Norte para a diretoria.

## Contexto
Participaram engenharia, suprimentos e segurança do trabalho. A diretoria lê pelo celular e tem pouco tempo.

## Regras
Não invente números que não estejam na ata. Use no máximo 200 palavras. Se algum ponto estiver ambíguo, sinalize em vez de deduzir.

## Formato de saída
Entregue em três blocos: decisões, pendências e riscos.`,
});
