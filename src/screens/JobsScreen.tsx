import { ListChecks } from 'lucide-react'
import { JobCard } from '../components/progress/JobCard'
import { useAppStore } from '../state/store'

export function JobsScreen() {
  const jobs = useAppStore((s) => s.jobs)

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4 p-8">
      <header>
        <h1 className="flex items-center gap-2 text-2xl font-semibold text-zinc-100">
          <ListChecks className="h-6 w-6" /> Jobs
        </h1>
        <p className="text-sm text-zinc-400">
          Çalışan, tamamlanan ve başarısız işler. Her seferinde bir job çalışır.
        </p>
      </header>

      {jobs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-edge p-8 text-center text-sm text-zinc-500">
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
