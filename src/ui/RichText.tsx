import { Fragment } from 'react';

const CODE_SPAN = /(?<!`)`([^`\n]+)`(?!`)/g;

/** Texto do jogo com `trechos` em fonte de código, como nas mensagens das regras. */
export function RichText({ text }: { text: string }) {
  const parts: React.ReactNode[] = [];
  let last = 0;
  for (const match of text.matchAll(CODE_SPAN)) {
    const index = match.index ?? 0;
    if (index > last) parts.push(text.slice(last, index));
    parts.push(<code key={index}>{match[1]}</code>);
    last = index + match[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return <Fragment>{parts}</Fragment>;
}
