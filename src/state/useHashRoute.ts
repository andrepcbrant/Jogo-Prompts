import { useCallback, useEffect, useState } from 'react';

export type Route = { name: 'map' } | { name: 'mission'; id: string } | { name: 'boss' };

/** Rotas por `#hash`: funcionam em qualquer hospedagem estática, sem servidor. */
export function parseHash(hash: string): Route {
  const path = hash.replace(/^#\/?/, '');
  const [first, second] = path.split('/');
  if (first === 'missao' && second) return { name: 'mission', id: decodeURIComponent(second) };
  if (first === 'oraculo') return { name: 'boss' };
  return { name: 'map' };
}

export function hrefFor(route: Route): string {
  switch (route.name) {
    case 'mission':
      return `#/missao/${encodeURIComponent(route.id)}`;
    case 'boss':
      return '#/oraculo';
    default:
      return '#/';
  }
}

export function useHashRoute() {
  const [route, setRoute] = useState<Route>(() => parseHash(window.location.hash));

  useEffect(() => {
    const onChange = () => {
      setRoute(parseHash(window.location.hash));
      window.scrollTo({ top: 0 });
    };
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);

  const navigate = useCallback((next: Route) => {
    window.location.hash = hrefFor(next);
  }, []);

  return { route, navigate };
}
