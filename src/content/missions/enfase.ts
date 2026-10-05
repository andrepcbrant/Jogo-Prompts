import { defineMission } from '../../engine/mission';

export default defineMission({
  id: 'runa-enfase',
  rune: { id: 'enfase', name: 'Runa da Ênfase', symbols: ['**', '*'] },
  requires: ['runa-titulo'],
  xp: { base: 100, firstTryBonus: 50 },

  narrative: {
    title: 'O Ouro Gasto à Toa',
    briefing: [
      'Um escriba ansioso copiou este feitiço e pôs negrito em quase tudo. Agora nada se destaca, e a regra que realmente não pode ser quebrada ficou sem destaque nenhum.',
      'A Runa da Ênfase tem duas forças. `**negrito**` (dois asteriscos de cada lado) marca o que não pode ser esquecido. `*itálico*` (um asterisco) dá um toque mais leve, para um termo ou uma nuance. Sem espaço entre os asteriscos e a palavra.',
    ],
    why: 'O destaque funciona por contraste. Se metade do texto está em negrito, o modelo não tem como saber qual regra é a crítica. Use pouco, no que causaria estrago se fosse ignorado.',
    objective:
      'Tire o negrito do que não é crítico e destaque só o que não pode ser esquecido. Deixe pelo menos um trecho em negrito e no máximo 10% do texto.',
    success: 'Agora o ouro brilha onde precisa. A Runa da Ênfase é sua.',
  },

  starter: `# Resumo da reunião de obra

## Tarefa
**Resuma a ata da reunião semanal da obra do Viaduto Norte para a diretoria.**

## Contexto
**A diretoria lê pelo celular**, entre uma reunião e outra, e **tem pouco tempo**. Participaram da reunião as equipes de engenharia, suprimentos e segurança do trabalho. **A ata está anexada** e tem cerca de seis páginas, com muitos números de medição, prazos de entrega e valores de contrato.

## Regras
- **Use no máximo 200 palavras.**
- **Escreva em linguagem formal.**
- Não invente números que não estejam na ata.
- **Se algum ponto estiver ambíguo, sinalize em vez de deduzir.**

## Formato de saída
**Três blocos: decisões, pendências e riscos.** Em cada bloco, use frases curtas e cite o responsável quando a ata informar.`,

  rules: [
    { rule: 'emphasis.syntax' },
    { rule: 'emphasis.boldMin', params: { min: 1 } },
    { rule: 'emphasis.boldMaxRatio', params: { max: 0.1 } },
    {
      rule: 'content.preserved',
      params: {
        anchors: [
          'Resuma a ata da reunião semanal',
          'lê pelo celular',
          'no máximo 200 palavras',
          'linguagem formal',
          'Não invente números que não estejam na ata',
          'sinalize em vez de deduzir',
          'decisões, pendências e riscos',
        ],
      },
    },
    {
      rule: 'emphasis.boldTargets',
      severity: 'advice',
      params: { anyOf: ['Não invente números que não estejam na ata', 'não invente números'] },
    },
  ],

  hints: [
    { cost: 10, text: 'Primeiro apague todos os `**`. Depois pergunte: qual regra, se ignorada, faria a diretoria tomar uma decisão errada?' },
    { cost: 20, text: 'Um número inventado num resumo para a diretoria é o pior erro possível aqui. É essa regra que merece o negrito.' },
    { cost: 40, text: 'A linha das regras fica assim, e o resto do texto sem negrito:', example: '- **Não invente números que não estejam na ata.**' },
  ],

  grimoire: {
    syntax: '**negrito** para o crítico\n*itálico* para um toque leve',
    whenToUse: 'Para a regra que não pode ser esquecida. Pouco: no máximo cerca de 10% do texto.',
    pitfall: '`** texto**` com espaço depois do `**` não vira negrito. Negrito em tudo é o mesmo que negrito em nada.',
  },

  referenceSolution: `# Resumo da reunião de obra

## Tarefa
Resuma a ata da reunião semanal da obra do Viaduto Norte para a diretoria.

## Contexto
A diretoria lê pelo celular, entre uma reunião e outra, e tem pouco tempo. Participaram da reunião as equipes de engenharia, suprimentos e segurança do trabalho. A ata está anexada e tem cerca de seis páginas, com muitos números de medição, prazos de entrega e valores de contrato.

## Regras
- Use no máximo 200 palavras.
- Escreva em linguagem formal.
- **Não invente números que não estejam na ata.**
- Se algum ponto estiver ambíguo, *sinalize* em vez de deduzir.

## Formato de saída
Três blocos: decisões, pendências e riscos. Em cada bloco, use frases curtas e cite o responsável quando a ata informar.`,
});
