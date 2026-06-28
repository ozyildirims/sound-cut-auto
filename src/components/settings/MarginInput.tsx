import { useAppStore } from '../../state/store'

export function MarginInput() {
  const value = useAppStore((s) => s.settings.margin)
  const patch = useAppStore((s) => s.patchSettings)
  return (
    <div className="space-y-2">
      <label className="label">Margin (sessiz olmayan bölümlerin etrafına ekle)</label>
      <input
        className="input"
        value={value}
        onChange={(e) => patch({ margin: e.target.value })}
        placeholder="0.2s"
      />
      <p className="text-xs text-zinc-500">
        Örn: <code>0.2s</code>, <code>200ms</code>, ya da <code>0.1s,0.3s</code> (önce,sonra).
      </p>
    </div>
  )
}
