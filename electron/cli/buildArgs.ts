import type { AutoEditSettings, JobMode } from '@shared/types'

export interface BuildArgsInput {
  filePath: string
  settings: AutoEditSettings
  mode: JobMode
  outputPath?: string
}

export function buildArgs({ filePath, settings, mode, outputPath }: BuildArgsInput): string[] {
  const args: string[] = [filePath]

  const threshold = clamp01(settings.thresholdAudio)
  args.push('--edit', `audio:threshold=${formatNumber(threshold)}`)

  if (settings.margin && settings.margin.trim()) {
    args.push('-m', settings.margin.trim())
  }

  if (settings.smoothEnabled) {
    const mincut = settings.smoothMincut?.trim() || '0.2s'
    const minclip = settings.smoothMinclip?.trim() || '0.1s'
    args.push('--smooth', `${mincut},${minclip}`)
  } else {
    args.push('--smooth', '0')
  }

  if (mode === 'preview') {
    args.push('--preview')
  } else {
    if (settings.exportFormat && settings.exportFormat !== 'default') {
      args.push('-ex', settings.exportFormat)
    }
    if (outputPath) {
      args.push('-o', outputPath)
    }
  }

  args.push('--progress', 'machine')
  args.push('--no-open')

  return args
}

function clamp01(n: number): number {
  if (Number.isNaN(n)) return 0.04
  return Math.min(1, Math.max(0, n))
}

function formatNumber(n: number): string {
  // auto-editor accepts e.g. 0.04 — keep up to 4 decimals, strip trailing zeros
  return Number(n.toFixed(4)).toString()
}
