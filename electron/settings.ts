import { app } from 'electron';
import fs from 'node:fs';
import path from 'node:path';

export interface Settings {
  characterId?: string;
}

const CHARACTER_ID_PATTERN = /^[\w-]{1,64}$/;

function settingsFile(): string {
  return path.join(app.getPath('userData'), 'settings.json');
}

export function isValidCharacterId(value: unknown): value is string {
  return typeof value === 'string' && CHARACTER_ID_PATTERN.test(value);
}

export function loadSettings(): Settings {
  try {
    const parsed: unknown = JSON.parse(fs.readFileSync(settingsFile(), 'utf8'));
    if (typeof parsed !== 'object' || parsed === null) return {};
    const { characterId } = parsed as Record<string, unknown>;
    return isValidCharacterId(characterId) ? { characterId } : {};
  } catch {
    return {};
  }
}

export function saveSettings(settings: Settings): void {
  try {
    fs.mkdirSync(path.dirname(settingsFile()), { recursive: true });
    fs.writeFileSync(settingsFile(), JSON.stringify(settings, null, 2), 'utf8');
  } catch (error) {
    console.warn('[settings] could not save', error);
  }
}
