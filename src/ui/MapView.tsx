import { BOSS, MISSIONS } from '../content';
import type { Mission } from '../engine/mission';
import { isCompleted, isUnlocked, missionState, type Progress } from '../engine/progression';
import { hrefFor } from '../state/useHashRoute';
import { RuneSeal } from './RuneSeal';

/**
 * Árvore de habilidades montada a partir dos pré-requisitos das missões:
 * cada missão aparece como filha do seu último pré-requisito.
 */
function childrenOf(parent: string | null): Mission[] {
  return MISSIONS.filter((m) =>
    parent === null ? m.requires.length === 0 : m.requires[m.requires.length - 1] === parent,
  );
}

const nameOf = (id: string) => MISSIONS.find((m) => m.id === id)?.rune.name ?? id;

export function MapView({ progress }: { progress: Progress }) {
  const learned = MISSIONS.filter((m) => isCompleted(progress, m.id)).length;
  const bossOpen = isUnlocked(progress, BOSS);

  return (
    <main id="conteudo" className="map">
      <section className="map-intro">
        <h1 className="page-title">O Salão das Runas</h1>
        <p className="lede">
          Bem-vindo à Guilda dos Escribas. Aqui, prompts são feitiços, e cada símbolo de markdown é uma runa: muda o
          jeito como o Oráculo lê o que você escreve. Aprenda as sete runas e enfrente o Oráculo Confuso.
        </p>
        <p className="muted">
          {learned === 0
            ? 'Comece pela Runa do Título. As outras se abrem conforme você avança.'
            : `${learned} de ${MISSIONS.length} runas aprendidas.`}
        </p>
      </section>

      <nav aria-label="Árvore de runas" className="tree-wrap">
        <Branch parent={null} progress={progress} />
      </nav>

      <section className="boss-gate" aria-labelledby="boss-gate-title">
        <h2 id="boss-gate-title" className="visually-hidden">
          Chefe final
        </h2>
        {bossOpen ? (
          <a className="node node--boss" href={hrefFor({ name: 'boss' })}>
            <span className="node-symbol" aria-hidden="true">
              ☉
            </span>
            <span className="node-text">
              <span className="node-name">{BOSS.name}</span>
              <span className="node-meta">
                {progress.boss.defeated
                  ? `Vencido · melhor nota ${progress.boss.bestScore}`
                  : 'Chefe final · desafiar'}
              </span>
            </span>
          </a>
        ) : (
          <div className="node node--boss node--locked" aria-disabled="true">
            <span className="node-symbol" aria-hidden="true">
              ☉
            </span>
            <span className="node-text">
              <span className="node-name">{BOSS.name}</span>
              <span className="node-meta">Selado até você aprender as 7 runas ({learned}/7)</span>
            </span>
          </div>
        )}
      </section>
    </main>
  );
}

function Branch({ parent, progress }: { parent: string | null; progress: Progress }) {
  const nodes = childrenOf(parent);
  if (nodes.length === 0) return null;
  return (
    <ul className={parent === null ? 'tree tree--root' : 'tree'}>
      {nodes.map((mission) => (
        <li key={mission.id} className="tree-item">
          <RuneNode mission={mission} progress={progress} />
          <Branch parent={mission.id} progress={progress} />
        </li>
      ))}
    </ul>
  );
}

function RuneNode({ mission, progress }: { mission: Mission; progress: Progress }) {
  const state = missionState(progress, mission.id);
  const open = isUnlocked(progress, mission);
  const symbol = mission.rune.symbols[0] ?? '?';

  if (!open) {
    return (
      <div className="node node--locked" aria-disabled="true">
        <span className="node-symbol" aria-hidden="true">
          {symbol}
        </span>
        <span className="node-text">
          <span className="node-name">{mission.rune.name}</span>
          <span className="node-meta">Requer: {mission.requires.map(nameOf).join(', ')}</span>
        </span>
      </div>
    );
  }

  return (
    <a
      className={state.completed ? 'node node--done' : 'node node--open'}
      href={hrefFor({ name: 'mission', id: mission.id })}
    >
      {state.completed ? (
        <RuneSeal symbol={mission.rune.symbols[0] ?? '?'} size={48} />
      ) : (
        <span className="node-symbol" aria-hidden="true">
          {symbol}
        </span>
      )}
      <span className="node-text">
        <span className="node-name">{mission.rune.name}</span>
        <span className="node-meta">
          {state.completed
            ? `Aprendida · ${state.xpEarned} XP${state.firstTry ? ' · de primeira' : ''}`
            : `${mission.narrative.title} · até ${mission.xp.base + mission.xp.firstTryBonus} XP`}
        </span>
      </span>
    </a>
  );
}
