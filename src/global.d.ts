export {};

export type WindowMode = 'collapsed' | 'expanded';

declare global {
  interface Window {
    companion: {
      readonly platform: string;
      readonly window: {
        getMode(): Promise<WindowMode | null>;
        setMode(mode: WindowMode): void;
        onModeChanged(listener: (mode: WindowMode) => void): () => void;
        setIgnoreMouse(ignore: boolean): void;
        dragStart(): void;
        dragMove(): void;
        dragEnd(): void;
      };
      readonly settings: {
        getCharacter(): Promise<string | null>;
        setCharacter(id: string): void;
      };
    };
  }
}
