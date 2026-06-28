import { useEffect, useRef, useState } from 'react'
import { Eye, Loader2, Sparkles } from 'lucide-react'
import { useAppStore } from '../../state/store'
import { useEffectiveSettings } from '../../state/hooks'
import { StatsCard } from './StatsCard'

const DEBOUNCE_MS = 700

export function PreviewPanel() {
  const files = useAppStore((s) => s.files)
  const selectedId = useAppStore((s) => s.selectedFileId)
  const preview = useAppStore((s) => s.preview)
  const startPreview = useAppStore((s) => s.startPreview)
  const cli = useAppStore((s) => s.cli)
  const settings = useEffectiveSettings()
  const [auto, setAuto] = useState(true)
  const target = files.find((f) => f.id === selectedId) ?? files[0]
  const timer = useRef<number | null>(null)

  // Hash of inputs that should trigger a re-run.
  const watchKey = JSON.stringify({
    file: target?.path ?? null,
    t: settings.thresholdAudio,
    m: settings.margin,
    s: settings.smoothEnabled ? `${settings.smoothMincut},${settings.smoothMinclip}` : 'off'
  })

  useEffect(() => {
    if (!auto || !target || !cli.found) return
    if (timer.current) window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => {
      void startPreview(target.path)
    }, DEBOUNCE_MS)
    return () => {
      if (timer.current) window.clearTimeout(timer.current)
    }
  }, [watchKey, auto, target, cli.found, startPreview])

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-zinc-100">Önizleme</h2>
          <p className="text-xs text-zinc-500">
            {auto ? 'Ayarlar değiştikçe otomatik güncellenir.' : 'Manuel modda — butona bas.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex cursor-pointer items-center gap-1.5 text-xs text-zinc-400">
            <input type="checkbox" checked={auto} onChange={(e) => setAuto(e.target.checked)} />
            <Sparkles className="h-3 w-3" /> oto
          </label>
          <button
            className="btn-outline"
            disabled={!target || preview.running || !cli.found}
            onClick={() => target && startPreview(target.path)}
          >
            {preview.running ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Hesaplanıyor…
              </>
            ) : (
              <>
                <Eye className="h-4 w-4" /> Önizle
              </>
            )}
          </button>
        </div>
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
            {target ? 'Slider\'ları kıvır — önizleme otomatik gelir.' : 'Bir dosya ekle.'}
          </div>
        )}
      </div>
    </div>
  )
}
