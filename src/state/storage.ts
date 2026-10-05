import { emptyProgress, type Progress } from '../engine/progression';

export const STORAGE_KEY = 'guilda-dos-escribas:progresso';

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

function defaultStorage(): StorageLike | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null; // navegador bloqueando o acesso
  }
}

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : 0);

/**
 * Lê o progresso salvo, descartando campos estranhos. Versões futuras do
 * formato entram aqui como migrações (`version: 1` → `version: 2`).
 */
export function parseProgress(raw: string | null): Progress {
  if (!raw) return emptyProgress();
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return emptyProgress();
  }
  if (!isRecord(data) || data.version !== 1) return emptyProgress();

  const progress = emptyProgress();
  if (isRecord(data.missions)) {
    for (const [id, m] of Object.entries(data.missions)) {
      if (!isRecord(m)) continue;
      progress.missions[id] = {
        attempts: num(m.attempts),
        hintsUsed: num(m.hintsUsed),
        completed: m.completed === true,
        firstTry: m.firstTry === true,
        xpEarned: num(m.xpEarned),
      };
    }
  }
  if (isRecord(data.boss)) {
    progress.boss = {
      attempts: num(data.boss.attempts),
      defeated: data.boss.defeated === true,
      bestScore: num(data.boss.bestScore),
      xpEarned: num(data.boss.xpEarned),
    };
  }
  if (isRecord(data.drafts)) {
    for (const [id, text] of Object.entries(data.drafts)) {
      if (typeof text === 'string') progress.drafts[id] = text;
    }
  }
  return progress;
}

export function loadProgress(storage = defaultStorage()): Progress {
  try {
    return parseProgress(storage?.getItem(STORAGE_KEY) ?? null);
  } catch {
    return emptyProgress();
  }
}

/** Salva e devolve se deu certo (modo privado e cotas cheias podem falhar). */
export function saveProgress(progress: Progress, storage = defaultStorage()): boolean {
  if (!storage) return false;
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(progress));
    return true;
  } catch {
    return false;
  }
}

export function clearProgress(storage = defaultStorage()): void {
  try {
    storage?.removeItem(STORAGE_KEY);
  } catch {
    // nada a fazer: o próximo carregamento começa do zero de qualquer forma
  }
}

/** Testa se dá para salvar neste navegador. */
export function storageAvailable(storage = defaultStorage()): boolean {
  if (!storage) return false;
  try {
    const probe = `${STORAGE_KEY}:teste`;
    storage.setItem(probe, '1');
    storage.removeItem(probe);
    return true;
  } catch {
    return false;
  }
}
