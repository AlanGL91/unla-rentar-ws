import { useEffect } from 'react';

const INTERACTIVE_SELECTOR = '[data-interactive]';

/**
 * The window ignores mouse events by default (clicks fall through the
 * transparent areas). Mouse moves are still forwarded, so we re-enable
 * input while the cursor is over an element marked `data-interactive`.
 */
export function useClickThrough(): void {
  useEffect(() => {
    let ignoring = true;
    const update = (ignore: boolean) => {
      if (ignore === ignoring) return;
      ignoring = ignore;
      window.companion.window.setIgnoreMouse(ignore);
    };
    const onMove = (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target : null;
      update(!target?.closest(INTERACTIVE_SELECTOR));
    };
    const onLeave = () => update(true);

    document.addEventListener('mousemove', onMove);
    document.documentElement.addEventListener('mouseleave', onLeave);
    return () => {
      document.removeEventListener('mousemove', onMove);
      document.documentElement.removeEventListener('mouseleave', onLeave);
    };
  }, []);
}
