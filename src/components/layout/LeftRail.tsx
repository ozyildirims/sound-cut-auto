import { ArrowDown, ArrowUp, Clock, FileVideo, Plus, X } from 'lucide-react'
import { Button } from '../ui'
import { ipc } from '../../ipc/client'
import { useAppStore } from '../../state/store'
import { formatSeconds } from '../../lib/format'

export function LeftRail() {
  const files = useAppStore((s) => s.files)
  const selectedId = useAppStore((s) => s.selectedFileId)
  const setSelected = useAppStore((s) => s.setSelectedFile)
  const removeFile = useAppStore((s) => s.removeFile)
  const reorderFile = useAppStore((s) => s.reorderFile)
  const addFiles = useAppStore((s) => s.addFiles)
  const recent = useAppStore((s) => s.recentFiles)

  async function handlePick() {
    const paths = await ipc.dialog.openFiles()
    if (paths.length) addFiles(paths)
  }

  return (
    <aside className="flex w-[220px] flex-col border-r border-edge-subtle bg-bg-base/60">
      <div className="flex items-center justify-between px-3 pt-3 pb-2">
        <div className="text-micro">Kuyruk</div>
        <Button variant="ghost" size="icon" onClick={handlePick} title="Dosya ekle">
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-3">
        {files.length === 0 ? (
          <button
            onClick={handlePick}
            className="mt-1 flex h-32 w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-edge text-xs text-text-muted hover:bg-white/5 hover:text-text-secondary transition-colors duration-fast"
          >
            <FileVideo className="h-5 w-5 opacity-40" />
            Dosya yok
          </button>
        ) : (
          <ul className="space-y-1">
            {files.map((file, idx) => {
              const active = file.id === selectedId
              const hasOverride = Boolean(file.settingsOverride && Object.keys(file.settingsOverride).length)
              return (
                <li
                  key={file.id}
                  onClick={() => setSelected(file.id)}
                  className={`group flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 transition-colors duration-fast ${
                    active ? 'bg-accent/15' : 'hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="relative h-8 w-12 flex-shrink-0 overflow-hidden rounded bg-bg-elev">
                    {file.thumbnailDataUrl ? (
                      <img src={file.thumbnailDataUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <FileVideo className="absolute inset-0 m-auto h-3.5 w-3.5 text-text-muted" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className={`truncate text-xs font-medium ${active ? 'text-accent' : 'text-text-primary'}`}>
                      {file.name}
                    </div>
                    <div className="truncate text-2xs text-text-muted">
                      {formatSeconds(file.durationSeconds)}
                      {hasOverride && <span className="ml-1.5 text-accent">• özel</span>}
                    </div>
                  </div>
                  <div className="hidden flex-shrink-0 items-center gap-0.5 group-hover:flex" onClick={(e) => e.stopPropagation()}>
                    {idx > 0 && (
                      <button
                        className="rounded p-0.5 text-text-muted hover:bg-white/5 hover:text-text-secondary"
                        onClick={() => reorderFile(file.id, -1)}
                      >
                        <ArrowUp className="h-3 w-3" />
                      </button>
                    )}
                    {idx < files.length - 1 && (
                      <button
                        className="rounded p-0.5 text-text-muted hover:bg-white/5 hover:text-text-secondary"
                        onClick={() => reorderFile(file.id, 1)}
                      >
                        <ArrowDown className="h-3 w-3" />
                      </button>
                    )}
                    <button
                      className="rounded p-0.5 text-text-muted hover:bg-critical/15 hover:text-critical"
                      onClick={() => removeFile(file.id)}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}

        {recent.length > 0 && (
          <div className="mt-4 space-y-1">
            <div className="flex items-center gap-1 px-2 pb-1 text-micro">
              <Clock className="h-3 w-3" /> Son
            </div>
            {recent.slice(0, 5).map((p) => {
              const name = p.split(/[/\\]/).pop() || p
              return (
                <button
                  key={p}
                  onClick={() => addFiles([p])}
                  className="flex w-full min-w-0 items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs text-text-secondary hover:bg-white/[0.04] hover:text-text-primary transition-colors duration-fast"
                >
                  <FileVideo className="h-3 w-3 flex-shrink-0 text-text-muted" />
                  <span className="truncate">{name}</span>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </aside>
  )
}
