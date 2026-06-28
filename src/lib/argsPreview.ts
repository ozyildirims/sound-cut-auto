import type { AutoEditSettings, JobMode } from '@shared/types'

export function previewArgs(opts: {
  filePath: string | null
  settings: AutoEditSettings
  mode: JobMode
  outputPath?: string | null
}): string {
  const parts: string[] = ['auto-editor']
  if (opts.filePath) parts.push(shellQuote(opts.filePath))
  else parts.push('<input>')

  parts.push('--edit', `audio:threshold=${opts.settings.thresholdAudio}`)
  if (opts.settings.margin) parts.push('-m', opts.settings.margin)
  if (opts.settings.smoothEnabled) {
    parts.push('--smooth', `${opts.settings.smoothMincut},${opts.settings.smoothMinclip}`)
  } else {
    parts.push('--smooth', '0')
  }

  if (opts.mode === 'preview') {
    parts.push('--preview')
  } else {
    if (opts.settings.exportFormat && opts.settings.exportFormat !== 'default') {
      parts.push('-ex', opts.settings.exportFormat)
    }
    if (opts.outputPath) parts.push('-o', shellQuote(opts.outputPath))
  }

  parts.push('--progress', 'machine')
  parts.push('--no-open')
  return parts.join(' ')
}

function shellQuote(s: string): string {
  if (/^[\w./-]+$/.test(s)) return s
  return `"${s.replace(/"/g, '\\"')}"`
}
