export type ExportFormat =
  // Video — container × codec
  | 'mp4-h264'
  | 'mp4-h265'
  | 'mov-h264'
  | 'mov-prores'      // After Effects / FCP for color/grading
  | 'mkv-h264'
  | 'webm-vp9'
  // Audio only
  | 'audio-m4a'
  | 'audio-mp3'
  | 'audio-wav'
  // Timeline interchange
  | 'premiere'
  | 'final-cut-pro'
  | 'resolve'
  | 'shotcut'
  | 'json'
  // Clip sequence (a folder of trimmed clips)
  | 'clip-sequence'
  // Legacy alias preserved so persisted settings from old builds still resolve
  | 'default'

export interface ExportFormatSpec {
  value: ExportFormat
  group: 'video' | 'audio' | 'timeline' | 'sequence'
  label: string
  description: string
}

export const EXPORT_FORMATS: ExportFormatSpec[] = [
  { value: 'mp4-h264',     group: 'video',    label: 'MP4 (H.264)',          description: 'En yaygın · sosyal medya, web, telefon' },
  { value: 'mp4-h265',     group: 'video',    label: 'MP4 (H.265/HEVC)',     description: 'Yarı boyut, modern cihazlar' },
  { value: 'mov-h264',     group: 'video',    label: 'MOV (H.264)',          description: 'Apple araçları için QuickTime' },
  { value: 'mov-prores',   group: 'video',    label: 'MOV (ProRes 422)',     description: 'After Effects / FCP renk çalışması' },
  { value: 'mkv-h264',     group: 'video',    label: 'MKV (H.264)',          description: 'Açık konteyner' },
  { value: 'webm-vp9',     group: 'video',    label: 'WebM (VP9)',           description: 'Web / open codec' },
  { value: 'audio-m4a',    group: 'audio',    label: 'Sadece ses — M4A',     description: 'AAC, küçük boyut' },
  { value: 'audio-mp3',    group: 'audio',    label: 'Sadece ses — MP3',     description: 'Evrensel ses formatı' },
  { value: 'audio-wav',    group: 'audio',    label: 'Sadece ses — WAV',     description: 'Sıkıştırmasız, max kalite' },
  { value: 'premiere',     group: 'timeline', label: 'Premiere Pro XML',     description: 'Premiere Pro\'ya import' },
  { value: 'final-cut-pro',group: 'timeline', label: 'Final Cut Pro XML',    description: 'FCP XML formatı' },
  { value: 'resolve',      group: 'timeline', label: 'DaVinci Resolve XML',  description: 'Resolve XML' },
  { value: 'shotcut',      group: 'timeline', label: 'Shotcut MLT',          description: 'Shotcut proje' },
  { value: 'json',         group: 'timeline', label: 'JSON timeline',        description: 'auto-editor JSON v3' },
  { value: 'clip-sequence',group: 'sequence', label: 'Klip sırası (klasör)', description: 'Her cut ayrı dosya' }
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
  exportFormat: 'mp4-h264',
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
  proxyPath?: string          // 720p h264 transcoded proxy that the player loads
  proxyState?: 'idle' | 'pending' | 'ready' | 'failed'
  proxyError?: string
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
