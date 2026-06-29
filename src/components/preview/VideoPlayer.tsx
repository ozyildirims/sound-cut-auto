import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { AlertTriangle, FileImage, Maximize2, Pause, Play, Volume2, VolumeX } from 'lucide-react'
import { toLocalMediaUrl } from '../../lib/mediaUrl'
import { ipc } from '../../ipc/client'
import { formatSeconds } from '../../lib/format'

export interface VideoPlayerHandle {
  seek: (timeSeconds: number) => void
  pause: () => void
}

interface Props {
  filePath: string | null
  duration: number
  /** When the codec doesn't play, the parent drives currentTime via scrub. */
  externalTime?: number
  onTimeUpdate?: (time: number) => void
  onDurationChange?: (duration: number) => void
  onPlayingChange?: (playing: boolean) => void
}

export const VideoPlayer = forwardRef<VideoPlayerHandle, Props>(function VideoPlayer(
  { filePath, duration, externalTime, onTimeUpdate, onDurationChange, onPlayingChange },
  ref
) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(false)
  const [time, setTime] = useState(0)
  const [fallback, setFallback] = useState(false)
  const [frameUrl, setFrameUrl] = useState<string | null>(null)
  const [frameLoading, setFrameLoading] = useState(false)
  const lastFrameKey = useRef<string>('')

  const src = filePath ? toLocalMediaUrl(filePath) : null

  useImperativeHandle(
    ref,
    () => ({
      seek: (t: number) => {
        const v = videoRef.current
        if (v && !fallback) {
          v.currentTime = Math.max(0, Math.min(duration || t, t))
        }
        setTime(t)
      },
      pause: () => videoRef.current?.pause()
    }),
    [duration, fallback]
  )

  // Reset when source changes
  useEffect(() => {
    setPlaying(false)
    setTime(0)
    setFallback(false)
    setFrameUrl(null)
    lastFrameKey.current = ''
  }, [filePath])

  // Fallback mode: re-extract a frame whenever the external time changes,
  // debounced so dragging across the waveform doesn't queue 50 ffmpegs.
  useEffect(() => {
    if (!fallback || !filePath) return
    const t = externalTime ?? time
    const key = `${filePath}@${t.toFixed(1)}`
    if (key === lastFrameKey.current) return
    lastFrameKey.current = key
    const handle = window.setTimeout(() => {
      setFrameLoading(true)
      ipc.media
        .frame(filePath, t, 720)
        .then((url) => setFrameUrl(url))
        .catch(() => {})
        .finally(() => setFrameLoading(false))
    }, 80)
    return () => window.clearTimeout(handle)
  }, [fallback, filePath, externalTime, time])

  const toggle = () => {
    if (fallback) return
    const v = videoRef.current
    if (!v) return
    if (v.paused) void v.play().catch(() => setFallback(true))
    else v.pause()
  }

  if (!filePath || !src) {
    return (
      <div className="flex h-56 items-center justify-center rounded-xl border border-dashed border-edge text-sm text-zinc-500">
        Bir dosya seç → burada oynat.
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-edge bg-black">
      <div className="relative aspect-video w-full">
        {!fallback ? (
          <video
            ref={videoRef}
            src={src}
            className="h-full w-full bg-black"
            preload="metadata"
            muted={muted}
            onLoadedMetadata={(e) => {
              const d = e.currentTarget.duration
              if (Number.isFinite(d) && d > 0) onDurationChange?.(d)
            }}
            onTimeUpdate={(e) => {
              const t = e.currentTarget.currentTime
              setTime(t)
              onTimeUpdate?.(t)
            }}
            onPlay={() => {
              setPlaying(true)
              onPlayingChange?.(true)
            }}
            onPause={() => {
              setPlaying(false)
              onPlayingChange?.(false)
            }}
            onError={() => setFallback(true)}
          />
        ) : (
          <div className="relative flex h-full w-full items-center justify-center">
            {frameUrl ? (
              <img src={frameUrl} alt="frame" className="h-full w-full object-contain" />
            ) : (
              <div className="flex flex-col items-center gap-2 text-zinc-500">
                <FileImage className="h-8 w-8" />
                <span className="text-xs">Frame yükleniyor…</span>
              </div>
            )}
            {frameLoading && (
              <div className="absolute right-2 top-2 rounded bg-black/60 px-2 py-0.5 text-[10px] text-zinc-300">
                yükleniyor
              </div>
            )}
          </div>
        )}
        {fallback && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center gap-2 bg-amber-950/80 px-3 py-2 text-xs text-amber-100 backdrop-blur">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            <span>
              Bu kodek tarayıcıda çalmıyor (genelde HEVC). Frame-by-frame moduna geçtim — dalga
              üzerinde sürükle, o ana ait kare gösterilir.
            </span>
          </div>
        )}
      </div>
      <div className="flex items-center gap-3 border-t border-edge bg-bg-surface px-3 py-2 text-xs text-zinc-300">
        <button
          className="btn-ghost h-7 w-7 !p-0 text-zinc-200 disabled:opacity-40"
          onClick={toggle}
          disabled={fallback}
          title={fallback ? 'Frame modunda oynatma yok' : playing ? 'Duraklat' : 'Oynat'}
        >
          {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </button>
        <span className="font-mono tabular-nums">
          {formatSeconds(externalTime ?? time)}
        </span>
        <div className="flex-1" />
        <span className="font-mono tabular-nums text-zinc-500">{formatSeconds(duration)}</span>
        <button
          className="btn-ghost h-7 w-7 !p-0 text-zinc-400 disabled:opacity-40"
          onClick={() => setMuted((m) => !m)}
          disabled={fallback}
          title={muted ? 'Sesi aç' : 'Sustur'}
        >
          {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </button>
        <button
          className="btn-ghost h-7 w-7 !p-0 text-zinc-400 disabled:opacity-40"
          onClick={() => videoRef.current?.requestFullscreen?.()}
          disabled={fallback}
          title="Tam ekran"
        >
          <Maximize2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
})
