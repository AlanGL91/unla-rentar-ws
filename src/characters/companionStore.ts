import { create } from 'zustand';
import { characters } from './registry';
import type { AnimationState, CharacterDefinition } from './types';

type BaseState = Exclude<AnimationState, 'petted'>;

interface CompanionState {
  characters: readonly CharacterDefinition[];
  characterId: string;
  /** Long-lived state driven by the app (pomodoro, alerts…). */
  baseState: BaseState;
  /** True while the one-shot "petted" animation plays on top of baseState. */
  petting: boolean;
  init: () => Promise<void>;
  selectCharacter: (id: string) => void;
  setBaseState: (state: BaseState) => void;
  pet: () => void;
  endPet: () => void;
}

export const useCompanionStore = create<CompanionState>((set, get) => ({
  characters,
  characterId: characters[0].id,
  baseState: 'idle',
  petting: false,
  init: async () => {
    const saved = await window.companion.settings.getCharacter();
    if (saved && get().characters.some((c) => c.id === saved)) set({ characterId: saved });
  },
  selectCharacter: (id) => {
    if (!get().characters.some((c) => c.id === id)) return;
    set({ characterId: id });
    window.companion.settings.setCharacter(id);
  },
  setBaseState: (baseState) => set({ baseState }),
  pet: () => set({ petting: true }),
  endPet: () => set({ petting: false }),
}));

export function selectCurrentCharacter(s: CompanionState): CharacterDefinition {
  return s.characters.find((c) => c.id === s.characterId) ?? s.characters[0];
}

export function selectAnimationState(s: CompanionState): AnimationState {
  return s.petting ? 'petted' : s.baseState;
}
