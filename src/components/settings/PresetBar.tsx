import { Sparkles } from 'lucide-react'
import { PRESETS } from '@shared/types'
import { useAppStore } from '../../state/store'
import { useEffectiveSettings } from '../../state/hooks'

export function PresetBar() {
  const settings = useEffectiveSettings()
  const patch = useAppStore((s) => s.patchEffective)

  const matchedId = PRESETS.find((p) => {
    return (
      Math.abs(p.settings.thresholdAudio - settings.thresholdAudio) < 0.001 &&
      p.settings.margin === settings.margin &&
      p.settings.smoothMincut === settings.smoothMincut &&
      p.settings.smoothMinclip === settings.smoothMinclip &&
      p.settings.smoothEnabled === settings.smoothEnabled
    )
  })?.id

  return (
    <div className="card p-4">
      <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-wide text-zinc-400">
        <Sparkles className="h-3.5 w-3.5" /> Hazır profiller
      </div>
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        {PRESETS.map((p) => {
          const active = p.id === matchedId
          return (
            <button
              key={p.id}
              onClick={() => patch(p.settings)}
              className={`rounded-lg border px-3 py-2 text-left transition-colors ${
                active
                  ? 'border-accent/60 bg-accent/10'
                  : 'border-edge hover:bg-white/5'
              }`}
            >
              <div className={`text-sm font-medium ${active ? 'text-accent' : 'text-zinc-100'}`}>
                {p.label}
              </div>
              <div className="mt-0.5 text-[11px] leading-snug text-zinc-500">
                {p.description}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
