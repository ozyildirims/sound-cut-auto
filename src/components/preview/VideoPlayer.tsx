import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { FileImage, Info, Loader2, Maximize2, Pause, Play, Volume2, VolumeX, X } from 'lucide-react'
import { toLocalMediaUrl } from '../../lib/mediaUrl'
import { ipc } from '../../ipc/client'
import { formatSeconds } from '../../lib/format'

export interface VideoPlayerHandle {
  seek: (timeSeconds: number) => void
  pause: () => void
}

interface Props {
  filePath: string | null
  proxyPath?: string | null
  proxyState?: 'idle' | 'pending' | 'ready' | 'failed'
  duration: number
  externalTime?: number
  onTimeUpdate?: (time: number) => void
  onDurationChange?: (duration: number) => void
  onPlayingChange?: (playing: boolean) => void
}

// LRU cache for frame-by-frame fallback mode (HEVC unsupported codec)
const FRAME_CACHE = new Map<string, string>()
const FRAME_CACHE_LIMIT = 60

function cacheGet(key: string): string | undefined {
  const v = FRAME_CACHE.get(key)
  if (v !== undefined) {
    FRAME_CACHE.delete(key)
    FRAME_CACHE.set(key, v)
  }
  return v
}

function cacheSet(key: string, value: string): void {
  FRAME_CACHE.set(key, value)
  while (FRAME_CACHE.size > FRAME_CACHE_LIMIT) {
    const first = FRAME_CACHE.keys().next().value
    if (first === undefined) break
    FRAME_CACHE.delete(first)
  }
}

