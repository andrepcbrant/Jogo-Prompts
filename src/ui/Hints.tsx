import type { Mission } from '../engine/mission';
import { pendingReward, type MissionState } from '../engine/progression';
import { RichText } from './RichText';

interface HintsProps {
  mission: Mission;
  state: MissionState;
  onReveal: () => void;
}

export function Hints({ mission, state, onReveal }: HintsProps) {
  const revealed = mission.hints.slice(0, state.hintsUsed);
  const next = mission.hints[state.hintsUsed];
  const reward = pendingReward(mission, state);

  return (
    <section className="hints" aria-labelledby="hints-title">
      <div className="hints-head">
        <h3 id="hints-title" className="hints-title">
          Dicas do Mestre
        </h3>
        <p className="hints-reward">
          {state.completed ? (
            'Runa já aprendida: dicas sem custo.'
          ) : (
            <>
              Recompensa atual: <strong>{reward} XP</strong>
              {state.attempts === 0 && <span className="muted"> (inclui bônus de primeira)</span>}
            </>
          )}
        </p>
      </div>

      {revealed.length > 0 && (
        <ol className="hint-list">
          {revealed.map((hint, i) => (
            <li key={i} className="hint">
              <RichText text={hint.text} />
              {hint.example && <pre className="hint-example">{hint.example}</pre>}
            </li>
          ))}
        </ol>
      )}

      {next ? (
        <button type="button" className="button button--quiet" onClick={onReveal}>
          {state.completed
            ? `Ver dica ${state.hintsUsed + 1} de ${mission.hints.length}`
            : `Pedir dica ${state.hintsUsed + 1} de ${mission.hints.length} (−${next.cost} XP)`}
        </button>
      ) : (
        <p className="muted">Todas as dicas já foram reveladas.</p>
      )}
    </section>
  );
}
