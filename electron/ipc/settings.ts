import Store from 'electron-store'
import { DEFAULT_SETTINGS, type AutoEditSettings } from '@shared/types'

interface PersistedSchema {
  settings: AutoEditSettings
  cliOverride: string | null
}

const store = new Store<PersistedSchema>({
  name: 'autocut-ui-config',
  defaults: {
    settings: DEFAULT_SETTINGS,
    cliOverride: null
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
