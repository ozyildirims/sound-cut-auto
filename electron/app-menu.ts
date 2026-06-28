import { BrowserWindow, Menu, MenuItemConstructorOptions, app } from 'electron'
import { IPC } from '@shared/ipc'
import { openVideoFiles } from './ipc/dialogs'
import { getRecentFiles } from './ipc/settings'

const isMac = process.platform === 'darwin'

function sendToFocused(channel: string, payload?: unknown): void {
  const win = BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0]
  if (win) win.webContents.send(channel, payload)
}

async function handleOpen(): Promise<void> {
  const paths = await openVideoFiles()
  if (paths.length) sendToFocused(IPC.menuFilesAdded, paths)
}

export function installAppMenu(): void {
  const recent = getRecentFiles()
  const recentSubmenu: MenuItemConstructorOptions[] = recent.length
    ? recent.map((p) => ({
        label: trimMiddle(p, 60),
        click: () => sendToFocused(IPC.menuFilesAdded, [p])
      }))
    : [{ label: 'Henüz yok', enabled: false }]

  const template: MenuItemConstructorOptions[] = [
    ...(isMac
      ? ([
          {
            label: app.name,
            submenu: [
              { role: 'about' },
              { type: 'separator' },
              { role: 'services' },
              { type: 'separator' },
              { role: 'hide' },
              { role: 'hideOthers' },
              { role: 'unhide' },
              { type: 'separator' },
              { role: 'quit' }
            ]
          }
        ] as MenuItemConstructorOptions[])
      : []),
    {
      label: 'File',
      submenu: [
        {
          label: 'Video aç…',
          accelerator: 'CmdOrCtrl+O',
          click: () => void handleOpen()
        },
        {
          label: 'Son açılanlar',
          submenu: recentSubmenu
        },
        { type: 'separator' },
        {
          label: 'Export',
          accelerator: 'CmdOrCtrl+E',
          click: () => sendToFocused(IPC.menuTriggerExport)
        },
        {
          label: 'Önizleme çalıştır',
          accelerator: 'CmdOrCtrl+P',
          click: () => sendToFocused(IPC.menuTriggerPreview)
        },
        { type: 'separator' },
        isMac ? { role: 'close' } : { role: 'quit' }
      ]
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Import',
          accelerator: 'CmdOrCtrl+1',
          click: () => sendToFocused(IPC.menuNavigate, 'import')
        },
        {
          label: 'Project',
          accelerator: 'CmdOrCtrl+2',
          click: () => sendToFocused(IPC.menuNavigate, 'project')
        },
        {
          label: 'Jobs',
          accelerator: 'CmdOrCtrl+3',
          click: () => sendToFocused(IPC.menuNavigate, 'jobs')
        },
        {
          label: 'Settings',
          accelerator: 'CmdOrCtrl+4',
          click: () => sendToFocused(IPC.menuNavigate, 'settings')
        },
        { type: 'separator' },
        { role: 'reload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    { role: 'editMenu' },
    { role: 'windowMenu' }
  ]

  Menu.setApplicationMenu(Menu.buildFromTemplate(template))
}

function trimMiddle(s: string, max: number): string {
  if (s.length <= max) return s
  const half = Math.floor((max - 1) / 2)
  return s.slice(0, half) + '…' + s.slice(s.length - half)
}
