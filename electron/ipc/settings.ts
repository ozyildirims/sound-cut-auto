import Store from 'electron-store'
import { DEFAULT_SETTINGS, type AutoEditSettings } from '@shared/types'

interface PersistedSchema {
  settings: AutoEditSettings
  cliOverride: string | null
  recentFiles: string[]
}

const RECENT_LIMIT = 10

const store = new Store<PersistedSchema>({
  name: 'sound-cut-auto-config',
  defaults: {
    settings: DEFAULT_SETTINGS,
    cliOverride: null,
    recentFiles: []
  }
})

export function getSettings(): AutoEditSettings {
  const persisted = store.get('settings')
  return { ...DEFAULT_SETTINGS, ...persisted }
}

export function setSettings(next: AutoEditSettings): AutoEditSettings {
  const merged = { ...DEFAULT_SETTINGS, ...next }
  store.set('settings', merged)
  return merged
}

export function getCliOverride(): string | null {
  return store.get('cliOverride') ?? null
}

export function setCliOverride(value: string | null): void {
  store.set('cliOverride', value)
}

export function getRecentFiles(): string[] {
  return store.get('recentFiles') ?? []
}

export function addRecentFiles(paths: string[]): string[] {
  const current = getRecentFiles()
  const merged = [...paths, ...current.filter((p) => !paths.includes(p))].slice(0, RECENT_LIMIT)
  store.set('recentFiles', merged)
  return merged
}

export function clearRecentFiles(): void {
  store.set('recentFiles', [])
}
