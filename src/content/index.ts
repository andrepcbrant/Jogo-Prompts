import type { Mission } from '../engine/mission';
import boss from './boss';
import bloco from './missions/bloco';
import citacao from './missions/citacao';
import divisoria from './missions/divisoria';
import enfase from './missions/enfase';
import lista from './missions/lista';
import tabela from './missions/tabela';
import titulo from './missions/titulo';

/**
 * Todas as missões do jogo. Para adicionar uma missão: crie o arquivo em
 * `missions/`, importe aqui e rode `npm test` (o teste de conteúdo confere
 * que a solução de referência passa e que o texto inicial falha).
 */
export const MISSIONS: Mission[] = [titulo, lista, enfase, bloco, divisoria, citacao, tabela];

export const BOSS = boss;

export { LEVELS } from './levels';

export function findMission(id: string): Mission | undefined {
  return MISSIONS.find((m) => m.id === id);
}
