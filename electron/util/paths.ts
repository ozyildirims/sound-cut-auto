import { app } from 'electron'
import path from 'node:path'

// Use the same slug shape electron-builder's ${platform}-${arch} produces
// for extraResources (darwin-*, win-*, linux-*) so dev / packaged / fetch
// scripts all agree on the directory name.
export function platformSlug(): string {
  const norm = process.platform === 'win32' ? 'win' : process.platform
  return `${norm}-${process.arch}`
}

export function getResourcesBinDir(): string {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'bin')
  }
  return path.join(app.getAppPath(), 'resources', 'bin')
}

export function getSidecarBinaryPath(): string {
  const slug = platformSlug()
  const exe = process.platform === 'win32' ? 'auto-editor.exe' : 'auto-editor'
  return path.join(getResourcesBinDir(), slug, exe)
}

export function getUserDataDir(): string {
  return app.getPath('userData')
}

export function getLogsDir(): string {
  return app.getPath('logs')
}
