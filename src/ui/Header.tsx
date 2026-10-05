import type { LevelStatus } from '../engine/progression';

interface HeaderProps {
  xp: number;
  level: LevelStatus;
  learned: number;
  onOpenGrimoire: () => void;
}

export function Header({ xp, level, learned, onOpenGrimoire }: HeaderProps) {
  const { current, next, progressToNext } = level;
  const remaining = next && !next.requiresBoss ? next.minXp - xp : null;
  const status = next
    ? remaining !== null
      ? `faltam ${remaining} XP para ${next.title}`
      : `vença o Oráculo para ser ${next.title}`
    : 'título máximo da guilda';

  return (
    <header className="site-header">
      <div className="site-header-inner">
        <a className="brand" href="#/">
          <span className="brand-mark" aria-hidden="true">
            ❦
          </span>
          <span className="brand-name">Guilda dos Escribas</span>
        </a>

        <div className="rank">
          <span className="rank-title">
            <span className="visually-hidden">Título: </span>
            {current.title}
          </span>
          <span className="rank-bar" aria-hidden="true">
            <span className="rank-fill" style={{ width: `${Math.round(progressToNext * 100)}%` }} />
          </span>
          <span className="rank-xp">
            {xp} XP · {status}
          </span>
        </div>

        <button type="button" className="button button--grimoire" onClick={onOpenGrimoire}>
          Grimório <span className="badge">{learned}</span>
        </button>
      </div>
    </header>
  );
}
