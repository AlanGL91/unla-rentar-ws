import { useRef, type PointerEvent } from 'react';

const DRAG_THRESHOLD_PX = 4;

/**
 * Moves the window while the pointer is held down, and treats a press
 * without movement as a click. Done by hand instead of
 * `-webkit-app-region: drag` because drag regions swallow click events.
 */
export function useDragOrClick(onClick: () => void) {
  const state = useRef<{ x: number; y: number; dragging: boolean; frame: number } | null>(null);

  const onPointerDown = (event: PointerEvent<HTMLElement>) => {
    if (event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    state.current = { x: event.screenX, y: event.screenY, dragging: false, frame: 0 };
    window.companion.window.dragStart();
  };

  const onPointerMove = (event: PointerEvent<HTMLElement>) => {
    const s = state.current;
    if (!s) return;
    if (!s.dragging) {
      const moved = Math.hypot(event.screenX - s.x, event.screenY - s.y);
      if (moved < DRAG_THRESHOLD_PX) return;
      s.dragging = true;
    }
    if (s.frame) return;
    s.frame = requestAnimationFrame(() => {
      s.frame = 0;
      window.companion.window.dragMove();
    });
  };

  const onPointerUp = (event: PointerEvent<HTMLElement>) => {
    const s = state.current;
    if (!s) return;
    state.current = null;
    if (s.frame) cancelAnimationFrame(s.frame);
    event.currentTarget.releasePointerCapture(event.pointerId);
    window.companion.window.dragEnd();
    if (!s.dragging) onClick();
  };

  return { onPointerDown, onPointerMove, onPointerUp, onPointerCancel: onPointerUp };
}
