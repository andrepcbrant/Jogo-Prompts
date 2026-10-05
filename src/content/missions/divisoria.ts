import { defineMission } from '../../engine/mission';

export default defineMission({
  id: 'runa-divisoria',
  rune: { id: 'divisoria', name: 'Runa da Divisória', symbols: ['---'] },
  requires: ['runa-titulo'],
  xp: { base: 100, firstTryBonus: 50 },

  narrative: {
    title: 'A Linha que Separa',
    briefing: [
      'Este feitiço pede o resumo de uma ata, e a ata vem colada logo depois das regras. Alguém até tentou separar com `---`, mas veja no pergaminho: a última regra virou um título enorme.',
      'A Runa da Divisória é `---`: três hífens sozinhos numa linha, com uma linha em branco antes e outra depois. Sem a linha em branco de cima, o markdown entende que você quis sublinhar o texto anterior e o transforma em título.',
    ],
    why: 'A divisória mostra ao modelo onde terminam as suas instruções e onde começa o material de consulta. Sem ela, uma frase da ata pode ser lida como se fosse uma ordem sua.',
    objective:
      'Separe as instruções (acima) da ata (abaixo) com uma divisória `---` em linha própria, com linha em branco antes e depois.',
    success: 'Instrução de um lado, referência do outro. A Runa da Divisória é sua.',
  },

  starter: `# Resumo da ata

## Tarefa
Resuma a ata abaixo em até cinco tópicos, destacando decisões e responsáveis.

## Regras
Use só o que estiver na ata. Se faltar o responsável por alguma decisão, escreva "sem responsável".
---
Ata da reunião de 12 de março, obra do Viaduto Norte.
Presentes: engenharia, suprimentos e segurança do trabalho.
Decidido trocar o fornecedor de aço a partir de abril (responsável: suprimentos).
Decidido antecipar a concretagem do bloco B.
Pendente: aprovação do novo cronograma de concretagem.`,

  rules: [
    { rule: 'hr.present' },
    { rule: 'hr.notSetext' },
    { rule: 'hr.blankAround' },
    {
      rule: 'hr.between',
      params: {
        before: ['Resuma a ata abaixo', 'sem responsável'],
        after: ['Ata da reunião de 12 de março', 'aprovação do novo cronograma'],
      },
    },
    {
      rule: 'content.preserved',
      params: {
        anchors: [
          'Resuma a ata abaixo em até cinco tópicos',
          'Use só o que estiver na ata',
          'fornecedor de aço',
          'antecipar a concretagem do bloco B',
          'aprovação do novo cronograma',
        ],
      },
    },
  ],

  hints: [
    { cost: 10, text: 'Olhe o pergaminho: a frase das regras virou título. Isso acontece porque o `---` está colado na linha de cima.' },
    { cost: 20, text: 'Deixe uma linha em branco antes do `---` e outra depois. A divisória precisa ficar sozinha.' },
    {
      cost: 40,
      text: 'O trecho fica assim:',
      example: 'Se faltar o responsável por alguma decisão, escreva "sem responsável".\n\n---\n\nAta da reunião de 12 de março, obra do Viaduto Norte.',
    },
  ],

  grimoire: {
    syntax: 'Instruções…\n\n---\n\nMaterial de referência…',
    whenToUse: 'Para separar o que você pede do material que o modelo deve consultar.',
    pitfall: 'Sem linha em branco antes, `---` transforma a linha de cima em título. No celular, o teclado pode trocar `---` por travessão.',
  },

  referenceSolution: `# Resumo da ata

## Tarefa
Resuma a ata abaixo em até cinco tópicos, destacando decisões e responsáveis.

## Regras
Use só o que estiver na ata. Se faltar o responsável por alguma decisão, escreva "sem responsável".

---

Ata da reunião de 12 de março, obra do Viaduto Norte.
Presentes: engenharia, suprimentos e segurança do trabalho.
Decidido trocar o fornecedor de aço a partir de abril (responsável: suprimentos).
Decidido antecipar a concretagem do bloco B.
Pendente: aprovação do novo cronograma de concretagem.`,
});
