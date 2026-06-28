import type { PreviewStats } from '@shared/types'

// auto-editor's `--preview` output is a hierarchical text block:
//   length:
//    - input:     0:01:05.07  (1952) 100.0%
//    - output:    0:01:04.27  (1928) 98.77%
//    - diff:     -0:00:00.80  (-24)  -1.23%
//   clips:
//    - amount:    3
//    ...
//   cuts:
//    - amount:    2
//    ...
//
// We track the current top-level section and pull out the values we need.

const TOP_KEY = /^(\w[\w-]*):\s*$/
const SUB_LINE = /^[-•]\s+([\w-]+):\s+(.+?)\s*$/
const TIMESTAMP = /(-?\d{1,2}:\d{2}(?::\d{2})?(?:\.\d+)?)/
const PERCENT = /(-?\d+(?:\.\d+)?)\s*%/

export function parseStats(rawText: string): PreviewStats {
  const lines = rawText.split(/\r?\n/).map((l) => l.replace(/\s+$/, '')).filter((l) => l.trim())
  const stats: PreviewStats = { raw: lines }

  let section: string | null = null
  for (const line of lines) {
    const t = line.trim()
    const top = t.match(TOP_KEY)
    if (top) {
      section = top[1].toLowerCase()
      continue
    }
    const sub = t.match(SUB_LINE)
    if (!sub || !section) continue
    const subkey = sub[1].toLowerCase()
    const valueRaw = sub[2]

    if (section === 'length') {
      const ts = valueRaw.match(TIMESTAMP)
      if (ts) {
        const seconds = parseSeconds(ts[1])
        if (seconds != null) {
          if (subkey === 'input') stats.inputSeconds = Math.abs(seconds)
          else if (subkey === 'output') stats.outputSeconds = Math.abs(seconds)
        }
      }
      if (subkey === 'diff') {
        const pct = valueRaw.match(PERCENT)
        if (pct) stats.percentRemoved = Math.abs(parseFloat(pct[1]))
      }
    } else if (section === 'cuts' && subkey === 'amount') {
      const n = parseInt(valueRaw, 10)
      if (!Number.isNaN(n)) stats.cuts = n
    }
  }

  if (
    stats.percentRemoved == null &&
    stats.inputSeconds != null &&
    stats.outputSeconds != null &&
    stats.inputSeconds > 0
  ) {
    stats.percentRemoved = Math.max(
      0,
      ((stats.inputSeconds - stats.outputSeconds) / stats.inputSeconds) * 100
    )
  }

  return stats
}

function parseSeconds(value: string): number | null {
  const trimmed = value.trim()
  const sign = trimmed.startsWith('-') ? -1 : 1
  const body = trimmed.replace(/^[-+]/, '')

  const colonParts = body.match(/^(\d{1,2}):(\d{1,2})(?::(\d{1,2}(?:\.\d+)?))?$/)
  if (colonParts) {
    const a = Number(colonParts[1])
    const b = Number(colonParts[2])
    const c = colonParts[3] != null ? Number(colonParts[3]) : null
    if (c != null) return sign * (a * 3600 + b * 60 + c)
    return sign * (a * 60 + b)
  }
  const n = parseFloat(body)
  return Number.isNaN(n) ? null : sign * n
}
