import { app } from 'electron'
import path from 'node:path'

export function getResourcesBinDir(): string {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'bin')
  }
  return path.join(app.getAppPath(), 'resources', 'bin')
}

export function getSidecarBinaryPath(): string {
  const platform = process.platform
  const arch = process.arch
  const slug = `${platform}-${arch}`
  const exe = platform === 'win32' ? 'auto-editor.exe' : 'auto-editor'
  return path.join(getResourcesBinDir(), slug, exe)
}

export function getUserDataDir(): string {
  return app.getPath('userData')
}

export function getLogsDir(): string {
  return app.getPath('logs')
}