export const VideoPlayer = forwardRef<VideoPlayerHandle, Props>(function VideoPlayer(
  {
    filePath,
    proxyPath,
    proxyState = 'idle',
    duration,
    externalTime,
    onTimeUpdate,
    onDurationChange,
    onPlayingChange
  },
  ref
) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(false)
  const [time, setTime] = useState(0)
  const [fallback, setFallback] = useState(false)
  const [frameUrl, setFrameUrl] = useState<string | null>(null)
  const [frameLoading, setFrameLoading] = useState(false)
  const [bannerVisible, setBannerVisible] = useState(false)
  const lastFrameKey = useRef<string>('')
  const bannerTimer = useRef<number | null>(null)

  // Prefer the proxy (always h264 720p, always decodable). Only fall back
  // to the original file path if the proxy genuinely failed to build —
  // in that case onError will still flip frame mode.
  const playbackPath =
    proxyState === 'ready' && proxyPath
      ? proxyPath
      : proxyState === 'failed'
        ? filePath
        : null
  const src = playbackPath ? toLocalMediaUrl(playbackPath) : null

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

  useEffect(() => {
    setPlaying(false)
    setTime(0)
    setFallback(false)
    setFrameUrl(null)
    lastFrameKey.current = ''
  }, [filePath])

  useEffect(() => {
    if (!fallback) {
      setBannerVisible(false)
      return
    }
    setBannerVisible(true)
    if (bannerTimer.current) window.clearTimeout(bannerTimer.current)
    bannerTimer.current = window.setTimeout(() => setBannerVisible(false), 5000)
    return () => {
      if (bannerTimer.current) window.clearTimeout(bannerTimer.current)
    }
  }, [fallback])

  // Frame fallback: scrub-driven ffmpeg frame fetches, debounced + cached
  useEffect(() => {
    if (!fallback || !filePath) return
    const t = externalTime ?? time
    const rounded = Math.round(t * 5) / 5
    const key = `${filePath}@${rounded.toFixed(1)}`
    if (key === lastFrameKey.current) return

    const cached = cacheGet(key)
    if (cached) {
      lastFrameKey.current = key
      setFrameUrl(cached)
      return
    }

    lastFrameKey.current = key
    const handle = window.setTimeout(() => {
      setFrameLoading(true)
      ipc.media
        .frame(filePath, rounded, 480)
        .then((url) => {
          if (url) {
            cacheSet(key, url)
            setFrameUrl(url)
          }
        })
        .catch(() => {})
        .finally(() => setFrameLoading(false))
    }, 60)
    return () => window.clearTimeout(handle)
  }, [fallback, filePath, externalTime, time])

  const toggle = () => {
    if (fallback) return
    const v = videoRef.current
    if (!v) return
    if (v.paused) void v.play().catch(() => setFallback(true))
    else v.pause()
  }

  if (!filePath) {
    return (
      <div className="flex h-56 items-center justify-center rounded-xl border border-dashed border-edge text-sm text-text-muted">
        Bir dosya seç → burada oynat.
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-edge bg-black">
      <div className="relative aspect-video w-full">
        {fallback ? (
          <div className="relative flex h-full w-full items-center justify-center">
            {frameUrl ? (
              <img src={frameUrl} alt="frame" className="h-full w-full object-contain" />
            ) : (
              <div className="flex flex-col items-center gap-2 text-text-muted">
                <FileImage className="h-8 w-8" />
                <span className="text-xs">Frame yükleniyor…</span>
              </div>
            )}
            {frameLoading && frameUrl && (
              <div className="absolute right-2 top-2 rounded bg-black/60 px-2 py-0.5 text-[10px] text-zinc-300">
                yükleniyor
              </div>
            )}
          </div>
        ) : src ? (
          <video
            ref={videoRef}
            src={src}
            className="h-full w-full bg-black"
            preload="auto"
            muted={muted}
            playsInline
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
            onError={(e) => {
              console.warn('video element error', e.currentTarget.error)
              setFallback(true)
            }}
          />
        ) : (
          // Proxy still being generated (or pending). Show a calm spinner.
          <div className="flex h-full w-full flex-col items-center justify-center gap-3 text-text-muted">
            <Loader2 className="h-6 w-6 animate-spin text-accent" />
            <div className="text-sm">Önizleme hazırlanıyor…</div>
            <div className="text-2xs text-text-muted">
              {proxyState === 'pending' ? 'ffmpeg ile h264 proxy çıkarılıyor' : 'bekleniyor'}
            </div>
          </div>
        )}

        {fallback && bannerVisible && (
          <div className="absolute inset-x-2 bottom-2 flex items-start gap-2 rounded-md bg-amber-950/85 px-3 py-2 text-xs text-amber-100 shadow-lg backdrop-blur transition-opacity">
            <Info className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <span className="flex-1 leading-snug">
              Codec tarayıcıda çalmıyor — dalga üzerinde sürükle, her ana ait kare gösterilir.
            </span>
            <button
              className="rounded p-0.5 text-amber-200 hover:bg-amber-100/10"
              onClick={() => setBannerVisible(false)}
              title="Kapat"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
      <div className="flex items-center gap-3 border-t border-edge bg-bg-surface px-3 py-2 text-xs text-text-secondary">
        <button
          className="btn-ghost h-7 w-7 !p-0 text-text-primary disabled:opacity-40"
          onClick={toggle}
          disabled={fallback || !src}
          title={fallback ? 'Frame modu' : playing ? 'Duraklat' : 'Oynat'}
        >
          {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </button>
        <span className="font-mono tabular-nums text-text-primary">
          {formatSeconds(externalTime ?? time)}
        </span>
        {fallback && (
          <button
            onClick={() => setBannerVisible((v) => !v)}
            className="rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-200 hover:bg-amber-500/20"
            title="Frame modu — bilgi için tıkla"
          >
            frame mode
          </button>
        )}
        {proxyState === 'pending' && (
          <span className="flex items-center gap-1 text-2xs text-text-muted">
            <Loader2 className="h-3 w-3 animate-spin" /> proxy
          </span>
        )}
        <div className="flex-1" />
        <span className="font-mono tabular-nums text-text-muted">{formatSeconds(duration)}</span>
        <button
          className="btn-ghost h-7 w-7 !p-0 text-text-muted disabled:opacity-40"
          onClick={() => setMuted((m) => !m)}
          disabled={fallback || !src}
          title={muted ? 'Sesi aç' : 'Sustur'}
        >
          {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </button>
        <button
          className="btn-ghost h-7 w-7 !p-0 text-text-muted disabled:opacity-40"
          onClick={() => videoRef.current?.requestFullscreen?.()}
          disabled={fallback || !src}
          title="Tam ekran"
        >
          <Maximize2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
})
