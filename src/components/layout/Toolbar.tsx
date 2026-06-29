import { Command, Settings as SettingsIcon, Upload, Play } from 'lucide-react'
import { Button, Tooltip } from '../ui'
import { ipc } from '../../ipc/client'
import { useAppStore } from '../../state/store'

interface Props {
  onCommandPalette: () => void
}

export function Toolbar({ onCommandPalette }: Props) {
  const isMac = ipc.platform === 'darwin'
  const setScreen = useAppStore((s) => s.setScreen)
  const screen = useAppStore((s) => s.screen)
  const files = useAppStore((s) => s.files)
  const cli = useAppStore((s) => s.cli)
  const addFiles = useAppStore((s) => s.addFiles)
  const startExport = useAppStore((s) => s.startExport)

  const canExport = files.length > 0 && cli.found

  async function handleImport() {
    const paths = await ipc.dialog.openFiles()
    if (paths.length) addFiles(paths)
  }

  return (
    <header
      className={`drag-region flex h-11 items-center gap-2 border-b border-edge-subtle bg-bg-zenith/70 px-3 backdrop-blur ${
        isMac ? 'pl-20' : 'pl-3'
      }`}
    >
      <div className="flex items-center gap-2 no-drag">
        <div className="h-6 w-6 rounded-md accent-gradient shadow-glow" />
        <span className="text-display text-md font-semibold tracking-tight text-text-primary">
          Sound Cut Auto
        </span>
      </div>

      <div className="mx-3 h-5 w-px bg-edge-subtle" />

      <nav className="flex items-center gap-1 no-drag">
        {[
          { id: 'import' as const, label: 'Import' },
          { id: 'project' as const, label: 'Project' },
          { id: 'jobs' as const, label: 'Jobs' }
        ].map((tab) => (
          <Button
            key={tab.id}
            variant="ghost"
            size="sm"
            active={screen === tab.id}
            onClick={() => setScreen(tab.id)}
          >
            {tab.label}
          </Button>
        ))}
      </nav>

      <div className="flex-1" />

      <div className="flex items-center gap-1.5 no-drag">
        <Tooltip content="Komut paleti (⌘K)">
          <Button variant="ghost" size="sm" leading={<Command className="h-3.5 w-3.5" />} onClick={onCommandPalette}>
            <span className="font-mono text-2xs">⌘K</span>
          </Button>
        </Tooltip>
        <Button variant="secondary" size="sm" leading={<Upload className="h-3.5 w-3.5" />} onClick={handleImport}>
          Import
        </Button>
        <Button
          variant="primary"
          size="sm"
          leading={<Play className="h-3.5 w-3.5" />}
          disabled={!canExport}
          onClick={() => void startExport()}
        >
          Export
        </Button>
        <Tooltip content="Ayarlar">
          <Button variant="ghost" size="icon" onClick={() => setScreen('settings')}>
            <SettingsIcon className="h-4 w-4" />
          </Button>
        </Tooltip>
      </div>
    </header>
  )
}
