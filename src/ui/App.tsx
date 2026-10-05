import { useState } from 'react';
import { findMission, MISSIONS } from '../content';
import { isCompleted } from '../engine/progression';
import { useGame } from '../state/useGame';
import { useHashRoute } from '../state/useHashRoute';
import { BossView } from './BossView';
import { Grimoire } from './Grimoire';
import { Header } from './Header';
import { MapView } from './MapView';
import { MissionView } from './MissionView';

export function App() {
  const game = useGame();
  const { route } = useHashRoute();
  const [grimoireOpen, setGrimoireOpen] = useState(false);
  const learned = MISSIONS.filter((m) => isCompleted(game.progress, m.id)).length;
  const openGrimoire = () => setGrimoireOpen(true);

  let view;
  if (route.name === 'mission') {
    const mission = findMission(route.id);
    view = mission ? (
      <MissionView key={mission.id} mission={mission} game={game} onOpenGrimoire={openGrimoire} />
    ) : (
      <main id="conteudo" className="mission">
        <p>
          Missão não encontrada. <a href="#/">Voltar ao Salão das Runas</a>.
        </p>
      </main>
    );
  } else if (route.name === 'boss') {
    view = <BossView game={game} onOpenGrimoire={openGrimoire} />;
  } else {
    view = <MapView progress={game.progress} />;
  }

  return (
    <>
      <a className="skip-link" href="#conteudo">
        Pular para o conteúdo
      </a>
      <Header xp={game.xp} level={game.level} learned={learned} onOpenGrimoire={openGrimoire} />
      {!game.canSave && (
        <p className="notice notice--warn" role="note">
          Este navegador não está deixando salvar dados (modo anônimo ou bloqueio de site). Você pode jogar, mas o
          progresso some ao fechar a página.
        </p>
      )}
      {view}
      <footer className="site-footer">
        <p>
          O progresso fica salvo só neste navegador. Limpar os dados do site apaga a jornada.
        </p>
        <button
          type="button"
          className="link-button"
          onClick={() => {
            if (window.confirm('Recomeçar a jornada do zero? Todo o XP, as runas e os rascunhos serão apagados.')) {
              game.reset();
              window.location.hash = '#/';
            }
          }}
        >
          Recomeçar jornada
        </button>
      </footer>
      <Grimoire open={grimoireOpen} onClose={() => setGrimoireOpen(false)} progress={game.progress} />
    </>
  );
}
