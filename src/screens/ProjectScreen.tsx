import { ArrowLeft, Play, Terminal } from 'lucide-react'
import { FileQueue } from '../components/import/FileQueue'
import { SettingsPanel } from '../components/settings/SettingsPanel'
import { PreviewPanel } from '../components/preview/PreviewPanel'
import { previewArgs } from '../lib/argsPreview'
import { useAppStore } from '../state/store'

export function ProjectScreen() {
  const files = useAppStore((s) => s.files)
  const settings = useAppStore((s) => s.settings)
  const setScreen = useAppStore((s) => s.setScreen)
  const startExport = useAppStore((s) => s.startExport)
  const cli = useAppStore((s) => s.cli)
  const patchSettings = useAppStore((s) => s.patchSettings)

  const cmd = previewArgs({
    filePath: files[0]?.path ?? null,
    settings,
    mode: 'export',
    outputPath: null
  })

  return (
    <div className="grid h-full grid-cols-[minmax(260px,320px)_1fr]">
      <aside className="flex flex-col gap-4 border-r border-edge p-5">
        <div className="flex items-center justify-between">
          <button
            className="btn-ghost text-zinc-400"
            onClick={() => setScreen('import')}
          >
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
              Ayarlar tüm kuyruğa uygulanır. Export bittiğinde dosyalar Jobs ekranında listelenir.
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
                checked={settings.devShowCommand}
                onChange={(e) => patchSettings({ devShowCommand: e.target.checked })}
              />
              dev mode
            </label>
          </div>
          {settings.devShowCommand && (
            <pre className="overflow-x-auto rounded-md bg-bg-elev p-3 text-xs text-zinc-300">
              {cmd}
            </pre>
          )}
        </div>
      </section>
    </div>
  )
}
