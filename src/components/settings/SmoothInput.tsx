import * as Switch from '@radix-ui/react-switch'
import { useAppStore } from '../../state/store'

export function SmoothInput() {
  const settings = useAppStore((s) => s.settings)
  const patch = useAppStore((s) => s.patchSettings)

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="label">Smooth (min cut + min clip)</label>
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-500">{settings.smoothEnabled ? 'Açık' : 'Kapalı'}</span>
          <Switch.Root
            checked={settings.smoothEnabled}
            onCheckedChange={(v) => patch({ smoothEnabled: v })}
            className="relative h-5 w-9 rounded-full bg-edge data-[state=checked]:bg-accent"
          >
            <Switch.Thumb className="block h-4 w-4 translate-x-0.5 rounded-full bg-zinc-100 transition-transform data-[state=checked]:translate-x-[18px]" />
          </Switch.Root>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <input
          className="input"
          disabled={!settings.smoothEnabled}
          value={settings.smoothMincut}
          onChange={(e) => patch({ smoothMincut: e.target.value })}
          placeholder="min cut (örn 0.2s)"
        />
        <input
          className="input"
          disabled={!settings.smoothEnabled}
          value={settings.smoothMinclip}
          onChange={(e) => patch({ smoothMinclip: e.target.value })}
          placeholder="min clip (örn 0.1s)"
        />
      </div>
      <p className="text-xs text-zinc-500">
        Çok kısa kesimleri yumuşatır — fazla titrek bir çıktı önler.
      </p>
    </div>
  )
}
