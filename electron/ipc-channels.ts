// Shared between main and preload. Preload is sandboxed, so this module must stay dependency-free.
export const IPC = {
  windowGetMode: 'window:get-mode',
  windowSetMode: 'window:set-mode',
  windowModeChanged: 'window:mode-changed',
  windowSetIgnoreMouse: 'window:set-ignore-mouse',
  windowDragStart: 'window:drag-start',
  windowDragMove: 'window:drag-move',
  windowDragEnd: 'window:drag-end',
} as const;
