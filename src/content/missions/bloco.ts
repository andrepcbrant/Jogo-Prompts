import { defineMission } from '../../engine/mission';

export default defineMission({
  id: 'runa-bloco',
  rune: { id: 'bloco', name: 'Runa do Bloco', symbols: ['```', '`'] },
  requires: ['runa-titulo'],
  xp: { base: 100, firstTryBonus: 50 },

  narrative: {
    title: 'O Cofre de Crases',
    briefing: [
      'Um analista quer que o Oráculo explique por que uma consulta soma a produção em dobro. Mas a consulta e os dados estão colados no meio do texto, como se fossem parte do pedido.',
      'A Runa do Bloco guarda conteúdo que deve ser lido ao pé da letra. Três crases (```) numa linha abrem o bloco, e outras três numa linha fecham. Logo depois das crases de abertura vai o nome da linguagem, como ```sql. Para um nome curto no meio da frase, como um arquivo, use uma crase de cada lado: `assim`.',
    ],
    why: 'Dentro do bloco, o modelo entende que aquilo é material exato, não instrução. Ele não “corrige” o código sem querer, não confunde dados com pedido e sabe em que linguagem responder.',
    objective:
      'Coloque a consulta num bloco com a linguagem `sql`, a amostra de dados em outro bloco e o nome do arquivo entre crases simples.',
    success: 'Código e dados guardados no cofre, sem se misturar ao pedido. A Runa do Bloco é sua.',
  },

  starter: `# Revisão de consulta

## Tarefa
Explique por que a consulta abaixo soma a produção em dobro e proponha a correção. A tabela medicoes é gerada a partir do arquivo medicao_marco.xlsx.

## Consulta
SELECT frente, SUM(valor_medido) AS total
FROM medicoes m
JOIN frentes f ON f.obra_id = m.obra_id
GROUP BY frente;

## Amostra dos dados
frente,valor_medido
Terraplenagem,120000
Drenagem,45000

## Formato de saída
Primeiro a causa em uma frase, depois a consulta corrigida.`,

  rules: [
    { rule: 'code.fenceClosed' },
    {
      rule: 'code.fenced',
      params: {
        anchors: ['SELECT frente', 'GROUP BY frente'],
        what: 'a consulta SQL',
        languages: ['sql'],
      },
    },
    {
      rule: 'code.fenced',
      params: { anchors: ['frente,valor_medido', 'Drenagem,45000'], what: 'a amostra de dados' },
    },
    { rule: 'code.inline', params: { anchors: ['medicao_marco.xlsx'] } },
    {
      rule: 'content.preserved',
      params: {
        anchors: [
          'soma a produção em dobro',
          'JOIN frentes f ON f.obra_id = m.obra_id',
          'Terraplenagem,120000',
          'a causa em uma frase',
        ],
      },
    },
  ],

  hints: [
    { cost: 10, text: 'Três crases (```) sozinhas numa linha abrem o bloco. Outras três, também sozinhas numa linha, fecham. Tudo entre elas fica guardado.' },
    { cost: 20, text: 'Na linha que abre o bloco da consulta, escreva `sql` colado nas crases. A amostra de dados pode ficar num bloco sem linguagem (ou com `csv`).' },
    {
      cost: 40,
      text: 'A seção da consulta fica assim:',
      example: '## Consulta\n```sql\nSELECT frente, SUM(valor_medido) AS total\n…\nGROUP BY frente;\n```',
    },
  ],

  grimoire: {
    syntax: '```sql\nSELECT * FROM obras;\n```\n\nO arquivo `medicao.xlsx`',
    whenToUse: 'Para código, dados e qualquer texto que deve ser lido exatamente como está. Crase simples para nomes curtos no meio da frase.',
    pitfall: 'Bloco sem as crases de fechamento engole todo o resto do texto. Informe a linguagem quando for código.',
  },

  referenceSolution: `# Revisão de consulta

## Tarefa
Explique por que a consulta abaixo soma a produção em dobro e proponha a correção. A tabela \`medicoes\` é gerada a partir do arquivo \`medicao_marco.xlsx\`.

## Consulta
\`\`\`sql
SELECT frente, SUM(valor_medido) AS total
FROM medicoes m
JOIN frentes f ON f.obra_id = m.obra_id
GROUP BY frente;
\`\`\`

## Amostra dos dados
\`\`\`csv
frente,valor_medido
Terraplenagem,120000
Drenagem,45000
\`\`\`

## Formato de saída
Primeiro a causa em uma frase, depois a consulta corrigida.`,
});
