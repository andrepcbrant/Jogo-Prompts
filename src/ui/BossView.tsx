import { useEffect, useRef, useState } from 'react';
import { BOSS, MISSIONS } from '../content';
import { isCompleted, isUnlocked } from '../engine/progression';
import type { BossCast, Game } from '../state/useGame';
import { hrefFor } from '../state/useHashRoute';
import { Dialog } from './Dialog';
import { selectLine } from './editing';
import { CheckItem } from './Feedback';
import { RichText } from './RichText';
import { RuneSeal } from './RuneSeal';
import { Workspace } from './Workspace';

export function BossView({ game, onOpenGrimoire }: { game: Game; onOpenGrimoire: () => void }) {
  const { progress, saveDraft } = game;
  const [text, setText] = useState(() => progress.drafts[BOSS.id] ?? BOSS.starter);
  const [cast, setCast] = useState<BossCast | null>(null);
  const [celebrate, setCelebrate] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => saveDraft(BOSS.id, text), 600);
    return () => window.clearTimeout(timer);
  }, [text, saveDraft]);

  if (!isUnlocked(progress, BOSS)) {
    return (
      <main id="conteudo" className="mission">
        <p>
          O Oráculo ainda está selado. <a href={hrefFor({ name: 'map' })}>Volte ao mapa</a> e aprenda as sete runas.
        </p>
      </main>
    );
  }

  const runes = MISSIONS.filter((m) => isCompleted(progress, m.id)).map((m) => m.rune.id);

  const castSpell = () => {
    const result = game.castBoss(text);
    setCast(result);
    const { score, passed, missingMandatory } = result.evaluation;
    setAnnouncement(
      passed
        ? `O Oráculo obedeceu. Nota ${score} de 100.`
        : `O Oráculo ainda se confunde. Nota ${score} de 100${missingMandatory > 0 ? `, ${missingMandatory} item(ns) obrigatório(s) faltando` : ''}. Veja a lista abaixo do editor.`,
    );
    if (result.newlyDefeated) setCelebrate(true);
  };

  const goToLine = (line: number) => {
    if (textareaRef.current) selectLine(textareaRef.current, line);
  };

  const evaluation = cast?.evaluation;
  const sorted = evaluation
    ? [...evaluation.items].sort((a, b) => Number(a.passed) - Number(b.passed) || Number(b.mandatory) - Number(a.mandatory))
    : [];

  return (
    <main id="conteudo" className="mission mission--boss">
      <nav className="crumbs" aria-label="Navegação">
        <a href={hrefFor({ name: 'map' })}>← Salão das Runas</a>
      </nav>

      <header className="mission-head">
        <span className="mission-rune" aria-hidden="true">
          ☉
        </span>
        <div>
          <p className="eyebrow">Chefe final</p>
          <h1 className="page-title">{BOSS.narrative.title}</h1>
        </div>
      </header>

      {progress.boss.defeated && (
        <p className="notice">
          Você já venceu o Oráculo (melhor nota: {progress.boss.bestScore}). Pode desafiá-lo de novo para melhorar a
          nota.
        </p>
      )}

      <section className="briefing" aria-label="Instruções do desafio">
        <div className="briefing-text">
          {BOSS.narrative.briefing.map((p, i) => (
            <p key={i} className={i === 0 ? 'dropcap' : undefined}>
              <RichText text={p} />
            </p>
          ))}
        </div>
        <div className="objective">
          <h2 className="objective-title">Para vencer</h2>
          <p>
            <RichText text={BOSS.narrative.objective} />
          </p>
        </div>
      </section>

      <Workspace value={text} onChange={setText} onCast={castSpell} runes={runes} textareaRef={textareaRef}>
        <div className="actions">
          <button type="button" className="button button--cast" onClick={castSpell}>
            Lançar feitiço ao Oráculo
          </button>
          <button
            type="button"
            className="button button--quiet"
            onClick={() => {
              if (window.confirm('Voltar ao pedido original? O que você escreveu será apagado.')) {
                setText(BOSS.starter);
                setCast(null);
              }
            }}
          >
            Recomeçar texto
          </button>
          <button type="button" className="button button--quiet" onClick={onOpenGrimoire}>
            Consultar Grimório
          </button>
        </div>

        <p className="visually-hidden" role="status" aria-live="polite">
          {announcement}
        </p>

        {evaluation && (
          <section
            className={evaluation.passed ? 'feedback feedback--ok' : 'feedback feedback--fail'}
            aria-label="Avaliação do Oráculo"
          >
            <div className="score">
              <span className="score-number">{evaluation.score}</span>
              <span className="score-label">
                de 100 · mínimo {evaluation.passScore} e todos os obrigatórios
              </span>
            </div>
            <h3 className="feedback-title">
              {evaluation.passed ? BOSS.narrative.victory : BOSS.narrative.defeat}
            </h3>
            <ul className="checks">
              {sorted.map((item) => (
                <CheckItem
                  key={item.key}
                  result={item}
                  kind={item.passed ? 'ok' : 'error'}
                  onGoToLine={goToLine}
                  extra={
                    <span className="check-points">
                      {item.passed ? `+${item.points}` : `0/${item.points}`}
                      {item.mandatory && <span className="tag">obrigatório</span>}
                    </span>
                  }
                />
              ))}
            </ul>
          </section>
        )}
      </Workspace>

      {cast && (
        <Dialog open={celebrate} onClose={() => setCelebrate(false)} labelledBy="victory-title" className="unlock">
          <div className="unlock-seal">
            <RuneSeal symbol="☉" animate size={176} />
          </div>
          <p className="eyebrow">O Oráculo obedece</p>
          <h2 id="victory-title" className="unlock-title">
            Mestre Escriba
          </h2>
          <p>{BOSS.narrative.victory}</p>
          <p className="unlock-xp">
            Nota {cast.evaluation.score} · +{cast.reward} XP
          </p>
          <div className="dialog-actions">
            <a className="button button--cast" href={hrefFor({ name: 'map' })}>
              Voltar ao Salão
            </a>
            <button type="button" className="button button--quiet" onClick={() => setCelebrate(false)}>
              Ver a avaliação
            </button>
          </div>
        </Dialog>
      )}
    </main>
  );
}
