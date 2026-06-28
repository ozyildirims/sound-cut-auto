import { RotateCcw, Users } from 'lucide-react'
import { useAppStore } from '../../state/store'

export function PerFileHeader() {
  const selectedId = useAppStore((s) => s.selectedFileId)
  const file = useAppStore((s) => s.files.find((f) => f.id === selectedId) ?? null)
  const applyAll = useAppStore((s) => s.applyOverrideToAll)
  const resetOverride = useAppStore((s) => s.resetOverride)
  const files = useAppStore((s) => s.files)
  if (!file) return null

  const hasOverride = Boolean(file.settingsOverride && Object.keys(file.settingsOverride).length)
  const multi = files.length > 1

  return (
    <div className="flex items-center justify-between rounded-lg border border-edge bg-bg-surface/40 px-4 py-2.5 text-sm">
      <div className="min-w-0">
        <div className="text-[11px] uppercase tracking-wide text-zinc-500">Ayarlar şu dosya için</div>
        <div className="truncate text-zinc-200">{file.name}</div>
      </div>
      <div className="flex items-center gap-2">
        {hasOverride && (
          <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-medium text-accent">
            özel
          </span>
        )}
        {hasOverride && multi && (
          <button className="btn-ghost text-zinc-400" onClick={applyAll} title="Bu ayarları tüm dosyalara uygula">
            <Users className="h-4 w-4" />
          </button>
        )}
        {hasOverride && (
          <button className="btn-ghost text-zinc-400" onClick={resetOverride} title="Default'a sıfırla">
            <RotateCcw className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  )
}
