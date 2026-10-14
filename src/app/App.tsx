import { es } from '../i18n/es-AR';
import styles from './App.module.css';

export function App() {
  return (
    <main className={styles.shell}>
      <h1>{es.app.title}</h1>
      <p>{es.app.scaffoldReady}</p>
      <small>
        {es.app.platform}: {window.companion?.platform ?? '—'}
      </small>
    </main>
  );
}
