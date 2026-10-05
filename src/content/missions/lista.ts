import { defineMission } from '../../engine/mission';

export default defineMission({
  id: 'runa-lista',
  rune: { id: 'lista', name: 'Runa da Lista', symbols: ['-', '1.'] },
  requires: ['runa-titulo'],
  xp: { base: 100, firstTryBonus: 50 },

  narrative: {
    title: 'A Receita do Relatório',
    briefing: [
      'O feitiço já tem seções, mas os passos estão escondidos num parágrafo longo, e a lista de anexos também. O Oráculo pode pular um passo ou fazer na ordem errada.',
      'A Runa da Lista tem duas formas. O número (`1.`, `2.`, `3.`) serve para passos em sequência, quando a ordem importa. O traço (`-`) serve para itens independentes, quando a ordem não importa. Cada item vai numa linha própria, com um espaço depois do símbolo.',
    ],
    why: 'Numeração diz ao modelo “faça nesta ordem e não pule nenhum”. Traço diz “isto é um conjunto, todos valem igual”. Um parágrafo não diz nenhuma das duas coisas.',
    objective:
      'Transforme os passos da Tarefa numa lista numerada, na ordem certa, e os dados anexados do Contexto numa lista com traço.',
    success: 'Passos em ordem, anexos em conjunto. A Runa da Lista é sua.',
  },

  starter: `# Relatório mensal de produção

## Tarefa
Monte o relatório mensal de produção da obra do Viaduto Norte. Primeiro leia os dados anexados, depois separe só os serviços concluídos, em seguida some a produção por frente de serviço e por fim compare o total com a meta do mês.

## Contexto
O relatório vai para a reunião de diretoria. Os dados anexados são a planilha de medição de março, a meta mensal aprovada pela diretoria e a lista de frentes de serviço ativas.`,

  rules: [
    { rule: 'list.syntax' },
    {
      rule: 'list.ordered',
      params: {
        anchors: [
          'leia os dados anexados',
          'separe só os serviços concluídos',
          'some a produção por frente de serviço',
          'compare o total com a meta do mês',
        ],
      },
    },
    {
      rule: 'list.bullet',
      params: {
        anchors: [
          'planilha de medição de março',
          'meta mensal aprovada pela diretoria',
          'lista de frentes de serviço ativas',
        ],
      },
    },
    {
      rule: 'content.preserved',
      params: {
        anchors: ['relatório mensal de produção da obra', 'reunião de diretoria'],
      },
    },
    { rule: 'list.bulletMarker', severity: 'advice' },
  ],

  hints: [
    { cost: 10, text: 'Procure as palavras que indicam ordem: “primeiro”, “depois”, “em seguida”, “por fim”. Cada uma marca um passo.' },
    { cost: 20, text: 'Os passos ficam com número e os anexos ficam com traço. Antes de uma lista, deixe uma linha em branco.' },
    {
      cost: 40,
      text: 'O formato fica assim:',
      example: 'Siga estes passos:\n\n1. Leia os dados anexados.\n2. …\n\nDados anexados:\n\n- planilha de medição de março;\n- …',
    },
  ],

  grimoire: {
    syntax: '1. Primeiro passo\n2. Segundo passo\n\n- item solto\n- outro item',
    whenToUse: 'Número para passos em que a ordem importa. Traço para itens independentes.',
    pitfall: 'Falta de espaço depois do símbolo (`-item`, `1.Passo`) faz a linha virar texto comum.',
  },

  referenceSolution: `# Relatório mensal de produção

## Tarefa
Monte o relatório mensal de produção da obra do Viaduto Norte, seguindo estes passos:

1. Leia os dados anexados.
2. Separe só os serviços concluídos.
3. Some a produção por frente de serviço.
4. Compare o total com a meta do mês.

## Contexto
O relatório vai para a reunião de diretoria. Dados anexados:

- planilha de medição de março;
- meta mensal aprovada pela diretoria;
- lista de frentes de serviço ativas.`,
});
