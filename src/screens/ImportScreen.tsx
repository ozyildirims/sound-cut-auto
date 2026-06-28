import { ArrowRight, Clock, FileVideo, Trash2 } from 'lucide-react'
import { DropZone } from '../components/import/DropZone'
import { FileQueue } from '../components/import/FileQueue'
import { useAppStore } from '../state/store'

export function ImportScreen() {
  const files = useAppStore((s) => s.files)
  const setScreen = useAppStore((s) => s.setScreen)
  const clearFiles = useAppStore((s) => s.clearFiles)
  const recent = useAppStore((s) => s.recentFiles)
  const addFiles = useAppStore((s) => s.addFiles)
  const clearRecent = useAppStore((s) => s.clearRecent)

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 p-8">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-100">Dosyaları içe aktar</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Sessizlikleri otomatik kes. Her şey yerel makinende çalışır — bulut yok.
          </p>
        </div>
        {files.length > 0 && (
          <button className="btn-ghost text-zinc-400" onClick={clearFiles}>
            Hepsini temizle
          </button>
        )}
      </header>

      <DropZone />
      <FileQueue />

      {recent.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm text-zinc-300">
              <Clock className="h-4 w-4" /> Son açılanlar
            </h2>
            <button className="btn-ghost text-zinc-500" onClick={() => void clearRecent()} title="Listeyi temizle">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {recent.slice(0, 6).map((p) => {
              const name = p.split(/[/\\]/).pop() || p
              const dir = p.slice(0, p.length - name.length - 1)
              return (
                <button
                  key={p}
                  onClick={() => addFiles([p])}
                  className="card flex min-w-0 items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-white/[0.03]"
                >
                  <FileVideo className="h-4 w-4 flex-shrink-0 text-zinc-500" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm text-zinc-100">{name}</div>
                    <div className="truncate text-[11px] text-zinc-500">{dir}</div>
                  </div>
                </button>
              )
            })}
          </div>
        </section>
      )}

      {files.length > 0 && (
        <div className="flex justify-end">
          <button className="btn-primary" onClick={() => setScreen('project')}>
            Devam et <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  )
}
