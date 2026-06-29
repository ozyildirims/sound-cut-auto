export type ExportFormat =
  | 'default'
  | 'premiere'
  | 'final-cut-pro'
  | 'resolve'
  | 'shotcut'
  | 'json'
  | 'audio'
  | 'clip-sequence'

export const EXPORT_FORMATS: { value: ExportFormat; label: string; description: string }[] = [
  { value: 'default', label: 'Video (mp4/mov)', description: 'Standart yeniden kodlanmış video çıktısı' },
  { value: 'premiere', label: 'Premiere Pro XML', description: 'Premiere Pro\'ya import edilebilir timeline XML' },
  { value: 'final-cut-pro', label: 'Final Cut Pro XML', description: 'FCP XML formatı' },
  { value: 'resolve', label: 'DaVinci Resolve XML', description: 'Resolve XML formatı' },
  { value: 'shotcut', label: 'Shotcut MLT', description: 'Shotcut MLT proje formatı' },
  { value: 'json', label: 'JSON timeline', description: 'auto-editor JSON v3 timeline' },
  { value: 'audio', label: 'Audio only', description: 'Sadece ses (m4a/mp3)' },
  { value: 'clip-sequence', label: 'Clip sequence', description: 'Her klip ayrı dosya olarak' }
]

export type SocialPreset = 'instagram-reel' | 'tiktok' | 'youtube-shorts'
export type AspectMode = 'none' | 'crop-center' | 'blur-pad'

export interface SocialPresetSpec {
  id: SocialPreset
  label: string
  shortLabel: string
  maxSeconds: number
  outputWidth: number
  outputHeight: number
  recommendedLoudness: number
}

export const SOCIAL_PRESETS: SocialPresetSpec[] = [
  { id: 'instagram-reel', label: 'Instagram Reel', shortLabel: 'Reel', maxSeconds: 180, outputWidth: 1080, outputHeight: 1920, recommendedLoudness: -14 },
  { id: 'tiktok',         label: 'TikTok',         shortLabel: 'TikTok', maxSeconds: 600, outputWidth: 1080, outputHeight: 1920, recommendedLoudness: -14 },
  { id: 'youtube-shorts', label: 'YouTube Shorts', shortLabel: 'Shorts', maxSeconds: 60,  outputWidth: 1080, outputHeight: 1920, recommendedLoudness: -14 }
]

export function getSocialPreset(id: SocialPreset | null | undefined): SocialPresetSpec | null {
  if (!id) return null
  return SOCIAL_PRESETS.find((p) => p.id === id) ?? null
}

export interface AutoEditSettings {
  thresholdAudio: number
  margin: string
  smoothMincut: string
  smoothMinclip: string
  smoothEnabled: boolean
  exportFormat: ExportFormat
  outputDir: string | null
  devShowCommand: boolean
  // Social media layer (all optional, backward compat)
  socialPreset?: SocialPreset | null
  aspectMode?: AspectMode
  loudnessTarget?: number | null   // LUFS, null = off
  exportCover?: boolean
}

export const DEFAULT_SETTINGS: AutoEditSettings = {
  thresholdAudio: 0.04,
  margin: '0.2s',
  smoothMincut: '0.2s',
  smoothMinclip: '0.1s',
  smoothEnabled: true,
  exportFormat: 'default',
  outputDir: null,
  devShowCommand: false,
  socialPreset: null,
  aspectMode: 'none',
  loudnessTarget: null,
  exportCover: false
}

export interface VideoFile {
  id: string
  path: string
  name: string
  sizeBytes: number
  addedAt: number
  durationSeconds?: number
  thumbnailDataUrl?: string
  settingsOverride?: Partial<AutoEditSettings>
  coverTimeSeconds?: number   // social cover frame target; null → duration * 0.1 fallback
}

export interface Preset {
  id: string
  label: string
  description: string
  settings: Pick<AutoEditSettings, 'thresholdAudio' | 'margin' | 'smoothMincut' | 'smoothMinclip' | 'smoothEnabled'>
}

export const PRESETS: Preset[] = [
  {
    id: 'talking-head',
    label: 'Konuşan kafa',
    description: 'Tek konuşmacılı vlog / monolog. Doğal pausları korur.',
    settings: { thresholdAudio: 0.04, margin: '0.25s', smoothMincut: '0.2s', smoothMinclip: '0.12s', smoothEnabled: true }
  },
  {
    id: 'tutorial',
    label: 'Tutorial / Eğitim',
    description: 'Ekran kaydı + ses; uzun durakları agresif keser.',
    settings: { thresholdAudio: 0.07, margin: '0.15s', smoothMincut: '0.15s', smoothMinclip: '0.08s', smoothEnabled: true }
  },
  {
    id: 'podcast',
    label: 'Podcast',
    description: 'Çok konuşmacı, doğal akış; sadece uzun sessizlikleri keser.',
    settings: { thresholdAudio: 0.03, margin: '0.35s', smoothMincut: '0.3s', smoothMinclip: '0.2s', smoothEnabled: true }
  },
  {
    id: 'aggressive',
    label: 'Çok agresif',
    description: 'Her küçük durağı keser. Kısa içerikler için.',
    settings: { thresholdAudio: 0.12, margin: '0.1s', smoothMincut: '0.1s', smoothMinclip: '0.05s', smoothEnabled: true }
  }
]

export type CliSource = 'sidecar' | 'path' | 'override' | 'none'

export interface CliStatus {
  found: boolean
  path: string | null
  version: string | null
  source: CliSource
  error?: string
}

export type JobMode = 'preview' | 'export'
export type JobStatus = 'queued' | 'running' | 'completed' | 'cancelled' | 'failed'
export type JobPhase = 'starting' | 'analyzing' | 'rendering' | 'muxing' | 'done' | 'unknown'

export interface Job {
  id: string
  mode: JobMode
  filePath: string
  fileName: string
  status: JobStatus
  phase: JobPhase
  current: number
  total: number
  ratio: number
  startedAt: number
  endedAt?: number
  outputPath?: string
  exitCode?: number
  errorMessage?: string
}

export interface PreviewStats {
  inputSeconds?: number
  outputSeconds?: number
  percentRemoved?: number
  cuts?: number
  raw: string[]
}

export type JobEvent =
  | { type: 'progress'; jobId: string; phase: JobPhase; current: number; total: number; ratio: number }
  | { type: 'stats'; jobId: string; stats: PreviewStats }
  | { type: 'log'; jobId: string; stream: 'stdout' | 'stderr'; line: string }
  | { type: 'exit'; jobId: string; status: JobStatus; exitCode: number | null; signal: string | null; errorMessage?: string }

export interface StartJobInput {
  mode: JobMode
  filePath: string
  settings: AutoEditSettings
  outputPath?: string
  coverTimeSeconds?: number   // user-selected; null/undefined → fallback duration*0.1 in main
}
