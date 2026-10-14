import { useCompanionStore } from '../characters/companionStore';
import { es } from '../i18n/es-AR';
import styles from './DevPanel.module.css';

const PREVIEW_STATES = ['idle', 'focus', 'break', 'alert'] as const;

/** Temporary panel until the radial menu and Pomodoro module (phases 4–5). */
export function DevPanel() {
  const characters = useCompanionStore((s) => s.characters);
  const characterId = useCompanionStore((s) => s.characterId);
  const baseState = useCompanionStore((s) => s.baseState);
  const selectCharacter = useCompanionStore((s) => s.selectCharacter);
  const setBaseState = useCompanionStore((s) => s.setBaseState);
  const pet = useCompanionStore((s) => s.pet);

  return (
    <section className={styles.panel} data-interactive>
      <h1 className={styles.title}>{es.app.title}</h1>

      <label className={styles.field}>
        <span>{es.character.change}</span>
        <select value={characterId} onChange={(e) => selectCharacter(e.target.value)}>
          {characters.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>

      <button type="button" className={styles.primary} onClick={pet}>
        {es.character.pet}
      </button>

      <fieldset className={styles.states}>
        <legend>{es.character.previewStates}</legend>
        {PREVIEW_STATES.map((state) => (
          <button
            key={state}
            type="button"
            aria-pressed={baseState === state}
            onClick={() => setBaseState(state)}
          >
            {es.character.states[state]}
          </button>
        ))}
      </fieldset>
    </section>
  );
}
