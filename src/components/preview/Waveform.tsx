import { useEffect, useMemo, useRef, useState } from 'react'
import { Loader2, Wand2 } from 'lucide-react'
import { ipc } from '../../ipc/client'
import { useAppStore } from '../../state/store'
import { useEffectiveSettings } from '../../state/hooks'
import { formatSeconds } from '../../lib/format'

interface LevelsData {
  values: number[]
  suggestedThreshold: number
}

interface Props {
  duration?: number
  currentTime?: number
  onSeek?: (timeSeconds: number) => void
}

interface RippleSpec { x: number; key: number }

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
  const [hoverRatio, setHoverRatio] = useState<number | null>(null)
  const [ripple, setRipple] = useState<RippleSpec | null>(null)
  const rippleKey = useRef(0)

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
  const hoverTime = hoverRatio != null && duration > 0 ? hoverRatio * duration : null

  const ratioFromEvent = (clientX: number): number | null => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return null
    const ratio = (clientX - rect.left) / rect.width
    return Math.max(0, Math.min(1, ratio))
  }

  const seekFromEvent = (clientX: number) => {
    if (!onSeek || duration <= 0) return
    const ratio = ratioFromEvent(clientX)
    if (ratio == null) return
    onSeek(ratio * duration)
  }

  const fireRipple = (clientX: number) => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect || !data) return
    const x = ((clientX - rect.left) / rect.width) * data.values.length
    rippleKey.current += 1
    setRipple({ x, key: rippleKey.current })
  }

  if (!targetPath) return null

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-md font-semibold tracking-tight text-text-primary text-display">Ses dalgası</h3>
          <p className="text-xs text-text-muted">
            Pembe çizgi threshold, cyan playhead anlık konum. Tıkla → video oraya gider.
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
        className="relative mt-3 h-32 w-full overflow-hidden rounded-md bg-bg-elev p-1"
        style={onSeek && data ? { cursor: 'crosshair' } : undefined}
        onMouseDown={(e) => {
          if (!onSeek || !data) return
          setScrubbing(true)
          seekFromEvent(e.clientX)
          fireRipple(e.clientX)
        }}
        onMouseMove={(e) => {
          if (data && containerRef.current) {
            setHoverRatio(ratioFromEvent(e.clientX))
          }
          if (scrubbing) seekFromEvent(e.clientX)
        }}
        onMouseUp={() => setScrubbing(false)}
        onMouseLeave={() => {
          setScrubbing(false)
          setHoverRatio(null)
        }}
      >
        {loading ? (
          <div className="flex h-full items-center justify-center text-xs text-text-muted">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Ses analizi…
          </div>
        ) : error ? (
          <div className="flex h-full items-center justify-center text-xs text-critical">
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
                <linearGradient id="wf-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgb(34 211 238)" stopOpacity="0.95" />
                  <stop offset="60%" stopColor="rgb(var(--accent))" stopOpacity="0.85" />
                  <stop offset="100%" stopColor="rgb(var(--accent-muted))" stopOpacity="0.55" />
                </linearGradient>
                <linearGradient id="wf-scan" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgb(255 255 255)" stopOpacity="0.04" />
                  <stop offset="50%" stopColor="rgb(255 255 255)" stopOpacity="0" />
                  <stop offset="100%" stopColor="rgb(255 255 255)" stopOpacity="0.02" />
                </linearGradient>
                <filter id="ph-glow">
                  <feGaussianBlur stdDeviation="0.6" />
                </filter>
              </defs>

              {/* Silent band (under threshold) */}
              <rect
                x="0"
                y={100 - (settings.thresholdAudio / max) * 100}
                width={data.values.length}
                height={(settings.thresholdAudio / max) * 100}
                fill="rgb(244 63 94)"
                fillOpacity="0.06"
              />
              <line
                x1="0"
                x2={data.values.length}
                y1={100 - (settings.thresholdAudio / max) * 100}
                y2={100 - (settings.thresholdAudio / max) * 100}
                stroke="rgb(244 63 94)"
                strokeWidth="0.4"
                strokeDasharray="2 3"
                strokeOpacity="0.55"
              />

              {/* Waveform bars — rounded tops */}
              <g fill="url(#wf-fill)">
                {data.values.map((v, i) => {
                  const h = Math.max(0.6, (v / max) * 100)
                  return <rect key={i} x={i + 0.05} y={100 - h} width="0.9" height={h} rx="0.35" />
                })}
              </g>

              {/* Scanline overlay */}
              <rect x="0" y="0" width={data.values.length} height="100" fill="url(#wf-scan)" />

              {/* Hover caret (only when not scrubbing) */}
              {hoverRatio != null && !scrubbing && (
                <g transform={`translate(${hoverRatio * data.values.length}, 0)`}>
                  <line
                    x1="0" x2="0" y1="0" y2="100"
                    stroke="rgb(34 211 238)"
                    strokeWidth="0.45"
                    strokeOpacity="0.55"
                    strokeDasharray="1.5 1.5"
                  />
                </g>
              )}

              {/* Ripple */}
              {ripple && (
                <circle
                  key={ripple.key}
                  cx={ripple.x}
                  cy="50"
                  r="2"
                  fill="none"
                  stroke="rgb(34 211 238)"
                  strokeWidth="0.8"
                  style={{ animation: 'scope-ping 600ms ease-out forwards', transformOrigin: 'center' }}
                />
              )}

              {/* Playhead */}
              {duration > 0 && (
                <g transform={`translate(${playheadRatio * data.values.length}, 0)`}>
                  <line
                    x1="0" x2="0" y1="0" y2="100"
                    stroke="rgb(34 211 238)"
                    strokeWidth="0.8"
                    filter="url(#ph-glow)"
                  />
                  <line
                    x1="0" x2="0" y1="0" y2="100"
                    stroke="rgb(34 211 238)"
                    strokeWidth="0.35"
                  />
                  <circle cx="0" cy="2.5" r="1.8" fill="rgb(34 211 238)" filter="url(#ph-glow)" />
                  <circle cx="0" cy="2.5" r="0.9" fill="rgb(255 255 255)" />
                </g>
              )}
            </svg>

            {/* Hover time chip — HTML overlay for crisp text */}
            {hoverTime != null && (
              <div
                className="pointer-events-none absolute top-0 -translate-x-1/2 -translate-y-[calc(100%+6px)] z-10
                           rounded-md px-2 py-1 font-mono text-[10px] text-text-primary
                           shadow-[0_4px_12px_rgb(0_0_0_/_0.3),0_0_0_1px_rgb(var(--accent)_/_0.4)]
                           bg-bg-elev/95 backdrop-blur"
                style={{ left: `${(hoverRatio ?? 0) * 100}%` }}
              >
                {formatSeconds(hoverTime)}
              </div>
            )}
          </>
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-text-muted">
            Veri yok
          </div>
        )}
      </div>
    </div>
  )
}
