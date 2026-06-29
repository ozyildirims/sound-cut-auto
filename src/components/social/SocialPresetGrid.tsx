import { Instagram, Music2, PlaySquare, X } from 'lucide-react'
import { SOCIAL_PRESETS, type SocialPreset } from '@shared/types'
import { useAppStore } from '../../state/store'
import { useEffectiveSettings } from '../../state/hooks'
import { Button } from '../ui'

const ICONS: Record<SocialPreset, typeof Instagram> = {
  'instagram-reel': Instagram,
  'tiktok': Music2,
  'youtube-shorts': PlaySquare
}

export function SocialPresetGrid() {
  const active = useEffectiveSettings().socialPreset ?? null
  const patch = useAppStore((s) => s.patchEffective)

  function apply(id: SocialPreset) {
    const preset = SOCIAL_PRESETS.find((p) => p.id === id)!
    patch({
      socialPreset: id,
      aspectMode: 'crop-center',
      loudnessTarget: preset.recommendedLoudness,
      exportCover: true
    })
  }

  function clear() {
    patch({
      socialPreset: null,
      aspectMode: 'none',
      loudnessTarget: null,
      exportCover: false
    })
  }

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-3 gap-2">
        {SOCIAL_PRESETS.map((preset) => {
          const Icon = ICONS[preset.id]
          const isActive = active === preset.id
          return (
            <button
              key={preset.id}
              onClick={() => apply(preset.id)}
              className={[
                'group flex aspect-[9/16] flex-col items-center justify-end gap-1 rounded-md border p-2 transition-all duration-fast ease-out',
                'relative overflow-hidden',
                isActive
                  ? 'border-accent/70 bg-gradient-to-b from-accent/15 to-accent/5 shadow-glow'
                  : 'border-edge bg-bg-elev hover:border-edge-strong hover:bg-bg-elev2'
              ].join(' ')}
            >
              <Icon
                className={[
                  'h-5 w-5 transition-colors duration-fast',
                  isActive ? 'text-accent' : 'text-text-muted group-hover:text-text-secondary'
                ].join(' ')}
              />
              <span
                className={[
                  'text-2xs font-medium tracking-tight',
                  isActive ? 'text-accent' : 'text-text-secondary'
                ].join(' ')}
              >
                {preset.shortLabel}
              </span>
              <span className="text-[9px] text-text-muted">
                {Math.floor(preset.maxSeconds / 60) > 0
                  ? `${Math.floor(preset.maxSeconds / 60)}d max`
                  : `${preset.maxSeconds}sn`}
              </span>
            </button>
          )
        })}
      </div>
      {active && (
        <Button variant="ghost" size="sm" leading={<X className="h-3 w-3" />} onClick={clear} className="w-full">
          Sosyal profili kapat
        </Button>
      )}
    </div>
  )
}
