import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron'
import { IPC, type IpcContract, type JobEventPayload } from '@shared/ipc'
import type { CliStatus } from '@shared/types'
import type { AutocutApi } from '@shared/api'

type Channel = keyof IpcContract

function invoke<C extends Channel>(
  channel: C,
  payload?: IpcContract[C]['request']
): Promise<IpcContract[C]['response']> {
  return ipcRenderer.invoke(channel, payload) as Promise<IpcContract[C]['response']>
}

const api: AutocutApi = {
  cli: {
    getStatus: () => invoke(IPC.cliGetStatus),
    locateManual: () => invoke(IPC.cliLocateManual),
    resetOverride: () => invoke(IPC.cliResetOverride),
    onStatusChanged: (cb: (status: CliStatus) => void) => {
      const handler = (_e: IpcRendererEvent, status: CliStatus) => cb(status)
      ipcRenderer.on(IPC.cliStatusChanged, handler)
      return () => ipcRenderer.removeListener(IPC.cliStatusChanged, handler)
    }
  },
  dialog: {
    openFiles: () => invoke(IPC.dialogOpenFiles),
    selectFolder: () => invoke(IPC.dialogSelectFolder),
    saveFile: (suggestedName?: string) => invoke(IPC.dialogSaveFile, { suggestedName })
  },
  shell: {
    reveal: (path: string) => invoke(IPC.shellReveal, path),
    open: (path: string) => invoke(IPC.shellOpen, path),
    openLogs: () => invoke(IPC.shellOpenLogs)
  },
  settings: {
    get: () => invoke(IPC.settingsGet),
    set: (settings: IpcContract[typeof IPC.settingsSet]['request']) =>
      invoke(IPC.settingsSet, settings)
  },
  jobs: {
    start: (input: IpcContract[typeof IPC.jobStart]['request']) =>
      invoke(IPC.jobStart, input),
    cancel: (jobId: string) => invoke(IPC.jobCancel, jobId),
    list: () => invoke(IPC.jobList),
    onEvent: (cb: (event: JobEventPayload) => void) => {
      const handler = (_e: IpcRendererEvent, event: JobEventPayload) => cb(event)
      ipcRenderer.on(IPC.jobEvent, handler)
      return () => ipcRenderer.removeListener(IPC.jobEvent, handler)
    }
  },
  media: {
    probe: (filePath: string) => invoke(IPC.mediaProbe, filePath),
    levels: (filePath: string) => invoke(IPC.mediaLevels, filePath)
  },
  update: {
    check: () => invoke(IPC.updateCheck)
  },
  diag: {
    reportError: (payload) => invoke(IPC.diagReportError, payload)
  },
  recent: {
    list: () => ipcRenderer.invoke('recent:list') as Promise<string[]>,
    add: (paths: string[]) => ipcRenderer.invoke('recent:add', paths) as Promise<string[]>,
    clear: () => ipcRenderer.invoke('recent:clear') as Promise<string[]>,
    onChanged: (cb: (paths: string[]) => void) => {
      const handler = (_e: IpcRendererEvent, paths: string[]) => cb(paths)
      ipcRenderer.on(IPC.recentFilesChanged, handler)
      return () => ipcRenderer.removeListener(IPC.recentFilesChanged, handler)
    }
  },
  menu: {
    onNavigate: (cb: (screen: string) => void) => {
      const handler = (_e: IpcRendererEvent, screen: string) => cb(screen)
      ipcRenderer.on(IPC.menuNavigate, handler)
      return () => ipcRenderer.removeListener(IPC.menuNavigate, handler)
    },
    onFilesAdded: (cb: (paths: string[]) => void) => {
      const handler = (_e: IpcRendererEvent, paths: string[]) => cb(paths)
      ipcRenderer.on(IPC.menuFilesAdded, handler)
      return () => ipcRenderer.removeListener(IPC.menuFilesAdded, handler)
    },
    onTriggerPreview: (cb: () => void) => {
      const handler = () => cb()
      ipcRenderer.on(IPC.menuTriggerPreview, handler)
      return () => ipcRenderer.removeListener(IPC.menuTriggerPreview, handler)
    },
    onTriggerExport: (cb: () => void) => {
      const handler = () => cb()
      ipcRenderer.on(IPC.menuTriggerExport, handler)
      return () => ipcRenderer.removeListener(IPC.menuTriggerExport, handler)
    }
  },
  platform: process.platform
}

contextBridge.exposeInMainWorld('autocut', api)
