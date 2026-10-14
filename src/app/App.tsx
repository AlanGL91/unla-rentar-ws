import { useEffect } from 'react';
import { es } from '../i18n/es-AR';
import styles from './App.module.css';
import { useClickThrough } from './useClickThrough';
import { useDragOrClick } from './useDragOrClick';
import { useWindowStore } from './windowStore';

export function App() {
  const mode = useWindowStore((s) => s.mode);
  const setMode = useWindowStore((s) => s.setMode);
  const toggle = useWindowStore((s) => s.toggle);
  const dragHandlers = useDragOrClick(toggle);

  useClickThrough();
  useEffect(() => useWindowStore.getState().init(), []);

  useEffect(() => {
    const collapse = () => setMode('collapsed');
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') collapse();
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('blur', collapse);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('blur', collapse);
    };
  }, [setMode]);

  return (
    <main className={styles.shell} data-mode={mode}>
      {mode === 'expanded' && (
        <section className={styles.panel} data-interactive>
          <h1 className={styles.title}>{es.app.title}</h1>
          <p>{es.app.panelPlaceholder}</p>
        </section>
      )}
      <div className={styles.stage}>
        <button
          type="button"
          className={styles.character}
          aria-label={es.app.characterLabel}
          title={es.app.characterHint}
          data-interactive
          {...dragHandlers}
        />
      </div>
    </main>
  );
}
