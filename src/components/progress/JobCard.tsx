import { CheckCircle2, FolderOpen, Loader2, Play, XCircle, X } from 'lucide-react'
import type { Job } from '@shared/types'
import { ipc } from '../../ipc/client'
import { useAppStore } from '../../state/store'

const PHASE_LABEL: Record<string, string> = {
  starting: 'Başlatılıyor',
  analyzing: 'Analiz',
  rendering: 'Render',
  muxing: 'Birleştirme',
  done: 'Tamamlandı',
  unknown: 'Çalışıyor'
}

export function JobCard({ job }: { job: Job }) {
  const cancelJob = useAppStore((s) => s.cancelJob)
  const pct = Math.round(job.ratio * 100)
  const isDone = job.status === 'completed'
  const canOpen = isDone && job.mode === 'export' && Boolean(job.outputPath)

  const openVideo = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    if (job.outputPath) void ipc.shell.open(job.outputPath)
  }

  const revealVideo = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    if (job.outputPath) void ipc.shell.reveal(job.outputPath)
  }

  return (
    <div
      onClick={canOpen ? openVideo : undefined}
      className={`card p-4 ${canOpen ? 'cursor-pointer transition-colors hover:border-accent/50 hover:bg-white/[0.02]' : ''}`}
      title={canOpen ? 'Tıkla — videoyu aç' : undefined}
    >
      <div className="flex items-start gap-3">
        <StatusIcon status={job.status} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <div className="truncate text-sm font-medium text-zinc-100">{job.fileName}</div>
            <div className="text-xs text-zinc-500">{job.mode === 'preview' ? 'preview' : 'export'}</div>
          </div>
          <div className="mt-1 text-xs text-zinc-500">
            {PHASE_LABEL[job.phase] ?? job.phase} · {job.current}/{job.total}
          </div>
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-edge">
            <div
              className={`h-full transition-all ${
                job.status === 'failed'
                  ? 'bg-rose-500'
                  : job.status === 'cancelled'
                    ? 'bg-zinc-500'
                    : 'bg-accent'
              }`}
              style={{ width: `${pct}%` }}
            />
          </div>
          {job.outputPath && isDone && (
            <div className="mt-2 truncate font-mono text-[11px] text-zinc-500" title={job.outputPath}>
              {job.outputPath}
            </div>
          )}
          {job.errorMessage && (
            <div className="mt-2 text-xs text-rose-300">{job.errorMessage}</div>
          )}
          {isDone && job.mode === 'export' && (
            <div className="mt-2 text-xs text-zinc-500">
              Çıktıda fark görmediysen Project ekranından "Kesim agresifliği"ni yükseltip
              tekrar dene.
            </div>
          )}
        </div>
        <div className="flex items-center gap-1">
          {job.status === 'running' || job.status === 'queued' ? (
            <button
              className="btn-ghost text-zinc-400 hover:text-rose-300"
              onClick={(e) => {
                e.stopPropagation()
                void cancelJob(job.id)
              }}
              title="İptal"
            >
              <X className="h-4 w-4" />
            </button>
          ) : (
            canOpen && (
              <>
                <button
                  className="btn-ghost text-zinc-400 hover:text-accent"
                  onClick={openVideo}
                  title="Videoyu aç"
                >
                  <Play className="h-4 w-4" />
                </button>
                <button
                  className="btn-ghost text-zinc-400"
                  onClick={revealVideo}
                  title="Klasörde göster"
                >
                  <FolderOpen className="h-4 w-4" />
                </button>
              </>
            )
          )}
        </div>
      </div>
    </div>
  )
}

function StatusIcon({ status }: { status: Job['status'] }) {
  if (status === 'completed') return <CheckCircle2 className="h-5 w-5 text-emerald-400" />
  if (status === 'failed') return <XCircle className="h-5 w-5 text-rose-400" />
  if (status === 'cancelled') return <XCircle className="h-5 w-5 text-zinc-500" />
  if (status === 'running') return <Loader2 className="h-5 w-5 animate-spin text-accent" />
  return <Loader2 className="h-5 w-5 text-zinc-500" />
}
