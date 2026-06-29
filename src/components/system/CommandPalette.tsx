import * as Dialog from '@radix-ui/react-dialog'
import { Command } from 'cmdk'
import {
  FolderOpen,
  ListChecks,
  Play,
  Scissors,
  Settings as SettingsIcon,
  Sparkles,
  Upload
} from 'lucide-react'
import { useEffect } from 'react'
import { ipc } from '../../ipc/client'
import { PRESETS } from '@shared/types'
import { useAppStore, type Screen } from '../../state/store'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CommandPalette({ open, onOpenChange }: Props) {
  const setScreen = useAppStore((s) => s.setScreen)
  const addFiles = useAppStore((s) => s.addFiles)
  const startExport = useAppStore((s) => s.startExport)
  const patchSettings = useAppStore((s) => s.patchSettings)
  const startPreview = useAppStore((s) => s.startPreview)
  const files = useAppStore((s) => s.files)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        onOpenChange(!open)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onOpenChange])

  function run(fn: () => void | Promise<void>) {
    onOpenChange(false)
    setTimeout(() => void fn(), 0)
  }

  async function handleImport() {
    const paths = await ipc.dialog.openFiles()
    if (paths.length) addFiles(paths)
  }

  function go(screen: Screen) {
    setScreen(screen)
  }

  function runPreview() {
    if (files[0]) startPreview(files[0].path)
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm animate-in fade-in-0" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed left-1/2 top-1/4 z-50 w-[min(600px,90vw)] -translate-x-1/2 rounded-xl border border-edge bg-bg-elev shadow-float animate-in fade-in-0 zoom-in-95"
        >
          <Dialog.Title className="sr-only">Komut paleti</Dialog.Title>
          <Command className="flex flex-col" loop>
            <div className="flex items-center gap-3 border-b border-edge-subtle px-4">
              <Sparkles className="h-4 w-4 text-text-muted" />
              <Command.Input
                placeholder="Komut ara veya bir şey yap…"
                className="h-12 flex-1 bg-transparent text-md text-text-primary placeholder:text-text-muted focus:outline-none"
              />
              <kbd className="rounded border border-edge bg-bg-base px-1.5 py-0.5 font-mono text-2xs text-text-muted">
                esc
              </kbd>
            </div>

            <Command.List className="max-h-[60vh] overflow-y-auto p-2">
              <Command.Empty className="px-3 py-4 text-center text-sm text-text-muted">
                Eşleşme yok.
              </Command.Empty>

              <Command.Group heading="Genel" className="text-micro [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pt-1.5 [&_[cmdk-group-heading]]:pb-1">
                <PaletteItem onSelect={() => run(handleImport)} icon={<Upload className="h-4 w-4" />} label="Dosya aç" shortcut="⌘O" />
                <PaletteItem onSelect={() => run(runPreview)} icon={<Sparkles className="h-4 w-4" />} label="Önizleme çalıştır" shortcut="⌘P" />
                <PaletteItem onSelect={() => run(startExport)} icon={<Play className="h-4 w-4" />} label="Export" shortcut="⌘E" />
              </Command.Group>

              <Command.Group heading="Git" className="text-micro [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pt-2.5 [&_[cmdk-group-heading]]:pb-1">
                <PaletteItem onSelect={() => run(() => go('import'))} icon={<FolderOpen className="h-4 w-4" />} label="Import" shortcut="⌘1" />
                <PaletteItem onSelect={() => run(() => go('project'))} icon={<Scissors className="h-4 w-4" />} label="Project" shortcut="⌘2" />
                <PaletteItem onSelect={() => run(() => go('jobs'))} icon={<ListChecks className="h-4 w-4" />} label="Jobs" shortcut="⌘3" />
                <PaletteItem onSelect={() => run(() => go('settings'))} icon={<SettingsIcon className="h-4 w-4" />} label="Settings" shortcut="⌘4" />
              </Command.Group>

              <Command.Group heading="Cut profili" className="text-micro [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pt-2.5 [&_[cmdk-group-heading]]:pb-1">
                {PRESETS.map((p) => (
                  <PaletteItem
                    key={p.id}
                    onSelect={() => run(() => patchSettings(p.settings))}
                    icon={<Sparkles className="h-4 w-4" />}
                    label={p.label}
                    description={p.description}
                  />
                ))}
              </Command.Group>
            </Command.List>
          </Command>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

function PaletteItem({
  onSelect,
  icon,
  label,
  description,
  shortcut
}: {
  onSelect: () => void
  icon: React.ReactNode
  label: string
  description?: string
  shortcut?: string
}) {
  return (
    <Command.Item
      onSelect={onSelect}
      className="flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-sm text-text-primary data-[selected=true]:bg-accent/15 data-[selected=true]:text-accent"
    >
      <span className="text-text-muted">{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="truncate">{label}</div>
        {description && <div className="truncate text-2xs text-text-muted">{description}</div>}
      </div>
      {shortcut && (
        <kbd className="rounded border border-edge bg-bg-base px-1.5 py-0.5 font-mono text-2xs text-text-muted">
          {shortcut}
        </kbd>
      )}
    </Command.Item>
  )
}
