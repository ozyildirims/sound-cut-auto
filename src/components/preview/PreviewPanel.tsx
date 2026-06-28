import { Eye, Loader2 } from 'lucide-react'
import { useAppStore } from '../../state/store'
import { StatsCard } from './StatsCard'

export function PreviewPanel() {
  const files = useAppStore((s) => s.files)
  const preview = useAppStore((s) => s.preview)
  const startPreview = useAppStore((s) => s.startPreview)
  const cli = useAppStore((s) => s.cli)
  const firstFile = files[0]

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-zinc-100">Önizleme</h2>
          <p className="text-xs text-zinc-500">
            Export yapmadan, geçerli ayarlarla ne kesileceğini gör.
          </p>
        </div>
        <button
          className="btn-outline"
          disabled={!firstFile || preview.running || !cli.found}
          onClick={() => firstFile && startPreview(firstFile.path)}
        >
          {preview.running ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Hesaplanıyor…
            </>
          ) : (
            <>
              <Eye className="h-4 w-4" /> Önizleme çalıştır
            </>
          )}
        </button>
      </div>

      <div className="mt-4 space-y-3">
        {preview.error && (
          <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 p-3 text-sm text-rose-200">
            {preview.error}
          </div>
        )}
        {preview.stats ? (
          <>
            <StatsCard stats={preview.stats} />
            <details className="text-xs text-zinc-500">
              <summary className="cursor-pointer text-zinc-400">Ham çıktı</summary>
              <pre className="mt-2 max-h-40 overflow-auto rounded-md bg-bg-elev p-3 text-zinc-400">
                {preview.stats.raw.join('\n')}
              </pre>
            </details>
          </>
        ) : preview.running ? (
          <div className="rounded-lg border border-dashed border-edge p-6 text-center text-sm text-zinc-500">
            Analiz devam ediyor…
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-edge p-6 text-center text-sm text-zinc-500">
            Henüz önizleme yok. İlk dosyanı analiz etmek için butona bas.
          </div>
        )}
      </div>
    </div>
  )
}
