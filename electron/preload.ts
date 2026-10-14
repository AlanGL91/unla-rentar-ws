import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron';

// Sandboxed preloads cannot require local modules: keep in sync with ipc-channels.ts.
const IPC = {
  windowGetMode: 'window:get-mode',
  windowSetMode: 'window:set-mode',
  windowModeChanged: 'window:mode-changed',
  windowSetIgnoreMouse: 'window:set-ignore-mouse',
  windowDragStart: 'window:drag-start',
  windowDragMove: 'window:drag-move',
  windowDragEnd: 'window:drag-end',
} as const;

type WindowMode = 'collapsed' | 'expanded';

const companionApi = {
  platform: process.platform,
  window: {
    getMode: (): Promise<WindowMode | null> => ipcRenderer.invoke(IPC.windowGetMode),
    setMode: (mode: WindowMode): void => ipcRenderer.send(IPC.windowSetMode, mode),
    onModeChanged: (listener: (mode: WindowMode) => void): (() => void) => {
      const handler = (_event: IpcRendererEvent, mode: WindowMode) => listener(mode);
      ipcRenderer.on(IPC.windowModeChanged, handler);
      return () => ipcRenderer.removeListener(IPC.windowModeChanged, handler);
    },
    setIgnoreMouse: (ignore: boolean): void => ipcRenderer.send(IPC.windowSetIgnoreMouse, ignore),
    dragStart: (): void => ipcRenderer.send(IPC.windowDragStart),
    dragMove: (): void => ipcRenderer.send(IPC.windowDragMove),
    dragEnd: (): void => ipcRenderer.send(IPC.windowDragEnd),
  },
};

contextBridge.exposeInMainWorld('companion', companionApi);

export type CompanionApi = typeof companionApi;
