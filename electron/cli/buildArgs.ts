import type { AutoEditSettings, ExportFormat, JobMode } from '@shared/types'

export interface BuildArgsInput {
  filePath: string
  settings: AutoEditSettings
  mode: JobMode
  outputPath?: string
}

// Per-format auto-editor argv hints:
//   - autoEditorExportMode: maps to `-ex` (null = let auto-editor pick the
//     "default" behaviour — re-encode video into the container we ask for)
//   - extraArgs: codec / bitrate flags we tack on
const AUTO_EDITOR_EXPORT_MODE: Record<ExportFormat, string | null> = {
  'mp4-h264': null,
  'mp4-h265': null,
  'mov-h264': null,
  'mov-prores': null,
  'mkv-h264': null,
  'webm-vp9': null,
  'audio-m4a': null,
  'audio-mp3': null,
  'audio-wav': null,
  'premiere': 'premiere',
  'final-cut-pro': 'final-cut-pro',
  'resolve': 'resolve',
  'shotcut': 'shotcut',
  'json': 'json',
  'clip-sequence': 'clip-sequence',
  'default': null
}

const FORMAT_EXTRA_ARGS: Record<ExportFormat, string[]> = {
  'mp4-h264': [],
  'mp4-h265': ['-c:v', 'libx265', '-b:v', '6M'],
  'mov-h264': ['-c:v', 'libx264'],
  'mov-prores': ['-c:v', 'prores_ks', '-profile:v', '3', '-c:a', 'pcm_s16le'],
  'mkv-h264': ['-c:v', 'libx264'],
  'webm-vp9': ['-c:v', 'libvpx-vp9', '-b:v', '2M', '-c:a', 'libopus'],
  'audio-m4a': ['-vn'],
  'audio-mp3': ['-vn', '-c:a', 'libmp3lame', '-b:a', '192k'],
  'audio-wav': ['-vn', '-c:a', 'pcm_s16le'],
  'premiere': [],
  'final-cut-pro': [],
  'resolve': [],
  'shotcut': [],
  'json': [],
  'clip-sequence': [],
  'default': []
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
    const fmt = settings.exportFormat
    const exMode = AUTO_EDITOR_EXPORT_MODE[fmt]
    if (exMode) args.push('-ex', exMode)
    const extras = FORMAT_EXTRA_ARGS[fmt] ?? []
    for (const a of extras) args.push(a)
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
  return Number(n.toFixed(4)).toString()
}
