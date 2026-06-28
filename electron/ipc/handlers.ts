import path from 'node:path'
import { BrowserWindow, ipcMain } from 'electron'
import { IPC } from '@shared/ipc'
import type { AutoEditSettings, CliStatus, ExportFormat, StartJobInput } from '@shared/types'
import {
  openLogsDir,
  openPath,
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
  ipcMain.handle(IPC.shellOpen, async (_e, targetPath: string) => {
    if (typeof targetPath === 'string' && targetPath) await openPath(targetPath)
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
    const resolved: StartJobInput = { ...input, outputPath: resolveOutputPath(input) }
    logger.info('job:start', { mode: resolved.mode, file: resolved.filePath, outputPath: resolved.outputPath })
    return createJob({ binary: status.path, input: resolved })
  })

  ipcMain.handle(IPC.jobCancel, async (_e, jobId: string) => {
    cancelJob(jobId)
  })

  ipcMain.handle(IPC.jobList, async () => listJobs())
}

// null = leave auto-editor's default (it picks the right extension itself)
const FORMAT_EXTENSION: Record<ExportFormat, string | null> = {
  default: null,
  premiere: '.xml',
  'final-cut-pro': '.fcpxml',
  resolve: '.xml',
  shotcut: '.mlt',
  json: '.json',
  audio: '.m4a',
  'clip-sequence': null
}

function resolveOutputPath(input: StartJobInput): string | undefined {
  if (input.mode !== 'export') return undefined
  if (input.outputPath) return input.outputPath
  const format = input.settings.exportFormat
  const formatExt = FORMAT_EXTENSION[format]
  // clip-sequence produces a directory of clips; let auto-editor decide.
  if (format === 'clip-sequence') return undefined
  const inputExt = path.extname(input.filePath) || '.mp4'
  const ext = formatExt ?? inputExt
  const base = path.basename(input.filePath, inputExt)
  const fileName = `${base}_ALTERED${ext}`
  const dir = input.settings.outputDir || path.dirname(input.filePath)
  return path.join(dir, fileName)
}
