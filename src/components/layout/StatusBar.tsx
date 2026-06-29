import { Activity, CheckCircle2, FileVideo, Loader2 } from 'lucide-react'
import { Badge } from '../ui'
import { useAppStore } from '../../state/store'
import { formatPercent, formatSeconds } from '../../lib/format'

export function StatusBar() {
  const files = useAppStore((s) => s.files)
  const preview = useAppStore((s) => s.preview)
  const cli = useAppStore((s) => s.cli)
  const jobs = useAppStore((s) => s.jobs)
  const running = jobs.filter((j) => j.status === 'running' || j.status === 'queued').length

  return (
    <footer className="flex h-7 items-center gap-3 border-t border-edge-subtle bg-bg-zenith/70 px-4 text-2xs text-text-muted backdrop-blur">
      <span className="flex items-center gap-1.5">
        <FileVideo className="h-3 w-3" /> {files.length} dosya
      </span>

      {preview.stats && (
        <>
          <span className="opacity-30">•</span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="h-3 w-3 text-success" />
            ~{formatSeconds(preview.stats.outputSeconds)} • {formatPercent(preview.stats.percentRemoved)} kesim
          </span>
        </>
      )}

      {preview.running && (
        <>
          <span className="opacity-30">•</span>
          <span className="flex items-center gap-1.5">
            <Loader2 className="h-3 w-3 animate-spin" /> önizleme
          </span>
        </>
      )}

      {running > 0 && (
        <>
          <span className="opacity-30">•</span>
          <span className="flex items-center gap-1.5 text-accent">
            <Activity className="h-3 w-3" /> {running} aktif iş
          </span>
        </>
      )}

      <div className="flex-1" />

      <div className="flex items-center gap-2">
        {cli.found ? (
          <Badge tone="success" size="sm" dot>
            CLI {cli.version ?? 'OK'}
          </Badge>
        ) : (
          <Badge tone="critical" size="sm" dot>
            CLI yok
          </Badge>
        )}
      </div>
    </footer>
  )
}
