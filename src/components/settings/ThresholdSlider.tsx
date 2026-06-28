import * as Slider from '@radix-ui/react-slider'
import { useAppStore } from '../../state/store'

const MIN = 0
const MAX = 0.3
const STEP = 0.001

export function ThresholdSlider() {
  const value = useAppStore((s) => s.settings.thresholdAudio)
  const patch = useAppStore((s) => s.patchSettings)

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="label">Sessizlik eşiği (threshold)</label>
        <input
          type="number"
          className="input w-24 text-right"
          min={MIN}
          max={MAX}
          step={STEP}
          value={Number(value.toFixed(3))}
          onChange={(e) => {
            const next = Number(e.target.value)
            if (!Number.isNaN(next)) patch({ thresholdAudio: clamp(next) })
          }}
        />
      </div>
      <Slider.Root
        className="relative flex h-5 w-full touch-none select-none items-center"
        min={MIN}
        max={MAX}
        step={STEP}
        value={[value]}
        onValueChange={(v) => patch({ thresholdAudio: clamp(v[0]) })}
      >
        <Slider.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-edge">
          <Slider.Range className="absolute h-full bg-accent" />
        </Slider.Track>
        <Slider.Thumb className="block h-4 w-4 rounded-full border border-edge bg-zinc-100 shadow focus:outline-none focus:ring-2 focus:ring-accent/40" />
      </Slider.Root>
      <p className="text-xs text-zinc-500">
        Bu değerin altındaki ses seviyesi "sessiz" sayılır. Tipik konuşma için 0.03–0.05 iyi
        çalışır.
      </p>
    </div>
  )
}

function clamp(n: number): number {
  if (Number.isNaN(n)) return 0.04
  return Math.min(MAX, Math.max(MIN, n))
}
