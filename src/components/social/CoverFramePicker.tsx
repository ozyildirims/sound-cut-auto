import { useEffect, useState } from 'react'
import { Camera, RotateCcw } from 'lucide-react'
import { Button, Field, Switch } from '../ui'
import { ipc } from '../../ipc/client'
import { useAppStore } from '../../state/store'
import { useEffectiveSettings } from '../../state/hooks'
import { formatSeconds } from '../../lib/format'

export function CoverFramePicker() {
  const currentPlaybackTime = useAppStore((s) => s.playback.currentTime)
  const enabled = (useEffectiveSettings().exportCover ?? false) === true
  const patch = useAppStore((s) => s.patchEffective)
  const selectedId = useAppStore((s) => s.selectedFileId)
  const file = useAppStore((s) =>
    s.files.find((f) => f.id === selectedId) ?? s.files[0] ?? null
  )
  const updateFile = useAppStore((s) => s.updateFile)
  const [thumb, setThumb] = useState<string | null>(null)
  const duration = file?.durationSeconds ?? 0
  const coverTime = file?.coverTimeSeconds ?? (duration ? duration * 0.1 : 0)

  useEffect(() => {
    if (!enabled || !file) {
      setThumb(null)
      return
    }
    let cancelled = false
    ipc.media
      .frame(file.path, coverTime, 320)
      .then((url) => {
        if (!cancelled) setThumb(url)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [enabled, file, coverTime])

  if (!file) return null

  return (
    <Field
      label="Cover frame"
      trailing={
        <Switch checked={enabled} onCheckedChange={(v) => patch({ exportCover: v })} />
      }
      hint={
        enabled
          ? `Bu saniyenin karesi ${file.name.replace(/\.[^.]+$/, '')}_cover.jpg olarak yan dosya kaydedilir.`
          : 'Kapalı.'
      }
    >
      {enabled && (
        <div className="flex items-center gap-3 rounded-md border border-edge bg-bg-elev p-2">
          <div className="h-14 w-24 flex-shrink-0 overflow-hidden rounded bg-bg-base">
            {thumb ? (
              <img src={thumb} alt="cover" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-text-muted">
                <Camera className="h-4 w-4" />
              </div>
            )}
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <div className="font-mono text-xs text-text-primary">{formatSeconds(coverTime)}</div>
            <div className="flex gap-1.5">
              <Button
                variant="ghost"
                size="sm"
                leading={<Camera className="h-3 w-3" />}
                disabled={!currentPlaybackTime}
                onClick={() => {
                  if (currentPlaybackTime > 0) {
                    updateFile(file.id, { coverTimeSeconds: currentPlaybackTime })
                  }
                }}
              >
                Şu anı al
              </Button>
              <Button
                variant="ghost"
                size="sm"
                leading={<RotateCcw className="h-3 w-3" />}
                onClick={() => updateFile(file.id, { coverTimeSeconds: undefined })}
                title="Otomatik fallback'e dön (%10)"
              >
                Otomatik
              </Button>
            </div>
          </div>
        </div>
      )}
    </Field>
  )
}
