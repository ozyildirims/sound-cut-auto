import { Command, Moon, Play, Settings as SettingsIcon, Sun, Upload } from 'lucide-react'
import { Button, Tooltip } from '../ui'
import { ipc } from '../../ipc/client'
import { useAppStore } from '../../state/store'
import { useTheme } from '../../theme/ThemeProvider'

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
  const { theme, toggle } = useTheme()

  const canExport = files.length > 0 && cli.found

  async function handleImport() {
    const paths = await ipc.dialog.openFiles()
    if (paths.length) addFiles(paths)
  }

  return (
    <header
      className={`drag-region surface-glass relative flex h-12 items-center gap-2 px-3 ${
        isMac ? 'pl-20' : 'pl-3'
      }`}
    >
      <div className="flex items-center gap-2.5 no-drag">
        <BrandMark />
        <span className="text-md font-semibold tracking-tight text-text-primary text-display-tight">
          Sound Cut Auto
        </span>
      </div>

      <div className="mx-3 h-5 w-px bg-edge-subtle" />

      <nav className="flex items-center gap-0.5 no-drag">
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
        <Tooltip content={theme === 'dark' ? 'Aydınlık tema' : 'Karanlık tema'}>
          <Button variant="ghost" size="icon" onClick={toggle} aria-label="Tema değiştir">
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </Tooltip>
        <Tooltip content="Ayarlar">
          <Button variant="ghost" size="icon" onClick={() => setScreen('settings')}>
            <SettingsIcon className="h-4 w-4" />
          </Button>
        </Tooltip>
      </div>
    </header>
  )
}

// "The Cut" — asymmetric sound wave with a diagonal cut line through it.
// Reads at 24px, conceptually unique to this product.
function BrandMark() {
  return (
    <div
      className="relative h-7 w-7 overflow-hidden rounded-[8px]
                 bg-gradient-to-br from-[rgb(8_27_45)] to-[rgb(11_38_62)]
                 shadow-[inset_0_0_0_1px_rgb(6_182_212_/_0.32),0_0_18px_-4px_rgb(6_182_212_/_0.45)]"
    >
      <svg viewBox="0 0 28 28" className="absolute inset-0">
        <path
          d="M 4 14 Q 7 8, 10 14 T 14 14 Q 17 18, 20 14 T 24 14"
          stroke="rgb(34 211 238)"
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
          strokeOpacity="0.95"
        />
        <line
          x1="14.5" y1="5" x2="13.5" y2="23"
          stroke="rgb(34 211 238)"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeDasharray="2 2"
          strokeOpacity="0.75"
        />
      </svg>
    </div>
  )
}
