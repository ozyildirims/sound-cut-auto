import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { AlertTriangle, Maximize2, Pause, Play, Volume2, VolumeX } from 'lucide-react'
import { toLocalMediaUrl } from '../../lib/mediaUrl'
import { formatSeconds } from '../../lib/format'

export interface VideoPlayerHandle {
  seek: (timeSeconds: number) => void
  pause: () => void
}

interface Props {
  filePath: string | null
  onTimeUpdate?: (time: number) => void
  onDurationChange?: (duration: number) => void
  onPlayingChange?: (playing: boolean) => void
}

export const VideoPlayer = forwardRef<VideoPlayerHandle, Props>(function VideoPlayer(
  { filePath, onTimeUpdate, onDurationChange, onPlayingChange },
  ref
) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(false)
  const [duration, setDuration] = useState(0)
  const [time, setTime] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const src = filePath ? toLocalMediaUrl(filePath) : null

  useImperativeHandle(
    ref,
    () => ({
      seek: (t: number) => {
        const v = videoRef.current
        if (!v) return
        v.currentTime = Math.max(0, Math.min(duration || t, t))
      },
      pause: () => {
        videoRef.current?.pause()
      }
    }),
    [duration]
  )

  // Reset playback state when the source changes so a stale playing=true
  // doesn't carry over and break the play/pause toggle.
  useEffect(() => {
    setPlaying(false)
    setTime(0)
    setDuration(0)
    setError(null)
  }, [filePath])

  const toggle = () => {
    const v = videoRef.current
    if (!v) return
    if (v.paused) void v.play().catch((err) => setError(String(err)))
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
        <video
          ref={videoRef}
          src={src}
          className="h-full w-full bg-black"
          preload="metadata"
          muted={muted}
          onLoadedMetadata={(e) => {
            const d = e.currentTarget.duration
            if (Number.isFinite(d) && d > 0) {
              setDuration(d)
              onDurationChange?.(d)
            }
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
          onError={() => {
            setError('Tarayıcı bu kodek/dosyayı oynatamıyor (HEVC mac/win\'de native, Linux\'ta yok). Yine de cut/preview çalışır.')
          }}
        />
        {error && (
          <div className="absolute inset-x-0 bottom-0 flex items-center gap-2 bg-rose-950/80 px-3 py-2 text-xs text-rose-100 backdrop-blur">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>
      <div className="flex items-center gap-3 border-t border-edge bg-bg-surface px-3 py-2 text-xs text-zinc-300">
        <button
          className="btn-ghost h-7 w-7 !p-0 text-zinc-200"
          onClick={toggle}
          title={playing ? 'Duraklat (Space)' : 'Oynat (Space)'}
        >
          {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </button>
        <span className="font-mono tabular-nums">{formatSeconds(time)}</span>
        <div className="flex-1" />
        <span className="font-mono tabular-nums text-zinc-500">{formatSeconds(duration)}</span>
        <button
          className="btn-ghost h-7 w-7 !p-0 text-zinc-400"
          onClick={() => setMuted((m) => !m)}
          title={muted ? 'Sesi aç' : 'Sustur'}
        >
          {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </button>
        <button
          className="btn-ghost h-7 w-7 !p-0 text-zinc-400"
          onClick={() => videoRef.current?.requestFullscreen?.()}
          title="Tam ekran"
        >
          <Maximize2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
})
