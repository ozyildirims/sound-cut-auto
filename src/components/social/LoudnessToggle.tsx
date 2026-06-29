import { Field, Input, Switch } from '../ui'
import { useAppStore } from '../../state/store'
import { useEffectiveSettings } from '../../state/hooks'

export function LoudnessToggle() {
  const target = useEffectiveSettings().loudnessTarget ?? null
  const patch = useAppStore((s) => s.patchEffective)
  const enabled = target != null
  return (
    <Field
      label="Loudness normalize"
      trailing={
        <Switch
          checked={enabled}
          onCheckedChange={(v) => patch({ loudnessTarget: v ? -14 : null })}
        />
      }
      hint={enabled ? 'Instagram/TikTok zaten normalize eder — -14 LUFS sweet spot.' : 'Kapalı.'}
    >
      <div className="flex items-center gap-2">
        <Input
          type="number"
          min={-23}
          max={-9}
          step={0.5}
          disabled={!enabled}
          value={target ?? -14}
          onChange={(e) => {
            const n = Number(e.target.value)
            if (!Number.isNaN(n)) patch({ loudnessTarget: n })
          }}
        />
        <span className="text-xs text-text-muted">LUFS</span>
      </div>
    </Field>
  )
}
