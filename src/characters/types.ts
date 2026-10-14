export const ANIMATION_STATES = ['idle', 'focus', 'break', 'alert', 'petted'] as const;
export type AnimationState = (typeof ANIMATION_STATES)[number];

/** `default` is required; any missing state falls back to it. */
export type CharacterStates = { default: string } & Partial<Record<AnimationState, string>>;

export type CharacterDefinition =
  | {
      id: string;
      name: string;
      /** Static or animated image (PNG, WebP, GIF, APNG). */
      type: 'image';
      /** Resolved URLs, ready for `<img src>`. */
      states: CharacterStates;
      scale: number;
      anchor: 'bottom' | 'center';
    }
  | {
      id: string;
      name: string;
      /** Built-in CSS mascot, used until the user adds their own. */
      type: 'placeholder';
    };

/** Shape of manifest.json entries (paths relative to assets/characters/). */
export interface ManifestEntry {
  id: string;
  name?: string;
  type?: 'image' | 'placeholder';
  states?: Partial<Record<'default' | AnimationState, string>>;
  scale?: number;
  anchor?: 'bottom' | 'center';
}

export interface Manifest {
  characters: ManifestEntry[];
}
