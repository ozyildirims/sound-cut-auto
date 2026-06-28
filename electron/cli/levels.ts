import { spawn } from 'node:child_process'
import { statSync } from 'node:fs'
import { locateFfmpegTools } from './ffmpeg'

export interface AudioLevels {
  values: number[]
  totalPoints: number
  suggestedThreshold: number
}

interface CacheEntry {
  mtimeMs: number
  size: number
  data: AudioLevels
}

const CACHE = new Map<string, CacheEntry>()
const MAX_CACHE = 16

// Downsampled raw PCM target sample rate. Lower = faster decode + smaller pipe.
const SAMPLE_RATE = 8000
// Window for the per-frame RMS, in samples. 100 windows per second.
const WINDOW = 80

export async function probeLevels(
  _autoEditorBinary: string, // kept for backwards compatibility, no longer used
  filePath: string,
  maxPoints = 600
): Promise<AudioLevels> {
  const cached = readCache(filePath)
  if (cached) return cached

  const { ffmpeg } = locateFfmpegTools()
  if (!ffmpeg) {
    throw new Error('ffmpeg bulunamadı (resources/bin veya PATH).')
  }

  // Stream raw mono float32 PCM at SAMPLE_RATE. Video is skipped (-vn), so
  // even a 4K HEVC file decodes in seconds rather than minutes.
  const child = spawn(
    ffmpeg,
    [
      '-hide_banner',
      '-loglevel', 'error',
      '-i', filePath,
      '-vn',
      '-ac', '1',
      '-ar', String(SAMPLE_RATE),
      '-f', 'f32le',
      'pipe:1'
    ],
    { windowsHide: true }
  )

  return new Promise<AudioLevels>((resolve, reject) => {
    const chunks: Buffer[] = []
    let stderr = ''

    child.stdout.on('data', (chunk: Buffer) => chunks.push(chunk))
    child.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString('utf-8')
    })
    child.on('error', reject)
    child.on('close', (code) => {
      if (code !== 0 && chunks.length === 0) {
        return reject(new Error(`ffmpeg pcm pipe exit ${code}: ${stderr.slice(-200)}`))
      }
      try {
        const buf = Buffer.concat(chunks)
        const samples = new Float32Array(buf.buffer, buf.byteOffset, Math.floor(buf.byteLength / 4))
        const rms = computeRms(samples, WINDOW)
        const downsampled = peakDownsample(rms, maxPoints)
        const suggestedThreshold = suggestThreshold(rms)
        const data: AudioLevels = {
          values: downsampled,
          totalPoints: rms.length,
          suggestedThreshold
        }
        writeCache(filePath, data)
        resolve(data)
      } catch (err) {
        reject(err)
      }
    })
  })
}

function computeRms(samples: Float32Array, windowSize: number): number[] {
  if (samples.length === 0) return []
  const out: number[] = []
  for (let i = 0; i < samples.length; i += windowSize) {
    const end = Math.min(samples.length, i + windowSize)
    let sumSq = 0
    for (let j = i; j < end; j++) sumSq += samples[j] * samples[j]
    out.push(Math.sqrt(sumSq / (end - i)))
  }
  return out
}

function peakDownsample(arr: number[], target: number): number[] {
  if (arr.length === 0) return []
  if (arr.length <= target) return arr.slice()
  const out: number[] = []
  const step = arr.length / target
  for (let i = 0; i < target; i++) {
    const start = Math.floor(i * step)
    const end = Math.min(arr.length, Math.floor((i + 1) * step))
    let max = 0
    for (let j = start; j < end; j++) if (arr[j] > max) max = arr[j]
    out.push(max)
  }
  return out
}

function suggestThreshold(values: number[]): number {
  if (values.length === 0) return 0.04
  const sorted = values.slice().sort((a, b) => a - b)
  const p10 = sorted[Math.floor(sorted.length * 0.1)] ?? 0
  const p50 = sorted[Math.floor(sorted.length * 0.5)] ?? 0
  const p90 = sorted[Math.floor(sorted.length * 0.9)] ?? 0
  const guess = Math.max(p10 + (p50 - p10) * 0.6, p90 * 0.15)
  return clamp(guess, 0.005, 0.2)
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n))
}

function readCache(filePath: string): AudioLevels | null {
  const entry = CACHE.get(filePath)
  if (!entry) return null
  try {
    const s = statSync(filePath)
    if (s.mtimeMs === entry.mtimeMs && s.size === entry.size) return entry.data
  } catch {
    /* file gone; fall through */
  }
  CACHE.delete(filePath)
  return null
}

function writeCache(filePath: string, data: AudioLevels): void {
  try {
    const s = statSync(filePath)
    CACHE.set(filePath, { mtimeMs: s.mtimeMs, size: s.size, data })
    while (CACHE.size > MAX_CACHE) {
      // Drop the oldest insertion (Map preserves insertion order).
      const first = CACHE.keys().next().value
      if (first) CACHE.delete(first)
    }
  } catch {
    /* noop */
  }
}
