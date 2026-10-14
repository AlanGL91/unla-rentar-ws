import { app, screen, type Rectangle } from 'electron';
import fs from 'node:fs';
import path from 'node:path';

export type WindowMode = 'collapsed' | 'expanded';

export const WINDOW_SIZES: Record<WindowMode, { width: number; height: number }> = {
  collapsed: { width: 200, height: 200 },
  expanded: { width: 360, height: 520 },
};

export interface PersistedWindowState {
  x: number;
  y: number;
  mode: WindowMode;
}

const MIN_VISIBLE_PX = 64;

function stateFile(): string {
  return path.join(app.getPath('userData'), 'window-state.json');
}

function isPersistedState(value: unknown): value is PersistedWindowState {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    Number.isFinite(v.x) &&
    Number.isFinite(v.y) &&
    (v.mode === 'collapsed' || v.mode === 'expanded')
  );
}

export function loadWindowState(): PersistedWindowState | null {
  try {
    const parsed: unknown = JSON.parse(fs.readFileSync(stateFile(), 'utf8'));
    return isPersistedState(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function saveWindowState(state: PersistedWindowState): void {
  try {
    fs.mkdirSync(path.dirname(stateFile()), { recursive: true });
    fs.writeFileSync(stateFile(), JSON.stringify(state, null, 2), 'utf8');
  } catch (error) {
    console.warn('[window-state] could not save', error);
  }
}

function visibleArea(a: Rectangle, b: Rectangle): number {
  const w = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x);
  const h = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y);
  return w > 0 && h > 0 ? Math.min(w, h) : 0;
}

/** True when enough of `bounds` lands on some monitor's work area. */
export function isOnScreen(bounds: Rectangle): boolean {
  return screen
    .getAllDisplays()
    .some((d) => visibleArea(bounds, d.workArea) >= MIN_VISIBLE_PX);
}

const SCREEN_MARGIN_PX = 24;

/**
 * Default spot: bottom-right of the primary monitor, leaving room so the
 * expanded window fits without pushing the character sideways.
 */
export function defaultBounds(mode: WindowMode): Rectangle {
  const { workArea } = screen.getPrimaryDisplay();
  const size = WINDOW_SIZES[mode];
  const widest = WINDOW_SIZES.expanded.width;
  const centerX = workArea.x + workArea.width - widest / 2 - SCREEN_MARGIN_PX;
  return {
    x: Math.round(centerX - size.width / 2),
    y: workArea.y + workArea.height - size.height - SCREEN_MARGIN_PX,
    ...size,
  };
}

/** Keeps the whole window inside the work area of the monitor it is on. */
export function clampToWorkArea(bounds: Rectangle): Rectangle {
  const { workArea } = screen.getDisplayMatching(bounds);
  const x = Math.min(Math.max(bounds.x, workArea.x), workArea.x + workArea.width - bounds.width);
  const y = Math.min(Math.max(bounds.y, workArea.y), workArea.y + workArea.height - bounds.height);
  return { ...bounds, x, y };
}

/**
 * Resizes around the bottom-center point so the character (drawn at the
 * bottom-center of the window) stays put when switching modes.
 */
export function resizeAnchoredBottom(current: Rectangle, mode: WindowMode): Rectangle {
  const size = WINDOW_SIZES[mode];
  const anchorX = current.x + current.width / 2;
  const anchorY = current.y + current.height;
  return clampToWorkArea({
    x: Math.round(anchorX - size.width / 2),
    y: anchorY - size.height,
    ...size,
  });
}
