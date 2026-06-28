import { app, BrowserWindow, dialog, shell } from 'electron'
import pkg from 'electron-updater'
import log from 'electron-log/main'

const { autoUpdater } = pkg

let initialized = false

export function setupAutoUpdater(): void {
  if (initialized) return
  if (!app.isPackaged) {
    log.info('updater: skipped (not packaged)')
    return
  }
  initialized = true

  autoUpdater.logger = log
  autoUpdater.autoDownload = true
  autoUpdater.autoInstallOnAppQuit = true

  autoUpdater.on('error', (err) => log.warn('updater error', err))
  autoUpdater.on('update-available', (info) => {
    log.info('updater: update available', info.version)
  })
  autoUpdater.on('update-not-available', () => log.info('updater: up-to-date'))
  autoUpdater.on('update-downloaded', async (info) => {
    log.info('updater: downloaded', info.version)
    const win = BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0]
    const result = await dialog.showMessageBox(win ?? undefined!, {
      type: 'info',
      title: 'Güncelleme hazır',
      message: `Sound Cut Auto ${info.version} indirildi.`,
      detail: 'Yeniden başlatınca yüklenir.',
      buttons: ['Şimdi yeniden başlat', 'Daha sonra'],
      defaultId: 0,
      cancelId: 1
    })
    if (result.response === 0) autoUpdater.quitAndInstall()
  })

  // Initial check shortly after startup, then every 6 hours.
  setTimeout(() => void checkForUpdates({ silent: true }), 8_000)
  setInterval(() => void checkForUpdates({ silent: true }), 6 * 60 * 60 * 1000)
}

export async function checkForUpdates(opts: { silent: boolean } = { silent: false }): Promise<void> {
  if (!app.isPackaged) {
    if (!opts.silent) {
      await dialog.showMessageBox({
        type: 'info',
        message: 'Geliştirme modunda güncelleme kontrolü kapalı.'
      })
    }
    return
  }
  try {
    const result = await autoUpdater.checkForUpdates()
    if (!opts.silent && result?.updateInfo) {
      const current = app.getVersion()
      if (result.updateInfo.version === current) {
        await dialog.showMessageBox({
          type: 'info',
          message: 'Zaten en güncel sürümdesin.',
          detail: `Sürüm: ${current}`
        })
      }
    }
  } catch (err) {
    log.warn('updater: check failed', err)
    if (!opts.silent) {
      const result = await dialog.showMessageBox({
        type: 'warning',
        title: 'Güncelleme kontrolü başarısız',
        message: err instanceof Error ? err.message : String(err),
        buttons: ['Tamam', 'GitHub releases\'ı aç'],
        defaultId: 0
      })
      if (result.response === 1) {
        await shell.openExternal('https://github.com/ozyildirims/sound-cut-auto/releases')
      }
    }
  }
}
