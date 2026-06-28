import { formatPercent, formatSeconds } from '../../lib/format'
import type { PreviewStats } from '@shared/types'

export function StatsCard({ stats }: { stats: PreviewStats }) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      <Tile label="Cuts" value={stats.cuts != null ? stats.cuts.toString() : '—'} />
      <Tile label="Giriş süresi" value={formatSeconds(stats.inputSeconds)} />
      <Tile label="Çıkış süresi" value={formatSeconds(stats.outputSeconds)} />
      <Tile label="% Kesilen" value={formatPercent(stats.percentRemoved)} />
    </div>
  )
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-edge bg-bg-elev p-3">
      <div className="text-[10px] uppercase tracking-wider text-zinc-500">{label}</div>
      <div className="mt-1 text-xl font-semibold text-zinc-100">{value}</div>
    </div>
  )
}
