import { useEffect, useRef, useState } from 'react';
import { MISSIONS } from '../content';
import type { Mission } from '../engine/mission';
import { isCompleted, isUnlocked, missionState } from '../engine/progression';
import type { RuneId } from '../engine/runes';
import type { Game, MissionCast } from '../state/useGame';
import { hrefFor } from '../state/useHashRoute';
import { Dialog } from './Dialog';
import { selectLine } from './editing';
import { Feedback } from './Feedback';
import { Hints } from './Hints';
import { RichText } from './RichText';
import { RuneSeal } from './RuneSeal';
import { Workspace } from './Workspace';

interface MissionViewProps {
  mission: Mission;
  game: Game;
  onOpenGrimoire: () => void;
}

export function MissionView({ mission, game, onOpenGrimoire }: MissionViewProps) {
  const { progress } = game;
  const state = missionState(progress, mission.id);
  const [text, setText] = useState(() => progress.drafts[mission.id] ?? mission.starter);
  const [cast, setCast] = useState<MissionCast | null>(null);
  const [celebrate, setCelebrate] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { saveDraft } = game;

  // Guarda o rascunho sem gravar a cada tecla.
  useEffect(() => {
    const timer = window.setTimeout(() => saveDraft(mission.id, text), 600);
    return () => window.clearTimeout(timer);
  }, [text, mission.id, saveDraft]);

  if (!isUnlocked(progress, mission)) {
    return (
      <main id="conteudo" className="mission">
        <p>
          Esta runa ainda está selada. <a href={hrefFor({ name: 'map' })}>Volte ao mapa</a> e aprenda as runas
          anteriores.
        </p>
      </main>
    );
  }

  // Na barra: runas já aprendidas + a runa desta missão.
  const runes: RuneId[] = MISSIONS.filter((m) => m.id === mission.id || isCompleted(progress, m.id)).map(
    (m) => m.rune.id,
  );

  const castSpell = () => {
    const result = game.castMission(mission, text);
    setCast(result);
    const failures = result.evaluation.results.filter((r) => !r.passed && r.severity === 'required').length;
    setAnnouncement(
      result.evaluation.passed
        ? `O feitiço funcionou.${result.reward > 0 ? ` Você ganhou ${result.reward} XP.` : ''}`
        : `O feitiço falhou: ${failures} ${failures === 1 ? 'correção obrigatória' : 'correções obrigatórias'}. Veja a lista abaixo do editor.`,
    );
    if (result.newlyCompleted) setCelebrate(true);
  };

  const restart = () => {
    if (window.confirm('Voltar ao texto inicial da missão? O que você escreveu será apagado.')) {
      setText(mission.starter);
      setCast(null);
    }
  };

  const goToLine = (line: number) => {
    if (textareaRef.current) selectLine(textareaRef.current, line);
  };

  const [first, ...rest] = mission.narrative.briefing;

  return (
    <main id="conteudo" className="mission">
      <nav className="crumbs" aria-label="Navegação">
        <a href={hrefFor({ name: 'map' })}>← Salão das Runas</a>
      </nav>

      <header className="mission-head">
        <span className="mission-rune" aria-hidden="true">
          {mission.rune.symbols.join(' ')}
        </span>
        <div>
          <p className="eyebrow">{mission.rune.name}</p>
          <h1 className="page-title">{mission.narrative.title}</h1>
        </div>
      </header>

      {state.completed && (
        <p className="notice">
          Você já aprendeu esta runa. Pode praticar à vontade; lançamentos novos não valem XP.
        </p>
      )}

      <section className="briefing" aria-label="Instruções da missão">
        <div className="briefing-text">
          {first && (
            <p className="dropcap">
              <RichText text={first} />
            </p>
          )}
          {rest.map((p, i) => (
            <p key={i}>
              <RichText text={p} />
            </p>
          ))}
        </div>
        <aside className="why">
          <h2 className="why-title">Por que o Oráculo se importa</h2>
          <p>
            <RichText text={mission.narrative.why} />
          </p>
        </aside>
        <div className="objective">
          <h2 className="objective-title">Sua missão</h2>
          <p>
            <RichText text={mission.narrative.objective} />
          </p>
        </div>
      </section>

      <Workspace value={text} onChange={setText} onCast={castSpell} runes={runes} textareaRef={textareaRef}>
        <div className="actions">
          <button type="button" className="button button--cast" onClick={castSpell}>
            Lançar feitiço
          </button>
          <button type="button" className="button button--quiet" onClick={restart}>
            Recomeçar texto
          </button>
          <button type="button" className="button button--quiet" onClick={onOpenGrimoire}>
            Consultar Grimório
          </button>
        </div>

        <p className="visually-hidden" role="status" aria-live="polite">
          {announcement}
        </p>

        {cast && (
          <Feedback
            results={cast.evaluation.results}
            passed={cast.evaluation.passed}
            onGoToLine={goToLine}
            successTitle={
              cast.reward > 0
                ? `O feitiço funcionou! +${cast.reward} XP${cast.firstTry ? ' (de primeira!)' : ''}`
                : 'O feitiço funcionou!'
            }
          />
        )}

        <Hints mission={mission} state={state} onReveal={() => game.revealHint(mission)} />
      </Workspace>

      {cast && (
        <Dialog open={celebrate} onClose={() => setCelebrate(false)} labelledBy="unlock-title" className="unlock">
          <div className="unlock-seal">
            <RuneSeal symbol={mission.rune.symbols[0] ?? '?'} animate size={176} />
          </div>
          <p className="eyebrow">Runa conquistada</p>
          <h2 id="unlock-title" className="unlock-title">
            {mission.rune.name}
          </h2>
          <p>{mission.narrative.success}</p>
          <p className="unlock-xp">
            +{cast.reward} XP{cast.firstTry ? ' · bônus de primeira' : ''}
          </p>
          {cast.levelUp && (
            <p className="unlock-level">
              Novo título da guilda: <strong>{cast.levelUp.title}</strong>
            </p>
          )}
          {(cast.unlocked.missions.length > 0 || cast.unlocked.boss) && (
            <p>
              Agora abertas:{' '}
              {[...cast.unlocked.missions.map((m) => m.rune.name), ...(cast.unlocked.boss ? ['O Oráculo Confuso'] : [])].join(
                ', ',
              )}
              .
            </p>
          )}
          <div className="dialog-actions">
            <a className="button button--cast" href={hrefFor({ name: 'map' })}>
              Voltar ao Salão
            </a>
            <button
              type="button"
              className="button button--quiet"
              onClick={() => {
                setCelebrate(false);
                onOpenGrimoire();
              }}
            >
              Ver no Grimório
            </button>
          </div>
        </Dialog>
      )}
    </main>
  );
}
