import { type AspectMode } from '@shared/types'
import { Field } from '../ui'
import { useAppStore } from '../../state/store'
import { useEffectiveSettings } from '../../state/hooks'

const MODES: { id: AspectMode; label: string; description: string }[] = [
  { id: 'crop-center', label: 'Crop', description: 'Merkezden kes' },
  { id: 'blur-pad', label: 'Blur', description: 'Blurred bg + ortala' },
  { id: 'none', label: 'Orijinal', description: 'Yatay kalsın' }
]

export function AspectRatioToggle() {
  const mode = useEffectiveSettings().aspectMode ?? 'none'
  const patch = useAppStore((s) => s.patchEffective)
  return (
    <Field label="Aspect (9:16)">
      <div className="grid grid-cols-3 gap-1 rounded-md border border-edge bg-bg-elev p-0.5">
        {MODES.map((m) => {
          const active = mode === m.id
          return (
            <button
              key={m.id}
              onClick={() => patch({ aspectMode: m.id })}
              className={[
                'flex flex-col items-center gap-0.5 rounded px-2 py-1.5 text-xs transition-colors duration-fast ease-out',
                active
                  ? 'bg-accent/15 text-accent'
                  : 'text-text-secondary hover:text-text-primary hover:bg-white/5'
              ].join(' ')}
            >
              <span className="font-medium">{m.label}</span>
              <span className={`text-[9px] ${active ? 'text-accent/70' : 'text-text-muted'}`}>{m.description}</span>
            </button>
          )
        })}
      </div>
    </Field>
  )
}
