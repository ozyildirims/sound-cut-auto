import { FolderInput, Scissors, ListChecks, Settings as SettingsIcon } from 'lucide-react'
import { useAppStore, type Screen } from '../../state/store'

const items: { id: Screen; label: string; icon: typeof FolderInput }[] = [
  { id: 'import', label: 'Import', icon: FolderInput },
  { id: 'project', label: 'Project', icon: Scissors },
  { id: 'jobs', label: 'Jobs', icon: ListChecks },
  { id: 'settings', label: 'Settings', icon: SettingsIcon }
]

export function Sidebar() {
  const screen = useAppStore((s) => s.screen)
  const setScreen = useAppStore((s) => s.setScreen)
  const jobs = useAppStore((s) => s.jobs)
  const runningCount = jobs.filter((j) => j.status === 'running' || j.status === 'queued').length

  return (
    <aside className="flex w-56 flex-col border-r border-edge bg-bg-surface/60">
      <nav className="flex-1 space-y-1 p-3">
        {items.map((item) => {
          const Icon = item.icon
          const active = screen === item.id
          return (
            <button
              key={item.id}
              onClick={() => setScreen(item.id)}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                active ? 'bg-accent/15 text-white' : 'text-zinc-300 hover:bg-white/5'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
              {item.id === 'jobs' && runningCount > 0 && (
                <span className="ml-auto rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold text-white">
                  {runningCount}
                </span>
              )}
            </button>
          )
        })}
      </nav>
      <div className="border-t border-edge p-3 text-[11px] text-zinc-500">
        Yerel makinende çalışır. Bulut yok.
      </div>
    </aside>
  )
}
