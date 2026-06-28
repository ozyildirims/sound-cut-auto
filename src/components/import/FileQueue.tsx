import { ArrowDown, ArrowUp, FileVideo, X } from 'lucide-react'
import { useAppStore } from '../../state/store'
import { formatSeconds } from '../../lib/format'

export function FileQueue() {
  const files = useAppStore((s) => s.files)
  const selectedId = useAppStore((s) => s.selectedFileId)
  const setSelected = useAppStore((s) => s.setSelectedFile)
  const removeFile = useAppStore((s) => s.removeFile)
  const reorderFile = useAppStore((s) => s.reorderFile)

  if (!files.length) {
    return (
      <div className="rounded-xl border border-dashed border-edge p-6 text-center text-sm text-zinc-500">
        Henüz dosya eklenmedi.
      </div>
    )
  }

  return (
    <ul className="divide-y divide-edge overflow-hidden rounded-xl border border-edge bg-bg-surface">
      {files.map((file, idx) => {
        const active = file.id === selectedId
        const hasOverride = Boolean(file.settingsOverride && Object.keys(file.settingsOverride).length)
        return (
          <li
            key={file.id}
            onClick={() => setSelected(file.id)}
            className={`flex cursor-pointer items-center gap-3 px-3 py-2.5 transition-colors ${
              active ? 'bg-accent/10' : 'hover:bg-white/[0.03]'
            }`}
          >
            <div className="relative h-12 w-16 flex-shrink-0 overflow-hidden rounded bg-bg-elev">
              {file.thumbnailDataUrl ? (
                <img src={file.thumbnailDataUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <FileVideo className="h-5 w-5 text-zinc-600" />
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <div className="truncate text-sm font-medium text-zinc-100">{file.name}</div>
                {hasOverride && (
                  <span className="rounded-full bg-accent/15 px-1.5 py-0.5 text-[9px] font-medium uppercase text-accent">
                    özel
                  </span>
                )}
              </div>
              <div className="truncate text-[11px] text-zinc-500">
                {formatSeconds(file.durationSeconds)} · {file.path}
              </div>
            </div>
            <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
              <button
                className="rounded p-1.5 text-zinc-500 hover:bg-white/5 disabled:opacity-30"
                disabled={idx === 0}
                onClick={() => reorderFile(file.id, -1)}
                title="Yukarı"
              >
                <ArrowUp className="h-4 w-4" />
              </button>
              <button
                className="rounded p-1.5 text-zinc-500 hover:bg-white/5 disabled:opacity-30"
                disabled={idx === files.length - 1}
                onClick={() => reorderFile(file.id, 1)}
                title="Aşağı"
              >
                <ArrowDown className="h-4 w-4" />
              </button>
              <button
                className="rounded p-1.5 text-zinc-500 hover:bg-rose-500/10 hover:text-rose-300"
                onClick={() => removeFile(file.id)}
                title="Kaldır"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
