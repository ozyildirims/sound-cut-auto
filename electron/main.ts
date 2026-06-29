import { app, BrowserWindow, nativeImage, shell } from 'electron'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { registerIpcHandlers, ensureCliStatus } from './ipc/handlers'
import { installAppMenu } from './app-menu'
import { setupAutoUpdater } from './updater'
import { installLocalMediaHandler, registerLocalMediaScheme } from './protocol'
import { logger } from './util/logger'

// Privileged scheme registration must happen before app is ready.
registerLocalMediaScheme()

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const isDev = !app.isPackaged

// Override the OS-visible name as early as possible so dev runs (which boot
// the bare Electron binary with its own Info.plist) at least show
// "Sound Cut Auto" in the app menu / Cmd+Tab / process listings.
app.setName('Sound Cut Auto')

let mainWindow: BrowserWindow | null = null

function getIconPath(): string {
  const iconResource = process.platform === 'win32' ? 'icon.ico' : 'icon.png'
  if (app.isPackaged) {
    return path.join(process.resourcesPath, iconResource)
  }
  return path.join(app.getAppPath(), 'resources', iconResource)
}

async function createMainWindow(): Promise<void> {
  const iconPath = getIconPath()
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 640,
    backgroundColor: '#0b0d10',
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    icon: process.platform === 'linux' ? iconPath : undefined,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      sandbox: false,
      nodeIntegration: false
    }
  })
  if (process.platform === 'darwin' && app.dock) {
    try {
      const img = nativeImage.createFromPath(iconPath)
      if (!img.isEmpty()) app.dock.setIcon(img)
    } catch (err) {
      logger.warn('dock icon failed', err)
    }
  }

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  if (isDev && process.env.ELECTRON_RENDERER_URL) {
    await mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  } else {
    await mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(async () => {
  installLocalMediaHandler()
  registerIpcHandlers()
  installAppMenu()
  setupAutoUpdater()
  void ensureCliStatus().then((status) => logger.info('cli status', status))
  await createMainWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) void createMainWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

process.on('uncaughtException', (err) => {
  logger.error('uncaught', err)
})
process.on('unhandledRejection', (reason) => {
  logger.error('unhandled rejection', reason)
})
