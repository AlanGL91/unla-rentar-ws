import builtInManifest from './manifest.json';
import { ANIMATION_STATES, type CharacterDefinition, type Manifest, type ManifestEntry } from './types';

const ASSETS_DIR = '/assets/characters/';

// User characters live in assets/characters/<id>/<state>.<ext> (kept out of git).
const assetUrls = import.meta.glob('/assets/characters/*/*.{png,webp,gif,apng}', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

// Optional local manifest to rename, rescale or remap states of user characters.
const userManifests = import.meta.glob('/assets/characters/manifest.json', {
  eager: true,
  import: 'default',
}) as Record<string, Manifest>;

const STATE_KEYS: readonly string[] = ['default', ...ANIMATION_STATES];

function titleCase(id: string): string {
  return id.replace(/[-_]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Groups discovered files by folder: `{ charmander: { default: url, focus: url } }`. */
function discoverFolders(): Map<string, Record<string, string>> {
  const folders = new Map<string, Record<string, string>>();
  for (const [file, url] of Object.entries(assetUrls)) {
    const [id, fileName] = file.slice(ASSETS_DIR.length).split('/');
    const state = fileName.replace(/\.[^.]+$/, '');
    if (!STATE_KEYS.includes(state)) continue;
    folders.set(id, { ...folders.get(id), [state]: url });
  }
  return folders;
}

function toDefinition(
  entry: ManifestEntry,
  discovered: Record<string, string> | undefined,
): CharacterDefinition | null {
  const name = entry.name ?? titleCase(entry.id);
  if (entry.type === 'placeholder') return { id: entry.id, name, type: 'placeholder' };

  const states: Record<string, string> = { ...discovered };
  for (const [state, relativePath] of Object.entries(entry.states ?? {})) {
    const url = assetUrls[ASSETS_DIR + relativePath];
    if (url) states[state] = url;
    else console.warn(`[characters] "${entry.id}": not found assets/characters/${relativePath}`);
  }
  const fallback = states.default ?? Object.values(states)[0];
  if (!fallback) {
    console.warn(`[characters] "${entry.id}" has no images, skipping it`);
    return null;
  }
  return {
    id: entry.id,
    name,
    type: 'image',
    states: { ...states, default: fallback },
    scale: entry.scale ?? 1,
    anchor: entry.anchor ?? 'bottom',
  };
}

function loadCharacters(): CharacterDefinition[] {
  const folders = discoverFolders();
  const entries = new Map<string, ManifestEntry>();
  for (const id of folders.keys()) entries.set(id, { id, type: 'image' });
  for (const manifest of Object.values(userManifests)) {
    for (const entry of manifest.characters ?? []) {
      entries.set(entry.id, { ...entries.get(entry.id), ...entry });
    }
  }

  const user = [...entries.values()]
    .map((entry) => toDefinition(entry, folders.get(entry.id)))
    .filter((c): c is CharacterDefinition => c !== null);
  const builtIn = (builtInManifest as Manifest).characters
    .filter((entry) => !entries.has(entry.id))
    .map((entry) => toDefinition(entry, undefined))
    .filter((c): c is CharacterDefinition => c !== null);

  // User characters first, so a freshly added one becomes the default pick.
  return [...user, ...builtIn];
}

export const characters: readonly CharacterDefinition[] = loadCharacters();
