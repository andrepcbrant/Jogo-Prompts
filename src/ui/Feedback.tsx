import type { RuleResult } from '../engine/types';
import { RichText } from './RichText';

interface FeedbackProps {
  results: RuleResult[];
  passed: boolean;
  onGoToLine: (line: number) => void;
  /** Texto do topo quando o feitiço passa. */
  successTitle?: string;
}

/** Erros com a mesma mensagem (regras que dependem da mesma correção) aparecem uma vez só. */
function dedupe(results: RuleResult[]): RuleResult[] {
  const seen = new Set<string>();
  return results.filter((r) => {
    if (seen.has(r.message)) return false;
    seen.add(r.message);
    return true;
  });
}

export function Feedback({ results, passed, onGoToLine, successTitle }: FeedbackProps) {
  const errors = dedupe(results.filter((r) => !r.passed && r.severity === 'required'));
  const advice = dedupe(results.filter((r) => !r.passed && r.severity === 'advice'));
  const ok = results.filter((r) => r.passed);

  return (
    <section className={passed ? 'feedback feedback--ok' : 'feedback feedback--fail'} aria-label="Resultado do feitiço">
      <h3 className="feedback-title">
        {passed
          ? (successTitle ?? 'O feitiço funcionou!')
          : `O feitiço falhou: ${errors.length} ${errors.length === 1 ? 'correção obrigatória' : 'correções obrigatórias'}`}
      </h3>

      {errors.length > 0 && (
        <ul className="checks">
          {errors.map((r) => (
            <CheckItem key={r.key} result={r} kind="error" onGoToLine={onGoToLine} />
          ))}
        </ul>
      )}

      {advice.length > 0 && (
        <>
          <h4 className="feedback-sub">O Mestre observa</h4>
          <ul className="checks">
            {advice.map((r) => (
              <CheckItem key={r.key} result={r} kind="advice" onGoToLine={onGoToLine} />
            ))}
          </ul>
        </>
      )}

      {ok.length > 0 && (
        <details className="feedback-ok" open={passed}>
          <summary>Verificações aprovadas ({ok.length})</summary>
          <ul className="checks">
            {ok.map((r) => (
              <CheckItem key={r.key} result={r} kind="ok" onGoToLine={onGoToLine} />
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}

const MARK = { error: '✗', advice: '◆', ok: '✓' } as const;
const SPOKEN = { error: 'Corrigir:', advice: 'Conselho:', ok: 'Aprovado:' } as const;

export function CheckItem({
  result,
  kind,
  onGoToLine,
  extra,
}: {
  result: RuleResult;
  kind: 'error' | 'advice' | 'ok';
  onGoToLine?: (line: number) => void;
  extra?: React.ReactNode;
}) {
  return (
    <li className={`check check--${kind}`}>
      <span className="check-mark" aria-hidden="true">
        {MARK[kind]}
      </span>
      <div className="check-body">
        <span className="visually-hidden">{SPOKEN[kind]} </span>
        <RichText text={result.message} />
        {kind !== 'ok' && result.line !== undefined && onGoToLine && (
          <button type="button" className="link-button" onClick={() => onGoToLine(result.line ?? 1)}>
            Ir para a linha {result.line}
          </button>
        )}
      </div>
      {extra}
    </li>
  );
}
