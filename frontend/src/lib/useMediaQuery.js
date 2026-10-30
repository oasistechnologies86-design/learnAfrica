import { useEffect, useState } from 'react';

/**
 * useMediaQuery — true while the viewport matches the given media query.
 *
 * Used to render only one layout at a time (desktop card vs phone card). That
 * matters beyond looks: rendering both would duplicate element ids and put two
 * copies of every control in the accessibility tree.
 */
export function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia(query);
    const on = () => setMatches(mq.matches);
    on();
    mq.addEventListener?.('change', on);
    return () => mq.removeEventListener?.('change', on);
  }, [query]);

  return matches;
}

export default useMediaQuery;
