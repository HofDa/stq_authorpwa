import { useEffect, useState } from 'react';

/**
 * Returns true when the viewport is wide enough for the 3-column Studio
 * layout. The threshold matches the Studio grid: 260 + (min ~520 map) + 380
 * + gaps ≈ 1200px.
 */
export function useIsDesktop(minWidth = 1200): boolean {
  const [isDesktop, setIsDesktop] = useState<boolean>(() =>
    typeof window === 'undefined'
      ? false
      : window.matchMedia(`(min-width: ${minWidth}px)`).matches,
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mql = window.matchMedia(`(min-width: ${minWidth}px)`);
    const update = () => setIsDesktop(mql.matches);
    update();
    mql.addEventListener('change', update);
    return () => mql.removeEventListener('change', update);
  }, [minWidth]);

  return isDesktop;
}
