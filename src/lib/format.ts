export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  const units = ['KB', 'MB', 'GB', 'TB']
  let value = bytes / 1024
  let i = 0
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024
    i++
  }
  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[i]}`
}

export function formatSeconds(seconds: number | undefined | null): string {
  if (seconds == null || Number.isNaN(seconds)) return '—'
  const sign = seconds < 0 ? '-' : ''
  const s = Math.abs(seconds)
  const hours = Math.floor(s / 3600)
  const minutes = Math.floor((s % 3600) / 60)
  const secs = Math.round(s % 60)
  if (hours > 0) return `${sign}${hours}h ${minutes}m ${secs}s`
  if (minutes > 0) return `${sign}${minutes}m ${secs}s`
  return `${sign}${(s).toFixed(s < 10 ? 1 : 0)}s`
}

export function formatPercent(p: number | undefined | null): string {
  if (p == null || Number.isNaN(p)) return '—'
  return `${p.toFixed(1)}%`
}
