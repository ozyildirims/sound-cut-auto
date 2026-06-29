import { useEffect, useMemo, useRef, useState } from 'react'
import { Loader2, Wand2 } from 'lucide-react'
import { ipc } from '../../ipc/client'
import { useAppStore } from '../../state/store'
import { useEffectiveSettings } from '../../state/hooks'

interface LevelsData {
  values: number[]
  suggestedThreshold: number
}

interface Props {
  duration?: number
  currentTime?: number
  onSeek?: (timeSeconds: number) => void
}

export function Waveform({ duration = 0, currentTime = 0, onSeek }: Props) {
  const targetPath = useAppStore((s) => {
    const id = s.selectedFileId
    return s.files.find((f) => f.id === id)?.path ?? s.files[0]?.path ?? null
  })
  const settings = useEffectiveSettings()
  const patch = useAppStore((s) => s.patchEffective)
  const cli = useAppStore((s) => s.cli)
  const containerRef = useRef<HTMLDivElement>(null)

  const [data, setData] = useState<LevelsData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [scrubbing, setScrubbing] = useState(false)

  useEffect(() => {
    if (!targetPath || !cli.found) {
      setData(null)
      return
    }
    let cancelled = false
    setLoading(true)
    setError(null)
    setData(null)
    ipc.media
      .levels(targetPath)
      .then((d) => {
        if (cancelled) return
        setData({ values: d.values, suggestedThreshold: d.suggestedThreshold })
      })
      .catch((err) => {
        if (cancelled) return
        setError(err instanceof Error ? err.message : String(err))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [targetPath, cli.found])

  const max = useMemo(() => (data ? Math.max(0.001, ...data.values) : 1), [data])
  const playheadRatio = duration > 0 ? Math.min(1, Math.max(0, currentTime / duration)) : 0

  const seekFromEvent = (clientX: number) => {
    if (!onSeek || duration <= 0) return
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    const ratio = (clientX - rect.left) / rect.width
    onSeek(Math.max(0, Math.min(1, ratio)) * duration)
  }

  if (!targetPath) return null

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-zinc-100">Ses dalgası</h3>
          <p className="text-xs text-zinc-500">
            Kırmızı çizgi threshold, mor çizgi şu anki konum. Dalgaya tıkla → video oraya gider.
          </p>
        </div>
        {data && (
          <button
            className="btn-outline"
            onClick={() => patch({ thresholdAudio: data.suggestedThreshold })}
            title="Önerilen threshold'u uygula"
          >
            <Wand2 className="h-4 w-4" /> Önerilen: %{Math.round(data.suggestedThreshold * 500)}
          </button>
        )}
      </div>

      <div
        ref={containerRef}
        className={`relative mt-3 h-32 w-full overflow-hidden rounded-md bg-bg-elev p-1 ${onSeek && data ? 'cursor-crosshair' : ''}`}
        onMouseDown={(e) => {
          if (!onSeek || !data) return
          setScrubbing(true)
          seekFromEvent(e.clientX)
        }}
        onMouseMove={(e) => {
          if (!scrubbing) return
          seekFromEvent(e.clientX)
        }}
        onMouseUp={() => setScrubbing(false)}
        onMouseLeave={() => setScrubbing(false)}
      >
        {loading ? (
          <div className="flex h-full items-center justify-center text-xs text-zinc-500">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Ses analizi…
          </div>
        ) : error ? (
          <div className="flex h-full items-center justify-center text-xs text-rose-300">
            {error}
          </div>
        ) : data && data.values.length ? (
          <>
            <svg
              viewBox={`0 0 ${data.values.length} 100`}
              preserveAspectRatio="none"
              className="h-full w-full"
            >
              <defs>
                <linearGradient id="wf" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#9d82ff" />
                  <stop offset="100%" stopColor="#5a3dff" />
                </linearGradient>
              </defs>
              <rect
                x="0"
                y={100 - (settings.thresholdAudio / max) * 100}
                width={data.values.length}
                height={(settings.thresholdAudio / max) * 100}
                fill="rgba(244, 63, 94, 0.10)"
              />
              <g fill="url(#wf)">
                {data.values.map((v, i) => {
                  const h = Math.max(0.5, (v / max) * 100)
                  return <rect key={i} x={i} y={100 - h} width="0.9" height={h} />
                })}
              </g>
              <line
                x1="0"
                x2={data.values.length}
                y1={100 - (settings.thresholdAudio / max) * 100}
                y2={100 - (settings.thresholdAudio / max) * 100}
                stroke="#f43f5e"
                strokeWidth="0.6"
                strokeDasharray="2 2"
              />
            </svg>
            {duration > 0 && (
              <div
                className="pointer-events-none absolute top-0 h-full w-px bg-accent shadow-[0_0_0_1px_rgba(124,92,255,0.5)]"
                style={{ left: `${playheadRatio * 100}%` }}
              />
            )}
          </>
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-zinc-500">
            Veri yok
          </div>
        )}
      </div>
    </div>
  )
}
