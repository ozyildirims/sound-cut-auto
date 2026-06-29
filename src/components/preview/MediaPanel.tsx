import { useCallback, useEffect, useRef, useState } from 'react'
import { useAppStore } from '../../state/store'
import { VideoPlayer, type VideoPlayerHandle } from './VideoPlayer'
import { Waveform } from './Waveform'

export function MediaPanel() {
  const path = useAppStore((s) => {
    const id = s.selectedFileId
    return s.files.find((f) => f.id === id)?.path ?? s.files[0]?.path ?? null
  })
  const playerRef = useRef<VideoPlayerHandle>(null)
  const [time, setTime] = useState(0)
  const [duration, setDuration] = useState(0)

  // Reset transport state whenever the selected file changes so the
  // waveform playhead doesn't linger at the previous clip's position.
  useEffect(() => {
    setTime(0)
    setDuration(0)
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
        onTimeUpdate={setTime}
        onDurationChange={setDuration}
      />
      <Waveform duration={duration} currentTime={time} onSeek={handleSeek} />
    </div>
  )
}
