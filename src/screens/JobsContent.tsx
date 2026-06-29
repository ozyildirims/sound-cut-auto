import { ListChecks } from 'lucide-react'
import { JobCard } from '../components/progress/JobCard'
import { useAppStore } from '../state/store'

export function JobsContent() {
  const jobs = useAppStore((s) => s.jobs)

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-8">
      <header>
        <div className="text-micro">İş kuyruğu</div>
        <h1 className="mt-2 flex items-center gap-2 text-display text-2xl font-semibold tracking-tight text-text-primary">
          <ListChecks className="h-6 w-6 text-text-muted" /> Jobs
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Çalışan, tamamlanan ve başarısız işler. Her seferinde bir job çalışır.
        </p>
      </header>

      {jobs.length === 0 ? (
        <div className="surface-card flex h-48 items-center justify-center text-sm text-text-muted">
          Henüz iş yok. Project ekranından Export başlat.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {[...jobs].reverse().map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      )}
    </div>
  )
}
