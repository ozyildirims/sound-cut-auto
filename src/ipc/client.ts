import type { AutocutApi } from '@shared/api'

declare global {
  interface Window {
    autocut: AutocutApi
  }
}

export const ipc: AutocutApi = window.autocut

export {}
