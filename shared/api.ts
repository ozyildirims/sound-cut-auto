import type { AutoEditSettings, CliStatus, Job, JobEvent, StartJobInput } from './types'

export interface AutocutApi {
  cli: {
    getStatus: () => Promise<CliStatus>
    locateManual: () => Promise<CliStatus>
    resetOverride: () => Promise<CliStatus>
    onStatusChanged: (cb: (status: CliStatus) => void) => () => void
  }
  dialog: {
    openFiles: () => Promise<string[]>
    selectFolder: () => Promise<string | null>
    saveFile: (suggestedName?: string) => Promise<string | null>
  }
  shell: {
    reveal: (path: string) => Promise<void>
    openLogs: () => Promise<void>
  }
  settings: {
    get: () => Promise<AutoEditSettings>
    set: (settings: AutoEditSettings) => Promise<AutoEditSettings>
  }
  jobs: {
    start: (input: StartJobInput) => Promise<{ jobId: string }>
    cancel: (jobId: string) => Promise<void>
    list: () => Promise<Job[]>
    onEvent: (cb: (event: JobEvent) => void) => () => void
  }
  platform: 'aix' | 'android' | 'darwin' | 'freebsd' | 'haiku' | 'linux' | 'openbsd' | 'sunos' | 'win32' | 'cygwin' | 'netbsd'
}
