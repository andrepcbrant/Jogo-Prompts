import { useDeferredValue, useId, useMemo, useState, type ReactNode, type RefObject } from 'react';
import type { RuneId } from '../engine/runes';
import { renderMarkdown } from '../render/preview';
import { applyTool, toolsFor } from './editing';

interface WorkspaceProps {
  value: string;
  onChange: (value: string) => void;
  onCast: () => void;
  /** Runas disponíveis na barra de botões. */
  runes: RuneId[];
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  /** Ações e feedback mostrados logo abaixo do editor. */
  children?: ReactNode;
}

type Tab = 'write' | 'preview';

export function Workspace({ value, onChange, onCast, runes, textareaRef, children }: WorkspaceProps) {
  const [tab, setTab] = useState<Tab>('write');
  const deferred = useDeferredValue(value);
  const html = useMemo(() => renderMarkdown(deferred), [deferred]);
  const tools = toolsFor(runes);
  const ids = { editor: useId(), help: useId(), writeTab: useId(), previewTab: useId(), write: useId(), preview: useId() };

  return (
    <div className="workspace" data-tab={tab}>
      <div className="workspace-tabs" role="tablist" aria-label="Alternar entre escrever e ver o pergaminho">
        {(['write', 'preview'] as const).map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            id={t === 'write' ? ids.writeTab : ids.previewTab}
            aria-selected={tab === t}
            aria-controls={t === 'write' ? ids.write : ids.preview}
            tabIndex={tab === t ? 0 : -1}
            className="workspace-tab"
            onClick={() => setTab(t)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
                const next = t === 'write' ? 'preview' : 'write';
                setTab(next);
                document.getElementById(next === 'write' ? ids.writeTab : ids.previewTab)?.focus();
              }
            }}
          >
            {t === 'write' ? 'Escrever' : 'Ver pergaminho'}
          </button>
        ))}
      </div>

      <section className="pane pane-write" id={ids.write} role="tabpanel" aria-labelledby={ids.writeTab}>
        <div className="pane-head">
          <label className="pane-title" htmlFor={ids.editor}>
            Seu feitiço
          </label>
          <span className="pane-note" id={ids.help}>
            Markdown · <kbd>Ctrl</kbd>+<kbd>Enter</kbd> lança
          </span>
        </div>
        {tools.length > 0 && (
          <div className="rune-bar" role="toolbar" aria-label="Barra de runas: insere os símbolos no editor">
            {tools.map((tool) => (
              <button
                key={tool.name}
                type="button"
                className="rune-key"
                aria-label={`${tool.name} (${tool.label})`}
                title={tool.name}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  if (textareaRef.current) applyTool(textareaRef.current, tool);
                }}
              >
                {tool.label}
              </button>
            ))}
          </div>
        )}
        <textarea
          ref={textareaRef}
          id={ids.editor}
          className="editor"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
              e.preventDefault();
              onCast();
            }
          }}
          aria-describedby={ids.help}
          spellCheck
          lang="pt-BR"
          autoCapitalize="sentences"
          autoCorrect="off"
          rows={16}
        />
        {children}
      </section>

      <section className="pane pane-preview" id={ids.preview} role="tabpanel" aria-labelledby={ids.previewTab}>
        <div className="pane-head">
          <h2 className="pane-title">Pergaminho</h2>
          <span className="pane-note">como a estrutura aparece</span>
        </div>
        <div className="parchment" dangerouslySetInnerHTML={{ __html: html }} />
      </section>
    </div>
  );
}
