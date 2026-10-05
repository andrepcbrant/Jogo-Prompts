import { defineBoss } from '../engine/mission';

const section = (label: string, aliases: string[] = []) => ({
  rule: 'heading.requiredSections' as const,
  label: `Seção “${label}” com \`##\``,
  params: { level: 2, sections: [{ label, aliases }] },
});

export default defineBoss({
  id: 'oraculo',
  name: 'O Oráculo Confuso',
  requires: [
    'runa-titulo',
    'runa-lista',
    'runa-enfase',
    'runa-bloco',
    'runa-divisoria',
    'runa-citacao',
    'runa-tabela',
  ],
  xp: { base: 200 },
  passScore: 70,

  narrative: {
    title: 'O Oráculo Confuso',
    briefing: [
      'No fundo do scriptorium mora o Oráculo Confuso. Ele sabe responder quase tudo, mas só obedece a feitiços bem escritos: diante de um texto embolado, ele inventa, pula etapas e mistura quem disse o quê.',
      'Um gerente de obra deixou o pedido abaixo, do jeito que falaria numa conversa. Reescreva-o como um feitiço completo. Nenhuma dica desta vez: o Grimório é tudo o que você tem.',
    ],
    objective:
      'Escreva o prompt completo, com as seções Tarefa, Contexto, Regras e Formato de saída, usando bem pelo menos 5 das 7 runas. Para vencer, cumpra os itens obrigatórios e faça pelo menos 70 pontos.',
    victory: 'O Oráculo silencia, lê o feitiço inteiro e obedece. Você é Mestre Escriba.',
    defeat: 'O Oráculo ainda se confunde. Veja o que faltou na lista e lance de novo.',
  },

  starter: `Oi! Preciso que a IA me ajude a fechar a análise de março da obra do Viaduto Norte. Tenho duas planilhas anexadas: a do real, com a produção medida, e a do replan, com o que a gente replanejou em fevereiro. Quero saber, item por item, onde o real ficou abaixo ou acima do replan, quanto isso dá em reais e em porcentagem. Considera só os itens com diferença maior que 5%. Não quero que ela invente causa para desvio: se não souber, que diga que precisa confirmar com a equipe de produção. As duas planilhas têm uma coluna de código que é igual nas duas, e é por ela que tem que cruzar, não pela descrição. O resultado vai para o relatório da diretoria, então tem que vir numa tabela com código, descrição, real, replan, diferença e diferença em porcentagem, ordenada pelo maior desvio, e depois um parágrafo curto com os três pontos de atenção. Ah, o e-mail do coordenador que pediu isso diz: "Preciso disso até quinta, com foco em terraplenagem e drenagem, que foram os itens que mais preocuparam na última reunião."`,

  items: [
    { id: 'secao-tarefa', points: 10, mandatory: true, check: section('Tarefa') },
    { id: 'secao-contexto', points: 10, mandatory: true, check: section('Contexto') },
    { id: 'secao-regras', points: 10, mandatory: true, check: section('Regras', ['Restrições']) },
    {
      id: 'secao-formato',
      points: 10,
      mandatory: true,
      check: section('Formato de saída', ['Formato', 'Saída']),
    },
    { id: 'runas', points: 15, mandatory: true, check: { rule: 'runes.used', params: { min: 5 } } },
    { id: 'titulo-unico', points: 5, check: { rule: 'heading.h1.exactlyOne' } },
    { id: 'niveis', points: 5, check: { rule: 'heading.noSkippedLevels' } },
    {
      id: 'cruzar-codigo',
      points: 5,
      check: {
        rule: 'content.mentions',
        params: { label: 'que o cruzamento é pelo código', anyOf: ['código', 'codigo'] },
      },
    },
    {
      id: 'limite',
      points: 5,
      check: {
        rule: 'content.mentions',
        params: { label: 'o limite de 5% de diferença', anyOf: ['5%', '5 %', 'cinco por cento'] },
      },
    },
    {
      id: 'nao-inventar',
      points: 5,
      check: {
        rule: 'content.mentions',
        params: {
          label: 'a proibição de inventar causas',
          anyOf: ['não invente', 'não inventar', 'nunca invente', 'sem inventar', 'invente'],
        },
      },
    },
    {
      id: 'ordenacao',
      points: 5,
      check: {
        rule: 'content.mentions',
        params: {
          label: 'a ordenação pelo maior desvio',
          anyOf: ['maior desvio', 'ordenada', 'ordenado', 'ordene', 'ordenar', 'ordem decrescente'],
        },
      },
    },
    {
      id: 'foco',
      points: 5,
      check: {
        rule: 'content.mentions',
        params: { label: 'os itens de foco do coordenador', anyOf: ['terraplenagem'] },
      },
    },
    {
      id: 'citacao',
      points: 5,
      check: {
        rule: 'quote.present',
        label: 'O e-mail do coordenador marcado como citação',
        messages: {
          none: 'O e-mail do coordenador é texto de outra pessoa. Marque-o com `> ` no começo de cada linha.',
        },
      },
    },
    { id: 'negrito', points: 5, check: { rule: 'emphasis.boldMaxRatio', params: { max: 0.1 } } },
  ],

  referenceSolution: `# Análise real x replan de março

## Tarefa
Compare a produção real de março da obra do Viaduto Norte com o replan, item por item, e aponte onde o real ficou abaixo ou acima do planejado.

## Contexto
O resultado vai para o relatório da diretoria. Há duas planilhas anexadas:

- \`real_marco.xlsx\`: produção medida em março;
- \`replan_fevereiro.xlsx\`: produção replanejada em fevereiro.

O coordenador pediu a análise com este e-mail:

> Preciso disso até quinta, com foco em terraplenagem e drenagem,
> que foram os itens que mais preocuparam na última reunião.

## Regras
1. Cruze as planilhas pela coluna de código, nunca pela descrição.
2. Considere só os itens com diferença maior que 5%.
3. Calcule a diferença em reais e em porcentagem.

**Não invente causas para os desvios.** Se não souber a causa, diga que precisa confirmar com a equipe de produção.

---

## Formato de saída
Uma tabela ordenada pelo maior desvio, com estas colunas:

| Código | Descrição | Real (R$) | Replan (R$) | Diferença (R$) | Diferença (%) |
| --- | --- | --- | --- | --- | --- |

Depois da tabela, um parágrafo curto com os três pontos de atenção.`,
});
