import type { RuleRef } from './rules';
import type { RuneId } from './runes';

export interface Hint {
  /** XP descontado da recompensa da missão ao revelar a dica. */
  cost: number;
  text: string;
  /** Trecho de markdown mostrado junto com a dica (por exemplo, um esqueleto). */
  example?: string;
}

export interface GrimoireEntry {
  /** Cola curta da sintaxe, mostrada em fonte monoespaçada. */
  syntax: string;
  whenToUse: string;
  pitfall: string;
}

export interface Mission {
  id: string;
  rune: {
    id: RuneId;
    name: string;
    /** Símbolos que a runa ensina, usados no mapa e na barra de runas. */
    symbols: string[];
  };
  /** Ids das missões que precisam estar concluídas antes desta. */
  requires: string[];
  xp: { base: number; firstTryBonus: number };
  narrative: {
    title: string;
    briefing: string[];
    /** Por que a estrutura muda a leitura do modelo. */
    why: string;
    objective: string;
    success: string;
  };
  /** Texto que aparece no editor ao começar a missão. */
  starter: string;
  rules: RuleRef[];
  hints: Hint[];
  grimoire: GrimoireEntry;
  /** Uma resposta que passa em todas as regras. Usada nos testes de conteúdo. */
  referenceSolution: string;
}

export interface BossItem {
  id: string;
  points: number;
  /** Sem este item o Oráculo não é vencido, qualquer que seja a nota. */
  mandatory?: boolean;
  check: RuleRef;
}

export interface Boss {
  id: string;
  name: string;
  requires: string[];
  xp: { base: number };
  /** Nota mínima (0 a 100) para vencer, além dos itens obrigatórios. */
  passScore: number;
  narrative: {
    title: string;
    briefing: string[];
    objective: string;
    victory: string;
    defeat: string;
  };
  starter: string;
  items: BossItem[];
  referenceSolution: string;
}

/** Identidade com tipagem: o editor autocompleta regras e parâmetros. */
export const defineMission = (mission: Mission): Mission => mission;
export const defineBoss = (boss: Boss): Boss => boss;
