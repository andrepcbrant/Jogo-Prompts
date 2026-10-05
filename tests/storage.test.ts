import { describe, expect, it } from 'vitest';
import { emptyProgress } from '../src/engine/progression';
import { loadProgress, parseProgress, saveProgress, STORAGE_KEY, type StorageLike } from '../src/state/storage';

function memory(): StorageLike & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => void data.set(k, v),
    removeItem: (k) => void data.delete(k),
  };
}

describe('salvamento', () => {
  it('salva e recarrega o mesmo progresso', () => {
    const storage = memory();
    const progress = emptyProgress();
    progress.missions['runa-titulo'] = { attempts: 2, hintsUsed: 1, completed: true, firstTry: false, xpEarned: 90 };
    progress.drafts['runa-lista'] = '# rascunho';
    expect(saveProgress(progress, storage)).toBe(true);
    expect(loadProgress(storage)).toEqual(progress);
  });

  it('dados corrompidos ou de outra versão viram progresso vazio', () => {
    expect(parseProgress('{oops')).toEqual(emptyProgress());
    expect(parseProgress(JSON.stringify({ version: 99 }))).toEqual(emptyProgress());
    expect(parseProgress(null)).toEqual(emptyProgress());
  });

  it('ignora campos com tipo errado', () => {
    const raw = JSON.stringify({
      version: 1,
      missions: { a: { attempts: 'x', completed: 'sim', xpEarned: 50 }, b: 3 },
      drafts: { a: 'ok', b: 42 },
    });
    const p = parseProgress(raw);
    expect(p.missions.a).toEqual({ attempts: 0, hintsUsed: 0, completed: false, firstTry: false, xpEarned: 50 });
    expect(p.missions.b).toBeUndefined();
    expect(p.drafts).toEqual({ a: 'ok' });
  });

  it('falha ao salvar não quebra o jogo', () => {
    const broken: StorageLike = {
      getItem: () => {
        throw new Error('bloqueado');
      },
      setItem: () => {
        throw new Error('cota');
      },
      removeItem: () => undefined,
    };
    expect(saveProgress(emptyProgress(), broken)).toBe(false);
    expect(loadProgress(broken)).toEqual(emptyProgress());
    expect(STORAGE_KEY).toContain('guilda');
  });
});
