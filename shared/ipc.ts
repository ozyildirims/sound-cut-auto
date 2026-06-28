import type {
  AutoEditSettings,
  CliStatus,
  Job,
  JobEvent,
  StartJobInput
} from './types'

export const IPC = {
  cliGetStatus: 'cli:get-status',
  cliLocateManual: 'cli:locate-manual',
  cliResetOverride: 'cli:reset-override',
  cliStatusChanged: 'cli:status-changed',

  dialogOpenFiles: 'dialog:open-files',
  dialogSelectFolder: 'dialog:select-folder',
  dialogSaveFile: 'dialog:save-file',

  shellReveal: 'shell:reveal',
  shellOpen: 'shell:open',
  shellOpenLogs: 'shell:open-logs',

  settingsGet: 'settings:get',
  settingsSet: 'settings:set',

  jobStart: 'job:start',
  jobCancel: 'job:cancel',
  jobList: 'job:list',
  jobEvent: 'job:event'
} as const

export type IpcChannel = (typeof IPC)[keyof typeof IPC]

export interface IpcContract {
  [IPC.cliGetStatus]: { request: void; response: CliStatus }
  [IPC.cliLocateManual]: { request: void; response: CliStatus }
  [IPC.cliResetOverride]: { request: void; response: CliStatus }
  [IPC.dialogOpenFiles]: { request: void; response: string[] }
  [IPC.dialogSelectFolder]: { request: void; response: string | null }
  [IPC.dialogSaveFile]: { request: { suggestedName?: string }; response: string | null }
  [IPC.shellReveal]: { request: string; response: void }
  [IPC.shellOpen]: { request: string; response: void }
  [IPC.shellOpenLogs]: { request: void; response: void }
  [IPC.settingsGet]: { request: void; response: AutoEditSettings }
  [IPC.settingsSet]: { request: AutoEditSettings; response: AutoEditSettings }
  [IPC.jobStart]: { request: StartJobInput; response: { jobId: string } }
  [IPC.jobCancel]: { request: string; response: void }
  [IPC.jobList]: { request: void; response: Job[] }
}

export type JobEventPayload = JobEvent
