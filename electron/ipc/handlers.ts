import { BrowserWindow, ipcMain } from 'electron'
import { IPC } from '@shared/ipc'
import type { AutoEditSettings, CliStatus, StartJobInput } from '@shared/types'
import {
  openLogsDir,
  openVideoFiles,
  revealInFinder,
  selectCliBinary,
  selectFolder,
  suggestSaveFile
} from './dialogs'
import { cancelJob, createJob, listJobs } from './jobs'
import {
  getCliOverride,
  getSettings,
  setCliOverride,
  setSettings
} from './settings'
import { locateCli } from '../cli/locate'
import { logger } from '../util/logger'

let cachedStatus: CliStatus | null = null

async function refreshStatus(): Promise<CliStatus> {
  const status = await locateCli({ override: getCliOverride() })
  cachedStatus = status
  for (const win of BrowserWindow.getAllWindows()) {
    win.webContents.send(IPC.cliStatusChanged, status)
  }
  return status
}

export async function ensureCliStatus(): Promise<CliStatus> {
  if (cachedStatus) return cachedStatus
  return refreshStatus()
}

export function registerIpcHandlers(): void {
  ipcMain.handle(IPC.cliGetStatus, async () => ensureCliStatus())

  ipcMain.handle(IPC.cliLocateManual, async () => {
    const picked = await selectCliBinary()
    if (picked) setCliOverride(picked)
    return refreshStatus()
  })

  ipcMain.handle(IPC.cliResetOverride, async () => {
    setCliOverride(null)
    return refreshStatus()
  })

  ipcMain.handle(IPC.dialogOpenFiles, async () => openVideoFiles())
  ipcMain.handle(IPC.dialogSelectFolder, async () => selectFolder())
  ipcMain.handle(IPC.dialogSaveFile, async (_e, payload: { suggestedName?: string } | undefined) =>
    suggestSaveFile(payload?.suggestedName)
  )

  ipcMain.handle(IPC.shellReveal, async (_e, targetPath: string) => {
    if (typeof targetPath === 'string' && targetPath) revealInFinder(targetPath)
  })
  ipcMain.handle(IPC.shellOpenLogs, async () => {
    await openLogsDir()
  })

  ipcMain.handle(IPC.settingsGet, async () => getSettings())
  ipcMain.handle(IPC.settingsSet, async (_e, next: AutoEditSettings) => setSettings(next))

  ipcMain.handle(IPC.jobStart, async (_e, input: StartJobInput) => {
    const status = await ensureCliStatus()
    if (!status.found || !status.path) {
      throw new Error('auto-editor binary bulunamadı. Lütfen ayarlardan bir yol gösterin.')
    }
    logger.info('job:start', { mode: input.mode, file: input.filePath })
    return createJob({ binary: status.path, input })
  })

  ipcMain.handle(IPC.jobCancel, async (_e, jobId: string) => {
    cancelJob(jobId)
  })

  ipcMain.handle(IPC.jobList, async () => listJobs())
}
