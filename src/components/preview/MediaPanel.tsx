import * as Tabs from '@radix-ui/react-tabs'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useAppStore } from '../../state/store'
import { useEffectiveSettings } from '../../state/hooks'
import { ipc } from '../../ipc/client'
import { SOCIAL_PRESETS, type SocialPreset } from '@shared/types'
import { VideoPlayer, type VideoPlayerHandle } from './VideoPlayer'
import { Waveform } from './Waveform'
import { PlatformMockup } from '../social/PlatformMockup'

type TabValue = 'original' | SocialPreset

export function MediaPanel() {
  const path = useAppStore((s) => {
    const id = s.selectedFileId
    return s.files.find((f) => f.id === id)?.path ?? s.files[0]?.path ?? null
  })
  const probedDuration = useAppStore((s) => {
    const id = s.selectedFileId
    return s.files.find((f) => f.id === id)?.durationSeconds ?? s.files[0]?.durationSeconds ?? 0
  })
  const settings = useEffectiveSettings()
  const setPlayback = useAppStore((s) => s.setPlayback)
  const playerRef = useRef<VideoPlayerHandle>(null)
  const [time, setTime] = useState(0)
  const [videoDuration, setVideoDuration] = useState(0)
  const duration = videoDuration || probedDuration

  // Default tab follows the social preset (manual selection still wins
  // because of how Tabs.Root is controlled).
  const [tab, setTab] = useState<TabValue>('original')
  useEffect(() => {
    if (settings.socialPreset) setTab(settings.socialPreset)
    else setTab('original')
  }, [settings.socialPreset])

  useEffect(() => {
    setPlayback({ currentTime: time, duration })
  }, [time, duration, setPlayback])

  useEffect(() => {
    if (probedDuration || !path) return
    let cancelled = false
    ipc.media
      .probe(path)
      .then((info) => {
        if (!cancelled && info.durationSeconds && info.durationSeconds > 0) {
          setVideoDuration(info.durationSeconds)
        }
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [path, probedDuration])

  useEffect(() => {
    setTime(0)
    setVideoDuration(0)
  }, [path])

  const handleSeek = useCallback((t: number) => {
    setTime(t)
    playerRef.current?.seek(t)
  }, [])

  const player = (
    <VideoPlayer
      ref={playerRef}
      filePath={path}
      duration={duration}
      externalTime={time}
      onTimeUpdate={setTime}
      onDurationChange={setVideoDuration}
    />
  )

  return (
    <div className="space-y-3">
      <Tabs.Root value={tab} onValueChange={(v) => setTab(v as TabValue)}>
        <Tabs.List className="inline-flex items-center gap-0.5 rounded-md border border-edge bg-bg-elev p-0.5">
          <TabTrigger value="original" label="Orijinal" />
          {SOCIAL_PRESETS.map((p) => (
            <TabTrigger key={p.id} value={p.id} label={p.shortLabel} />
          ))}
        </Tabs.List>

        <Tabs.Content
          value="original"
          className="mt-3 outline-none data-[state=active]:animate-in data-[state=active]:fade-in-0"
        >
          {player}
        </Tabs.Content>

        {SOCIAL_PRESETS.map((p) => (
          <Tabs.Content
            key={p.id}
            value={p.id}
            className="mt-3 outline-none data-[state=active]:animate-in data-[state=active]:fade-in-0"
          >
            <PlatformMockup platform={p.id}>{player}</PlatformMockup>
          </Tabs.Content>
        ))}
      </Tabs.Root>

      <Waveform duration={duration} currentTime={time} onSeek={handleSeek} />
    </div>
  )
}

function TabTrigger({ value, label }: { value: TabValue; label: string }) {
  return (
    <Tabs.Trigger
      value={value}
      className="rounded px-3 py-1.5 text-xs text-text-secondary transition-colors duration-fast ease-out hover:text-text-primary data-[state=active]:bg-accent/15 data-[state=active]:text-accent"
    >
      {label}
    </Tabs.Trigger>
  )
}
