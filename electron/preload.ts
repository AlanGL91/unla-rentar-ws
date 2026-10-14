import { contextBridge } from 'electron';

// Minimal, typed surface. Grows phase by phase (window state, api:request…).
const companionApi = {
  platform: process.platform,
} as const;

contextBridge.exposeInMainWorld('companion', companionApi);

export type CompanionApi = typeof companionApi;
