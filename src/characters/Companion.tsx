import { useState, type AnimationEvent } from 'react';
import styles from './Companion.module.css';
import type { AnimationState, CharacterDefinition } from './types';

interface CompanionProps {
  character: CharacterDefinition;
  state: AnimationState;
  /** Fired when a one-shot animation (petted) finishes. */
  onOneShotEnd?: () => void;
}

/** Renders any character type and animates it according to `state`. */
export function Companion({ character, state, onOneShotEnd }: CompanionProps) {
  const [brokenSrc, setBrokenSrc] = useState<string | null>(null);

  const handleAnimationEnd = (event: AnimationEvent<HTMLSpanElement>) => {
    if (event.target === event.currentTarget && state === 'petted') onOneShotEnd?.();
  };

  let body;
  if (character.type === 'image') {
    const wanted = character.states[state] ?? character.states.default;
    const src = wanted === brokenSrc ? character.states.default : wanted;
    body = (
      <img
        className={styles.image}
        src={src}
        alt=""
        draggable={false}
        style={{ transform: `scale(${character.scale})` }}
        onError={() => setBrokenSrc(src)}
      />
    );
  } else {
    body = (
      <span className={styles.placeholder}>
        <span className={styles.eye} />
        <span className={styles.eye} />
      </span>
    );
  }

  const anchor = character.type === 'image' ? character.anchor : 'bottom';
  return (
    <span
      className={styles.figure}
      data-state={state}
      data-anchor={anchor}
      onAnimationEnd={handleAnimationEnd}
    >
      {body}
    </span>
  );
}
