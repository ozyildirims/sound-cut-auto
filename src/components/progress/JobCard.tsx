import { CheckCircle2, FolderOpen, Loader2, XCircle, X } from 'lucide-react'
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

  return (
    <div className="card p-4">
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
          {job.errorMessage && (
            <div className="mt-2 text-xs text-rose-300">{job.errorMessage}</div>
          )}
        </div>
        <div className="flex items-center gap-1">
          {job.status === 'running' || job.status === 'queued' ? (
            <button
              className="btn-ghost text-zinc-400 hover:text-rose-300"
              onClick={() => void cancelJob(job.id)}
              title="İptal"
            >
              <X className="h-4 w-4" />
            </button>
          ) : (
            job.outputPath && (
              <button
                className="btn-ghost text-zinc-400"
                onClick={() => void ipc.shell.reveal(job.outputPath!)}
                title="Klasörde göster"
              >
                <FolderOpen className="h-4 w-4" />
              </button>
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
