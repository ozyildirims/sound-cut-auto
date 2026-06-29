import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import { getSocialPreset } from '@shared/types'
import { useAppStore } from '../../state/store'
import { useEffectiveSettings } from '../../state/hooks'
import { formatSeconds } from '../../lib/format'

export function DurationGuide() {
  const settings = useEffectiveSettings()
  const preset = getSocialPreset(settings.socialPreset)
  const file = useAppStore((s) => {
    const id = s.selectedFileId
    return s.files.find((f) => f.id === id) ?? s.files[0] ?? null
  })
  const preview = useAppStore((s) => s.preview)

  if (!preset || !file) return null

  const inputDuration = file.durationSeconds ?? 0
  const outputDuration = preview.stats?.outputSeconds
  const checkValue = outputDuration ?? inputDuration
  if (!checkValue) return null

  const max = preset.maxSeconds
  const ratio = checkValue / max
  const tone = ratio <= 0.9 ? 'success' : ratio <= 1 ? 'warning' : 'critical'

  const Icon = tone === 'success' ? CheckCircle2 : AlertTriangle
  const color =
    tone === 'success'
      ? 'text-success border-success/30 bg-success/10'
      : tone === 'warning'
        ? 'text-warning border-warning/30 bg-warning/10'
        : 'text-critical border-critical/30 bg-critical/10'

  return (
    <div className={`flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs ${color}`}>
      <Icon className="h-3.5 w-3.5 flex-shrink-0" />
      <div className="flex-1">
        {tone === 'success' && (
          <span>
            {preset.label}: çıktı {formatSeconds(outputDuration ?? inputDuration)} / {formatSeconds(max)} ✓
          </span>
        )}
        {tone === 'warning' && (
          <span>
            Sınıra yakın — çıktı {formatSeconds(outputDuration ?? inputDuration)} / {formatSeconds(max)}
          </span>
        )}
        {tone === 'critical' && (
          <span>
            {preset.label} {formatSeconds(max)} sınırını aşıyor — çıktı{' '}
            {formatSeconds(outputDuration ?? inputDuration)}. Threshold yükselt veya sınırla.
          </span>
        )}
      </div>
    </div>
  )
}
