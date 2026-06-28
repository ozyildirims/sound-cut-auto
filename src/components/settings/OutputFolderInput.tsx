import { FolderOpen, X } from 'lucide-react'
import { ipc } from '../../ipc/client'
import { useAppStore } from '../../state/store'
import { useEffectiveSettings } from '../../state/hooks'

export function OutputFolderInput() {
  const value = useEffectiveSettings().outputDir
  const patch = useAppStore((s) => s.patchEffective)
  return (
    <div className="space-y-2">
      <label className="label">Çıktı klasörü</label>
      <div className="flex gap-2">
        <input
          className="input flex-1"
          value={value ?? ''}
          readOnly
          placeholder="Boş bırakırsan kaynak dosyanın yanına yazar"
        />
        <button
          className="btn-outline"
          onClick={async () => {
            const next = await ipc.dialog.selectFolder()
            if (next) patch({ outputDir: next })
          }}
        >
          <FolderOpen className="h-4 w-4" /> Seç
        </button>
        {value && (
          <button
            className="btn-ghost text-zinc-400"
            onClick={() => patch({ outputDir: null })}
            title="Temizle"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  )
}
