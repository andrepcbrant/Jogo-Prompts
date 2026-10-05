import type { Level } from '../engine/progression';

/** Títulos da Guilda dos Escribas, do primeiro ao último. */
export const LEVELS: Level[] = [
  {
    title: 'Aprendiz de Tinta',
    minXp: 0,
    description: 'Ainda mancha os dedos, mas já sabe que a forma do texto importa.',
  },
  {
    title: 'Copista',
    minXp: 100,
    description: 'Copia feitiços sem perder nenhuma palavra.',
  },
  {
    title: 'Rubricador',
    minXp: 250,
    description: 'Nos manuscritos, o rubricador pintava os títulos de vermelho para guiar o leitor.',
  },
  {
    title: 'Escriba',
    minXp: 450,
    description: 'Escreve feitiços que outros escribas conseguem ler de primeira.',
  },
  {
    title: 'Iluminador',
    minXp: 700,
    description: 'Destaca só o que merece ouro, e por isso o ouro chama atenção.',
  },
  {
    title: 'Mestre Escriba',
    minXp: 0,
    requiresBoss: true,
    description: 'Fez o Oráculo Confuso obedecer. A guilda curva-se.',
  },
];
