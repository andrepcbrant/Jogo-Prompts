import { defineMission } from '../../engine/mission';

export default defineMission({
  id: 'runa-tabela',
  rune: { id: 'tabela', name: 'Runa da Tabela', symbols: ['|', '---'] },
  requires: ['runa-lista'],
  xp: { base: 100, firstTryBonus: 50 },

  narrative: {
    title: 'O Quadro Comparativo',
    briefing: [
      'O feitiço pede ao Oráculo que compare a produção real com o replan. Alguém começou uma tabela, mas esqueceu a linha de separação, deixou um `|` perdido numa célula e escreveu dois serviços em texto corrido.',
      'A Runa da Tabela organiza itens que têm os mesmos atributos. A primeira linha é o cabeçalho, com os nomes das colunas entre `|`. A segunda linha é a separação, com um `---` para cada coluna. Depois vem uma linha por item, sempre com o mesmo número de colunas.',
    ],
    why: 'Na tabela, o modelo vê que cada número pertence a um serviço e a uma coluna. Em texto corrido, é fácil ele trocar o real pelo replan ou misturar serviços.',
    objective:
      'Conserte a tabela: inclua a linha de separação, tire o `|` solto da célula do concreto e transforme Drenagem e Pavimentação em linhas da tabela.',
    success: 'Cada número no seu lugar. A Runa da Tabela é sua.',
  },

  starter: `# Comparativo real x replan

## Tarefa
Compare a produção real com o replan de março e aponte os dois serviços com maior desvio.

## Dados
| Serviço | Real (R$) | Replan (R$) |
| Terraplenagem | 410.000 | 450.000 |
| Concreto | fck 30 | 380.000 | 300.000 |
Drenagem teve 95.000 de real contra 120.000 de replan.
Pavimentação teve 210.000 de real contra 200.000 de replan.`,

  rules: [
    { rule: 'table.present' },
    { rule: 'table.delimiterRow' },
    { rule: 'table.consistentColumns' },
    { rule: 'table.noStrayPipe' },
    {
      rule: 'table.contains',
      params: {
        columns: ['Serviço', 'Real', 'Replan'],
        rows: ['Terraplenagem', 'Concreto', 'Drenagem', 'Pavimentação'],
      },
    },
    {
      rule: 'content.preserved',
      params: {
        anchors: ['maior desvio', '410.000', '380.000', '95.000', '120.000', '210.000', '200.000', 'fck 30'],
      },
    },
  ],

  hints: [
    { cost: 10, text: 'Logo abaixo do cabeçalho, escreva a linha de separação: `| --- | --- | --- |`, um `---` para cada coluna.' },
    { cost: 20, text: 'Na linha do concreto, “fck 30” faz parte do nome do serviço. O `|` entre “Concreto” e “fck 30” cria uma coluna a mais: tire-o.' },
    {
      cost: 40,
      text: 'As últimas linhas da tabela ficam assim:',
      example: '| Concreto fck 30 | 380.000 | 300.000 |\n| Drenagem | 95.000 | 120.000 |\n| Pavimentação | 210.000 | 200.000 |',
    },
  ],

  grimoire: {
    syntax: '| Item | Real | Replan |\n| --- | --- | --- |\n| Aço | 10 | 12 |',
    whenToUse: 'Para comparar vários itens que têm os mesmos atributos.',
    pitfall: 'Sem a linha `| --- |` não existe tabela. Um `|` dentro de célula cria coluna a mais; use `\\|` se precisar dele.',
  },

  referenceSolution: `# Comparativo real x replan

## Tarefa
Compare a produção real com o replan de março e aponte os dois serviços com maior desvio.

## Dados
| Serviço | Real (R$) | Replan (R$) |
| --- | --- | --- |
| Terraplenagem | 410.000 | 450.000 |
| Concreto fck 30 | 380.000 | 300.000 |
| Drenagem | 95.000 | 120.000 |
| Pavimentação | 210.000 | 200.000 |`,
});
