import { MISSIONS } from '../content';
import { isCompleted, type Progress } from '../engine/progression';
import { Dialog } from './Dialog';
import { RichText } from './RichText';
import { RuneSeal } from './RuneSeal';

interface GrimoireProps {
  open: boolean;
  onClose: () => void;
  progress: Progress;
}

/** O inventário: cada runa aprendida vira um verbete com a cola da sintaxe. */
export function Grimoire({ open, onClose, progress }: GrimoireProps) {
  const learned = MISSIONS.filter((m) => isCompleted(progress, m.id)).length;
  return (
    <Dialog open={open} onClose={onClose} labelledBy="grimoire-title" className="drawer">
      <header className="drawer-head">
        <div>
          <h2 id="grimoire-title" className="drawer-title">
            Grimório
          </h2>
          <p className="muted">
            {learned} de {MISSIONS.length} runas aprendidas
          </p>
        </div>
        <button type="button" className="button button--quiet" onClick={onClose}>
          Fechar
        </button>
      </header>

      {learned === 0 && (
        <p className="grimoire-empty">
          O Grimório está em branco. Cada runa que você aprender entra aqui com uma cola da sintaxe, para consultar
          durante as missões.
        </p>
      )}

      <ul className="grimoire-list">
        {MISSIONS.map((mission) => {
          const known = isCompleted(progress, mission.id);
          return (
            <li key={mission.id} className={known ? 'entry' : 'entry entry--locked'}>
              {known ? (
                <>
                  <div className="entry-head">
                    <RuneSeal symbol={mission.rune.symbols[0] ?? '?'} size={44} />
                    <h3 className="entry-title">{mission.rune.name}</h3>
                  </div>
                  <pre className="entry-syntax">{mission.grimoire.syntax}</pre>
                  <p>
                    <strong>Quando usar:</strong> <RichText text={mission.grimoire.whenToUse} />
                  </p>
                  <p>
                    <strong>Cuidado:</strong> <RichText text={mission.grimoire.pitfall} />
                  </p>
                </>
              ) : (
                <p className="entry-locked">
                  <span aria-hidden="true">❦</span> {mission.rune.name}: ainda não aprendida
                </p>
              )}
            </li>
          );
        })}
      </ul>
    </Dialog>
  );
}
