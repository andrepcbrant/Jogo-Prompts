import DOMPurify from 'dompurify';
import { md, normalizeSource } from '../engine/markdown';

/**
 * Renderiza o markdown do jogador para o pergaminho. O markdown-it já escapa
 * HTML cru (`html: false`); o DOMPurify é a segunda camada de proteção.
 */
export function renderMarkdown(source: string): string {
  const html = md.render(normalizeSource(source));
  return DOMPurify.sanitize(html, { USE_PROFILES: { html: true } });
}
