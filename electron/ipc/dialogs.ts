import { BrowserWindow, dialog, shell } from 'electron'
import { getLogsDir } from '../util/paths'

const VIDEO_EXTENSIONS = ['mp4', 'mov', 'mkv', 'webm', 'm4a', 'mp3', 'wav', 'aac', 'flac', 'ogg', 'avi']

export async function openVideoFiles(): Promise<string[]> {
  const focused = BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0]
  const result = focused
    ? await dialog.showOpenDialog(focused, {
        title: 'Video / audio dosyalarını seç',
        properties: ['openFile', 'multiSelections'],
        filters: [{ name: 'Video & audio', extensions: VIDEO_EXTENSIONS }]
      })
    : await dialog.showOpenDialog({
        properties: ['openFile', 'multiSelections'],
        filters: [{ name: 'Video & audio', extensions: VIDEO_EXTENSIONS }]
      })
  if (result.canceled) return []
  return result.filePaths
}

export async function selectFolder(): Promise<string | null> {
  const focused = BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0]
  const result = focused
    ? await dialog.showOpenDialog(focused, {
        title: 'Çıktı klasörünü seç',
        properties: ['openDirectory', 'createDirectory']
      })
    : await dialog.showOpenDialog({ properties: ['openDirectory', 'createDirectory'] })
  if (result.canceled || !result.filePaths[0]) return null
  return result.filePaths[0]
}

export async function selectCliBinary(): Promise<string | null> {
  const focused = BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0]
  const result = focused
    ? await dialog.showOpenDialog(focused, {
        title: 'auto-editor binary seç',
        properties: ['openFile']
      })
    : await dialog.showOpenDialog({ properties: ['openFile'] })
  if (result.canceled || !result.filePaths[0]) return null
  return result.filePaths[0]
}

export async function suggestSaveFile(suggestedName?: string): Promise<string | null> {
  const focused = BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0]
  const result = focused
    ? await dialog.showSaveDialog(focused, {
        title: 'Çıktıyı kaydet',
        defaultPath: suggestedName
      })
    : await dialog.showSaveDialog({ defaultPath: suggestedName })
  if (result.canceled || !result.filePath) return null
  return result.filePath
}

export function revealInFinder(targetPath: string): void {
  shell.showItemInFolder(targetPath)
}

export async function openPath(targetPath: string): Promise<void> {
  await shell.openPath(targetPath)
}

export async function openLogsDir(): Promise<void> {
  await shell.openPath(getLogsDir())
}
