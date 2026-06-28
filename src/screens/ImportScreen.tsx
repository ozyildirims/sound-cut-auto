import { ArrowRight } from 'lucide-react'
import { DropZone } from '../components/import/DropZone'
import { FileQueue } from '../components/import/FileQueue'
import { useAppStore } from '../state/store'

export function ImportScreen() {
  const files = useAppStore((s) => s.files)
  const setScreen = useAppStore((s) => s.setScreen)
  const clearFiles = useAppStore((s) => s.clearFiles)

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 p-8">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-100">Dosyaları içe aktar</h1>
          <p className="mt-1 text-sm text-zinc-400">
            auto-editor sessiz / gereksiz boşlukları otomatik keser. Buradaki tüm işlem yerel
            makinende çalışır.
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
