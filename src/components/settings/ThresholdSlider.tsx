import * as Slider from '@radix-ui/react-slider'
import { AlertTriangle } from 'lucide-react'
import { useAppStore } from '../../state/store'
import { useEffectiveSettings } from '../../state/hooks'

const PRESETS: { label: string; pct: number }[] = [
  { label: 'Yumuşak', pct: 10 },
  { label: 'Normal', pct: 20 },
  { label: 'Agresif', pct: 40 },
  { label: 'Çok agresif', pct: 60 }
]

function pctToThreshold(pct: number): number {
  return Math.max(0, Math.min(0.2, pct / 500))
}

function thresholdToPct(threshold: number): number {
  return Math.round(Math.max(0, Math.min(100, threshold * 500)))
}

export function ThresholdSlider() {
  const threshold = useEffectiveSettings().thresholdAudio
  const patch = useAppStore((s) => s.patchEffective)
  const pct = thresholdToPct(threshold)
  const tooLow = pct < 8

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="label">Kesim agresifliği</label>
        <span className="font-mono text-sm text-zinc-300">%{pct}</span>
      </div>

      <Slider.Root
        className="relative flex h-5 w-full touch-none select-none items-center"
        min={0}
        max={100}
        step={1}
        value={[pct]}
        onValueChange={(v) => patch({ thresholdAudio: pctToThreshold(v[0]) })}
      >
        <Slider.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-edge">
          <Slider.Range className="absolute h-full bg-accent" />
        </Slider.Track>
        <Slider.Thumb className="block h-4 w-4 rounded-full border border-edge bg-zinc-100 shadow focus:outline-none focus:ring-2 focus:ring-accent/40" />
      </Slider.Root>

      <div className="flex items-center justify-between text-[11px] text-zinc-500">
        <span>← Daha az kes</span>
        <span>Daha çok kes →</span>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {PRESETS.map((p) => {
          const active = Math.abs(p.pct - pct) <= 1
          return (
            <button
              key={p.label}
              onClick={() => patch({ thresholdAudio: pctToThreshold(p.pct) })}
              className={`rounded-md border px-2 py-1 text-xs transition-colors ${
                active
                  ? 'border-accent/60 bg-accent/10 text-accent'
                  : 'border-edge text-zinc-400 hover:bg-white/5'
              }`}
            >
              {p.label}
            </button>
          )
        })}
      </div>

      {tooLow && (
        <div className="flex items-start gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 p-2 text-xs text-amber-200">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
          <span>
            Çok yumuşak — bu değerde muhtemelen <strong>hiçbir şey kesilmez</strong>. Sliderı
            sağa kaydır.
          </span>
        </div>
      )}
    </div>
  )
}
