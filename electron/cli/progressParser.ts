import type { JobPhase } from '@shared/types'

export interface ParsedProgress {
  phase: JobPhase
  current: number
  total: number
  ratio: number
}

// auto-editor v30 `--progress machine` emits two kinds of lines:
//   "Starting"   (a phase label, alphanumeric word possibly padded)
//   "(mp4) h264+aac~57.0~1928.0~11.81"  (container/codec ~ current ~ total ~ eta_seconds)

const PHASE_LINE = /^([A-Z][A-Za-z_-]+)\s*$/
const PROGRESS_LINE = /\(([\w.+-]+)\)[^~]*~\s*(-?\d+(?:\.\d+)?)\s*~\s*(\d+(?:\.\d+)?)\s*~\s*(-?\d+(?:\.\d+)?)/

const PHASE_MAP: Record<string, JobPhase> = {
  starting: 'starting',
  analyzing: 'analyzing',
  analysing: 'analyzing',
  cutting: 'analyzing',
  rendering: 'rendering',
  render: 'rendering',
  muxing: 'muxing',
  done: 'done'
}

export class ProgressParser {
  private currentPhase: JobPhase = 'starting'

  parse(line: string): ParsedProgress | null {
    const trimmed = line.trim()
    if (!trimmed) return null

    const phaseMatch = trimmed.match(PHASE_LINE)
    if (phaseMatch) {
      const key = phaseMatch[1].toLowerCase()
      const mapped = PHASE_MAP[key]
      if (mapped) {
        this.currentPhase = mapped
      } else if (this.currentPhase === 'starting') {
        this.currentPhase = 'unknown'
      }
      return null
    }

    const m = trimmed.match(PROGRESS_LINE)
    if (!m) return null

    const current = Number(m[2])
    const total = Number(m[3])
    if (Number.isNaN(current) || Number.isNaN(total) || total <= 0) return null

    return {
      phase: this.currentPhase === 'starting' ? 'rendering' : this.currentPhase,
      current: Math.max(0, current),
      total,
      ratio: Math.min(1, Math.max(0, current / total))
    }
  }
}

export class ProgressEmitter {
  private last: ParsedProgress | null = null
  private timer: NodeJS.Timeout | null = null
  constructor(
    private readonly emit: (p: ParsedProgress) => void,
    private readonly bucketMs = 50
  ) {}

  push(p: ParsedProgress): void {
    this.last = p
    if (this.timer) return
    this.timer = setTimeout(() => {
      this.timer = null
      if (this.last) {
        const payload = this.last
        this.last = null
        this.emit(payload)
      }
    }, this.bucketMs)
  }

  flush(): void {
    if (this.timer) {
      clearTimeout(this.timer)
      this.timer = null
    }
    if (this.last) {
      const payload = this.last
      this.last = null
      this.emit(payload)
    }
  }
}
