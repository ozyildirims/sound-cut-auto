import { useEffect, useState } from 'react'
import { Toolbar } from './components/layout/Toolbar'
import { LeftRail } from './components/layout/LeftRail'
import { CenterStage } from './components/layout/CenterStage'
import { Inspector } from './components/layout/Inspector'
import { StatusBar } from './components/layout/StatusBar'
import { CliMissingBanner } from './components/system/CliMissingBanner'
import { Toaster } from './components/system/Toaster'
import { CommandPalette } from './components/system/CommandPalette'
import { ImportContent } from './screens/ImportContent'
import { ProjectCenter } from './screens/ProjectCenter'
import { ProjectInspector } from './screens/ProjectInspector'
import { JobsContent } from './screens/JobsContent'
import { SettingsContent } from './screens/SettingsContent'
import { ipc } from './ipc/client'
import { useAppStore, type Screen } from './state/store'

const VALID_SCREENS = new Set<Screen>(['import', 'project', 'jobs', 'settings'])

export function App() {
  const screen = useAppStore((s) => s.screen)
  const loadSettings = useAppStore((s) => s.loadSettings)
  const refreshCli = useAppStore((s) => s.refreshCli)
  const setCliStatus = useAppStore((s) => s.setCliStatus)
  const applyJobEvent = useAppStore((s) => s.applyJobEvent)
  const hydrateJobs = useAppStore((s) => s.hydrateJobs)
  const loadRecent = useAppStore((s) => s.loadRecent)
  const setRecentFiles = useAppStore((s) => s.setRecentFiles)
  const setScreen = useAppStore((s) => s.setScreen)
  const addFiles = useAppStore((s) => s.addFiles)
  const startExport = useAppStore((s) => s.startExport)
  const startPreview = useAppStore((s) => s.startPreview)
  const [paletteOpen, setPaletteOpen] = useState(false)

  useEffect(() => {
    void loadSettings()
    void refreshCli()
    void hydrateJobs()
    void loadRecent()
    const offStatus = ipc.cli.onStatusChanged((status) => setCliStatus(status))
    const offJobs = ipc.jobs.onEvent((event) => applyJobEvent(event))
    const offRecent = ipc.recent.onChanged((paths) => setRecentFiles(paths))
    const offNav = ipc.menu.onNavigate((target) => {
      if (VALID_SCREENS.has(target as Screen)) setScreen(target as Screen)
    })
    const offMenuFiles = ipc.menu.onFilesAdded((paths) => addFiles(paths))
    const offMenuExport = ipc.menu.onTriggerExport(() => void startExport())
    const offMenuPreview = ipc.menu.onTriggerPreview(() => {
      const file = useAppStore.getState().files[0]
      if (file) void startPreview(file.path)
    })
    return () => {
      offStatus()
      offJobs()
      offRecent()
      offNav()
      offMenuFiles()
      offMenuExport()
      offMenuPreview()
    }
  }, [
    loadSettings,
    refreshCli,
    hydrateJobs,
    loadRecent,
    setCliStatus,
    applyJobEvent,
    setRecentFiles,
    setScreen,
    addFiles,
    startExport,
    startPreview
  ])

  return (
    <div className="flex h-full flex-col">
      <Toolbar onCommandPalette={() => setPaletteOpen(true)} />
      <CliMissingBanner />
      <div className="flex flex-1 overflow-hidden">
        <LeftRail />
        <CenterStage>
          {screen === 'import' && <ImportContent />}
          {screen === 'project' && <ProjectCenter />}
          {screen === 'jobs' && <JobsContent />}
          {screen === 'settings' && <SettingsContent />}
        </CenterStage>
        {screen === 'project' && (
          <Inspector>
            <ProjectInspector />
          </Inspector>
        )}
      </div>
      <StatusBar />
      <Toaster />
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </div>
  )
}
