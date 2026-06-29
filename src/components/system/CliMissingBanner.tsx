import { AlertTriangle, FolderOpen, RotateCcw } from 'lucide-react'
import { ipc } from '../../ipc/client'
import { useAppStore } from '../../state/store'

export function CliMissingBanner() {
  const cli = useAppStore((s) => s.cli)
  const setCliStatus = useAppStore((s) => s.setCliStatus)
  if (cli.found) return null

  return (
    <div className="flex items-center gap-3 border-b border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
      <AlertTriangle className="h-4 w-4 flex-shrink-0" />
      <div className="flex-1">
        <div className="font-medium text-amber-100">auto-editor bulunamadı.</div>
        <div className="text-amber-200/80">
          {cli.error ?? 'Brew/pip ile kurun veya bir binary seçin.'}
        </div>
      </div>
      <button
        className="btn-outline border-amber-400/60 text-amber-100 hover:bg-amber-500/10"
        onClick={async () => {
          const status = await ipc.cli.locateManual()
          setCliStatus(status)
        }}
      >
        <FolderOpen className="h-4 w-4" /> Binary seç
      </button>
      <button
        className="btn-outline border-amber-400/60 text-amber-100 hover:bg-amber-500/10"
        onClick={async () => {
          const status = await ipc.cli.resetOverride()
          setCliStatus(status)
        }}
        title="Override'ı temizle, sidecar / PATH ile tekrar dene"
      >
        <RotateCcw className="h-4 w-4" /> Sıfırla
      </button>
    </div>
  )
}
