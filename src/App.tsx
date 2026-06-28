import { useEffect } from 'react'
import { Sidebar } from './components/layout/Sidebar'
import { TitleBar } from './components/layout/TitleBar'
import { CliMissingBanner } from './components/system/CliMissingBanner'
import { ImportScreen } from './screens/ImportScreen'
import { ProjectScreen } from './screens/ProjectScreen'
import { JobsScreen } from './screens/JobsScreen'
import { SettingsScreen } from './screens/SettingsScreen'
import { ipc } from './ipc/client'
import { useAppStore } from './state/store'

export function App() {
  const screen = useAppStore((s) => s.screen)
  const loadSettings = useAppStore((s) => s.loadSettings)
  const refreshCli = useAppStore((s) => s.refreshCli)
  const setCliStatus = useAppStore((s) => s.setCliStatus)
  const applyJobEvent = useAppStore((s) => s.applyJobEvent)
  const hydrateJobs = useAppStore((s) => s.hydrateJobs)

  useEffect(() => {
    void loadSettings()
    void refreshCli()
    void hydrateJobs()
    const offStatus = ipc.cli.onStatusChanged((status) => setCliStatus(status))
    const offJobs = ipc.jobs.onEvent((event) => applyJobEvent(event))
    return () => {
      offStatus()
      offJobs()
    }
  }, [loadSettings, refreshCli, hydrateJobs, setCliStatus, applyJobEvent])

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
