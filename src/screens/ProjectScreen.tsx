import { ArrowLeft, Play, Terminal } from 'lucide-react'
import { FileQueue } from '../components/import/FileQueue'
import { SettingsPanel } from '../components/settings/SettingsPanel'
import { PresetBar } from '../components/settings/PresetBar'
import { PerFileHeader } from '../components/settings/PerFileHeader'
import { PreviewPanel } from '../components/preview/PreviewPanel'
import { MediaPanel } from '../components/preview/MediaPanel'
import { previewArgs } from '../lib/argsPreview'
import { useAppStore } from '../state/store'
import { useEffectiveSettings } from '../state/hooks'

export function ProjectScreen() {
  const files = useAppStore((s) => s.files)
  const selectedId = useAppStore((s) => s.selectedFileId)
  const selected = files.find((f) => f.id === selectedId) ?? files[0]
  const settings = useEffectiveSettings()
  const setScreen = useAppStore((s) => s.setScreen)
  const startExport = useAppStore((s) => s.startExport)
  const cli = useAppStore((s) => s.cli)
  const patchSettings = useAppStore((s) => s.patchSettings)
  const globalSettings = useAppStore((s) => s.settings)

  const cmd = previewArgs({
    filePath: selected?.path ?? null,
    settings,
    mode: 'export',
    outputPath: null
  })

  return (
    <div className="grid h-full grid-cols-[minmax(280px,340px)_1fr]">
      <aside className="flex flex-col gap-4 border-r border-edge p-4">
        <div className="flex items-center justify-between">
          <button className="btn-ghost text-zinc-400" onClick={() => setScreen('import')}>
            <ArrowLeft className="h-4 w-4" /> Import
          </button>
          <span className="text-xs text-zinc-500">{files.length} dosya</span>
        </div>
        <FileQueue />
      </aside>

      <section className="space-y-5 overflow-auto p-6">
        <header className="flex items-end justify-between">
          <div>
            <h1 className="text-xl font-semibold text-zinc-100">Project</h1>
            <p className="text-sm text-zinc-400">
              Bir hazır profil seç, ya da slider'larla ince ayar yap. Sol kuyruktan farklı bir
              dosyaya tıklarsan ayarlar o dosya için ayrılır.
            </p>
          </div>
          <button
            className="btn-primary"
            disabled={!files.length || !cli.found}
            onClick={() => void startExport()}
          >
            <Play className="h-4 w-4" /> Export
          </button>
        </header>

        <PresetBar />
        <PerFileHeader />
        <MediaPanel />
        <SettingsPanel />
        <PreviewPanel />

        <div className="card p-4">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <Terminal className="h-3.5 w-3.5" /> Command preview
            </div>
            <label className="flex items-center gap-2 text-xs text-zinc-500">
              <input
                type="checkbox"
                checked={globalSettings.devShowCommand}
                onChange={(e) => patchSettings({ devShowCommand: e.target.checked })}
              />
              dev mode
            </label>
          </div>
          {globalSettings.devShowCommand && (
            <pre className="overflow-x-auto rounded-md bg-bg-elev p-3 text-xs text-zinc-300">
              {cmd}
            </pre>
          )}
        </div>
      </section>
    </div>
  )
}
