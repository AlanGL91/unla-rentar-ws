import { create } from 'zustand';
import type { WindowMode } from '../global';

interface WindowState {
  mode: WindowMode;
  init: () => () => void;
  setMode: (mode: WindowMode) => void;
  toggle: () => void;
}

export const useWindowStore = create<WindowState>((set, get) => ({
  mode: 'collapsed',
  init: () => {
    void window.companion.window.getMode().then((mode) => {
      if (mode) set({ mode });
    });
    return window.companion.window.onModeChanged((mode) => set({ mode }));
  },
  setMode: (mode) => {
    if (get().mode === mode) return;
    set({ mode });
    window.companion.window.setMode(mode);
  },
  toggle: () => get().setMode(get().mode === 'collapsed' ? 'expanded' : 'collapsed'),
}));
