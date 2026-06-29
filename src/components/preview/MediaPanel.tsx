import { useCallback, useEffect, useRef, useState } from 'react'
import { useAppStore } from '../../state/store'
import { ipc } from '../../ipc/client'
import { VideoPlayer, type VideoPlayerHandle } from './VideoPlayer'
import { Waveform } from './Waveform'

export function MediaPanel() {
  const path = useAppStore((s) => {
    const id = s.selectedFileId
    return s.files.find((f) => f.id === id)?.path ?? s.files[0]?.path ?? null
  })
  // Pull duration from the queue (probed via ffprobe on add). This is the
  // source of truth even when HTMLVideoElement can't load the codec.
  const probedDuration = useAppStore((s) => {
    const id = s.selectedFileId
    return s.files.find((f) => f.id === id)?.durationSeconds ?? s.files[0]?.durationSeconds ?? 0
  })
  const playerRef = useRef<VideoPlayerHandle>(null)
  const setPlayback = useAppStore((s) => s.setPlayback)
  const [time, setTime] = useState(0)
  const [videoDuration, setVideoDuration] = useState(0)
  const duration = videoDuration || probedDuration

  // Mirror local playback into the store so peers (CoverFramePicker, etc.)
  // can read the current time without prop drilling.
  useEffect(() => {
    setPlayback({ currentTime: time, duration })
  }, [time, duration, setPlayback])

  // If duration is missing entirely (no ffprobe and HEVC), best-effort probe now
  useEffect(() => {
    if (probedDuration || !path) return
    let cancelled = false
    ipc.media.probe(path).then((info) => {
      if (cancelled) return
      if (info.durationSeconds && info.durationSeconds > 0) {
        setVideoDuration(info.durationSeconds)
      }
    }).catch(() => {})
    return () => { cancelled = true }
  }, [path, probedDuration])

  // Reset transport when the file changes
  useEffect(() => {
    setTime(0)
    setVideoDuration(0)
  }, [path])

  const handleSeek = useCallback((t: number) => {
    setTime(t)
    playerRef.current?.seek(t)
  }, [])

  return (
    <div className="space-y-3">
      <VideoPlayer
        ref={playerRef}
        filePath={path}
        duration={duration}
        externalTime={time}
        onTimeUpdate={setTime}
        onDurationChange={setVideoDuration}
      />
      <Waveform duration={duration} currentTime={time} onSeek={handleSeek} />
    </div>
  )
}
