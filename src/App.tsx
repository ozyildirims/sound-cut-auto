import { useEffect } from 'react'
import { Sidebar } from './components/layout/Sidebar'
import { TitleBar } from './components/layout/TitleBar'
import { CliMissingBanner } from './components/system/CliMissingBanner'
import { ImportScreen } from './screens/ImportScreen'
import { ProjectScreen } from './screens/ProjectScreen'
import { JobsScreen } from './screens/JobsScreen'
import { SettingsScreen } from './screens/SettingsScreen'
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
      <TitleBar />
      <CliMissingBanner />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          {screen === 'import' && <ImportScreen />}
          {screen === 'project' && <ProjectScreen />}
          {screen === 'jobs' && <JobsScreen />}
          {screen === 'settings' && <SettingsScreen />}
        </main>
      </div>
    </div>
  )
}
