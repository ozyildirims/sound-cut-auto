import { ArrowDown, ArrowUp, FileVideo, X } from 'lucide-react'
import { useAppStore } from '../../state/store'

export function FileQueue() {
  const files = useAppStore((s) => s.files)
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
    <ul className="divide-y divide-edge rounded-xl border border-edge bg-bg-surface">
      {files.map((file, idx) => (
        <li key={file.id} className="flex items-center gap-3 px-4 py-3">
          <FileVideo className="h-4 w-4 flex-shrink-0 text-zinc-500" />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm text-zinc-100">{file.name}</div>
            <div className="truncate text-xs text-zinc-500">{file.path}</div>
          </div>
          <div className="flex items-center gap-1">
            <button
              className="rounded p-1.5 text-zinc-500 hover:bg-white/5 disabled:opacity-30"
              disabled={idx === 0}
              onClick={() => reorderFile(file.id, -1)}
              title="Yukarı taşı"
            >
              <ArrowUp className="h-4 w-4" />
            </button>
            <button
              className="rounded p-1.5 text-zinc-500 hover:bg-white/5 disabled:opacity-30"
              disabled={idx === files.length - 1}
              onClick={() => reorderFile(file.id, 1)}
              title="Aşağı taşı"
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
      ))}
    </ul>
  )
}
