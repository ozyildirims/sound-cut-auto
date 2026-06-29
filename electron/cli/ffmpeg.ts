import fs from 'node:fs'
import path from 'node:path'
import { spawn, spawnSync } from 'node:child_process'
import { app } from 'electron'
import { getResourcesBinDir, platformSlug } from '../util/paths'

function findOnPath(cmd: string): string | null {
  const isWin = process.platform === 'win32'
  const result = spawnSync(isWin ? 'where' : 'which', [cmd], { encoding: 'utf-8' })
  if (result.status === 0) {
    const line = result.stdout.split(/\r?\n/).map((l) => l.trim()).find(Boolean)
    if (line && fs.existsSync(line)) return line
  }
  return null
}

function findInResources(cmd: string): string | null {
  const exe = process.platform === 'win32' ? `${cmd}.exe` : cmd
  const candidate = path.join(getResourcesBinDir(), platformSlug(), exe)
  return fs.existsSync(candidate) ? candidate : null
}

function findInBundledApps(cmd: string): string | null {
  // dev convenience: borrow from a known sibling app if present.
  // On Mac autocut.app ships ffmpeg/ffprobe; otherwise nothing.
  if (process.platform !== 'darwin') return null
  const candidate = `/Applications/autocut.app/Contents/MacOS/${cmd}`
  return fs.existsSync(candidate) ? candidate : null
}

let cached: { ffmpeg: string | null; ffprobe: string | null } | null = null

export function locateFfmpegTools(): { ffmpeg: string | null; ffprobe: string | null } {
  if (cached) return cached
  cached = {
    ffmpeg: findInResources('ffmpeg') || findOnPath('ffmpeg') || findInBundledApps('ffmpeg'),
    ffprobe: findInResources('ffprobe') || findOnPath('ffprobe') || findInBundledApps('ffprobe')
  }
  return cached
}

export interface VideoProbe {
  rotation: number
}

export function probeRotation(filePath: string): VideoProbe {
  const { ffprobe } = locateFfmpegTools()
  if (!ffprobe) return { rotation: 0 }
  const result = spawnSync(
    ffprobe,
    ['-v', 'error', '-select_streams', 'v:0', '-show_streams', filePath],
    { encoding: 'utf-8', timeout: 10000 }
  )
  if (result.status !== 0) return { rotation: 0 }

  const text = result.stdout
  let rotation = 0
  const m1 = text.match(/^rotation=(-?\d+(?:\.\d+)?)/m)
  if (m1) rotation = Math.round(parseFloat(m1[1]))
  else {
    const m2 = text.match(/^TAG:rotate=(-?\d+)/m)
    if (m2) rotation = parseInt(m2[1], 10)
  }
  if (Number.isNaN(rotation)) rotation = 0
  // normalize to (-180, 180]
  rotation = ((rotation % 360) + 540) % 360 - 180
  return { rotation }
}

export function applyRotationMetadata(
  filePath: string,
  rotationDegrees: number
): Promise<void> {
  const { ffmpeg } = locateFfmpegTools()
  if (!ffmpeg || rotationDegrees === 0) return Promise.resolve()

  return new Promise((resolve, reject) => {
    const tmp = filePath + '.rotated.tmp' + path.extname(filePath)
    const args = [
      '-y',
      '-loglevel', 'error',
      '-i', filePath,
      '-c', 'copy',
      '-metadata:s:v:0', `rotate=${rotationDegrees}`,
      tmp
    ]
    const child = spawn(ffmpeg, args, { windowsHide: true })
    let stderr = ''
    child.stderr?.on('data', (chunk) => {
      stderr += chunk.toString('utf-8')
    })
    child.on('error', reject)
    child.on('close', (code) => {
      if (code !== 0) {
        try { fs.unlinkSync(tmp) } catch { /* noop */ }
        return reject(new Error(`ffmpeg rotation fix failed (${code}): ${stderr.slice(-300)}`))
      }
      try {
        fs.renameSync(tmp, filePath)
        resolve()
      } catch (err) {
        reject(err)
      }
    })
  })
}

export function probeDuration(filePath: string): number | null {
  const { ffprobe } = locateFfmpegTools()
  if (!ffprobe) return null
  const result = spawnSync(
    ffprobe,
    [
      '-v', 'error',
      '-show_entries', 'format=duration',
      '-of', 'default=noprint_wrappers=1:nokey=1',
      filePath
    ],
    { encoding: 'utf-8', timeout: 10000 }
  )
  if (result.status !== 0) return null
  const n = parseFloat(result.stdout.trim())
  return Number.isFinite(n) ? n : null
}

export function extractThumbnail(filePath: string, atSeconds = 0.5, width = 160): string | null {
  const { ffmpeg } = locateFfmpegTools()
  if (!ffmpeg) return null
  const result = spawnSync(
    ffmpeg,
    [
      '-loglevel', 'error',
      // -ss before -i is the "fast seek" path: ffmpeg jumps to the
      // nearest keyframe and decodes from there. Less precise than
      // post-input -ss, but ~10× faster on long HEVC files — good
      // tradeoff for a live scrub UI.
      '-ss', String(atSeconds),
      '-i', filePath,
      '-vframes', '1',
      '-vf', `scale=${width}:-1`,
      '-f', 'image2pipe',
      '-c:v', 'mjpeg',
      '-q:v', '5',
      '-'
    ],
    { encoding: 'buffer', timeout: 15000, maxBuffer: 16 * 1024 * 1024 }
  )
  if (result.status !== 0 || !result.stdout || result.stdout.length === 0) return null
  return 'data:image/jpeg;base64,' + Buffer.from(result.stdout).toString('base64')
}

export interface MediaInfo {
  durationSeconds: number | null
  thumbnailDataUrl: string | null
  rotation: number
}

export function probeMedia(filePath: string): MediaInfo {
  return {
    durationSeconds: probeDuration(filePath),
    thumbnailDataUrl: extractThumbnail(filePath),
    rotation: probeRotation(filePath).rotation
  }
}

// ── Preview proxy ─────────────────────────────────────────────────────────
// Renderer-side <video> can't reliably play HEVC (codec license) and even
// h264 sometimes chokes through our custom local-media:// scheme because of
// Range-header semantics. We sidestep both by transcoding each imported
// file to a tiny 720p h264 mp4 once on import and pointing the player at
// that. The original file is still what auto-editor cuts, so quality is
// preserved.

import { createHash } from 'node:crypto'
import { mkdirSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'

let _proxyDir: string | null = null
export function getProxyDir(): string {
  if (_proxyDir) return _proxyDir
  // app.getPath('userData') is the obvious home but isn't available before
  // app is ready; defer if needed and cache.
  try {
    _proxyDir = path.join(app.getPath('userData'), 'proxies')
  } catch {
    _proxyDir = path.join(tmpdir(), 'sound-cut-auto-proxies')
  }
  mkdirSync(_proxyDir, { recursive: true })
  return _proxyDir
}

function proxyKeyFor(filePath: string): string {
  try {
    const s = statSync(filePath)
    return createHash('sha1')
      .update(`${filePath}|${s.size}|${s.mtimeMs}`)
      .digest('hex')
      .slice(0, 20)
  } catch {
    return createHash('sha1').update(filePath).digest('hex').slice(0, 20)
  }
}

export function getProxyPath(filePath: string): string {
  return path.join(getProxyDir(), proxyKeyFor(filePath) + '.mp4')
}

export function ensureProxy(filePath: string): Promise<string> {
  const out = getProxyPath(filePath)
  if (fs.existsSync(out)) {
    try {
      if (statSync(out).size > 1024) return Promise.resolve(out)
    } catch { /* fall through to regenerate */ }
  }

  const { ffmpeg } = locateFfmpegTools()
  if (!ffmpeg) return Promise.reject(new Error('ffmpeg bulunamadı (proxy üretemedim)'))

  return new Promise<string>((resolve, reject) => {
    const tmp = out + '.tmp.mp4'
    const args = [
      '-y',
      '-loglevel', 'error',
      '-i', filePath,
      '-vf', 'scale=-2:720',
      '-c:v', 'libx264',
      '-preset', 'ultrafast',
      '-crf', '28',
      '-c:a', 'aac',
      '-b:a', '96k',
      '-movflags', '+faststart',
      tmp
    ]
    const child = spawn(ffmpeg, args, { windowsHide: true })
    let stderr = ''
    child.stderr?.on('data', (c) => { stderr += c.toString('utf-8') })
    child.on('error', reject)
    child.on('close', (code) => {
      if (code !== 0) {
        try { fs.unlinkSync(tmp) } catch { /* noop */ }
        return reject(new Error(`proxy transcode failed (${code}): ${stderr.slice(-300)}`))
      }
      try {
        fs.renameSync(tmp, out)
        resolve(out)
      } catch (err) {
        reject(err)
      }
    })
  })
}

// ── Social pass ──────────────────────────────────────────────────────────
// Aspect ratio reframe + loudness normalization done in a single re-encode
// (we re-encode anyway, so combining the work avoids a second video pass).

import type { AspectMode } from '@shared/types'

export interface SocialPassOptions {
  aspect: { mode: Exclude<AspectMode, 'none'>; width: number; height: number } | null
  loudness: { target: number } | null
}

interface LoudnormMeasured {
  I: number; TP: number; LRA: number; threshold: number; offset: number
}

function buildAspectFilter(opts: SocialPassOptions['aspect']): string | null {
  if (!opts) return null
  const { mode, width, height } = opts
  if (mode === 'crop-center') {
    return `scale=w=if(gt(a\\,${width}/${height})\\,-2\\,${width}):h=if(gt(a\\,${width}/${height})\\,${height}\\,-2),crop=${width}:${height}`
  }
  // blur-pad: blurred scaled background fills the frame, original video centered on top
  return `split=2[bg][fg];[bg]scale=${width}:${height}:force_original_aspect_ratio=increase,crop=${width}:${height},boxblur=20:1[bgb];[fg]scale=${width}:-2:force_original_aspect_ratio=decrease[fgs];[bgb][fgs]overlay=(W-w)/2:(H-h)/2`
}

function parseLoudnormJson(stderr: string): LoudnormMeasured | null {
  // ffmpeg prints JSON to stderr after `[Parsed_loudnorm_…] {…}`. Find the last
  // brace-delimited block and parse it.
  const start = stderr.lastIndexOf('{')
  const end = stderr.lastIndexOf('}')
  if (start === -1 || end === -1 || end < start) return null
  try {
    const parsed = JSON.parse(stderr.slice(start, end + 1))
    return {
      I: Number(parsed.input_i),
      TP: Number(parsed.input_tp),
      LRA: Number(parsed.input_lra),
      threshold: Number(parsed.input_thresh),
      offset: Number(parsed.target_offset)
    }
  } catch {
    return null
  }
}

function measureLoudness(filePath: string, target: number): Promise<LoudnormMeasured | null> {
  const { ffmpeg } = locateFfmpegTools()
  if (!ffmpeg) return Promise.resolve(null)
  return new Promise((resolve) => {
    const args = [
      '-hide_banner', '-nostats',
      '-i', filePath,
      '-af', `loudnorm=I=${target}:LRA=11:TP=-1.5:print_format=json`,
      '-f', 'null', '-'
    ]
    const child = spawn(ffmpeg, args, { windowsHide: true })
    let stderr = ''
    child.stderr?.on('data', (c) => { stderr += c.toString('utf-8') })
    child.on('error', () => resolve(null))
    child.on('close', () => resolve(parseLoudnormJson(stderr)))
  })
}

export async function applySocialPass(
  filePath: string,
  opts: SocialPassOptions
): Promise<void> {
  const { ffmpeg } = locateFfmpegTools()
  if (!ffmpeg) throw new Error('ffmpeg bulunamadı (sosyal medya post-process için sidecar gerekli)')
  if (!opts.aspect && !opts.loudness) return

  // 1. Loudness pass 1: measure
  let measured: LoudnormMeasured | null = null
  if (opts.loudness) {
    measured = await measureLoudness(filePath, opts.loudness.target)
  }

  // 2. Build encode args
  const aspectFilter = buildAspectFilter(opts.aspect)
  const videoArgs: string[] = []
  if (aspectFilter) {
    videoArgs.push('-vf', aspectFilter)
  }

  const audioArgs: string[] = []
  if (opts.loudness && measured) {
    const target = opts.loudness.target
    const measuredArgs = [
      `I=${target}`, 'LRA=11', 'TP=-1.5',
      `measured_I=${measured.I}`,
      `measured_TP=${measured.TP}`,
      `measured_LRA=${measured.LRA}`,
      `measured_thresh=${measured.threshold}`,
      `offset=${measured.offset}`,
      'linear=true',
      'print_format=summary'
    ].join(':')
    audioArgs.push('-af', `loudnorm=${measuredArgs}`)
  } else if (opts.loudness) {
    // Fall back to a single-pass loudnorm if measurement failed
    audioArgs.push('-af', `loudnorm=I=${opts.loudness.target}:LRA=11:TP=-1.5`)
  }

  return new Promise<void>((resolve, reject) => {
    const tmp = filePath + '.social.tmp' + path.extname(filePath)
    const args = [
      '-y',
      '-loglevel', 'error',
      '-i', filePath,
      ...videoArgs,
      ...audioArgs,
      '-c:v', 'libx264',
      '-preset', 'medium',
      '-crf', '20',
      '-pix_fmt', 'yuv420p',
      '-movflags', '+faststart',
      '-c:a', 'aac',
      '-b:a', '192k',
      tmp
    ]
    const child = spawn(ffmpeg, args, { windowsHide: true })
    let stderr = ''
    child.stderr?.on('data', (c) => { stderr += c.toString('utf-8') })
    child.on('error', reject)
    child.on('close', (code) => {
      if (code !== 0) {
        try { fs.unlinkSync(tmp) } catch { /* noop */ }
        return reject(new Error(`ffmpeg social pass failed (${code}): ${stderr.slice(-400)}`))
      }
      try {
        fs.renameSync(tmp, filePath)
        resolve()
      } catch (err) {
        reject(err)
      }
    })
  })
}

// Cover frame extracted as a sibling .jpg next to the exported video
export function extractCoverJpeg(
  filePath: string,
  timeSeconds: number,
  outPath: string,
  width = 1080
): Promise<void> {
  const { ffmpeg } = locateFfmpegTools()
  if (!ffmpeg) return Promise.reject(new Error('ffmpeg bulunamadı'))
  return new Promise((resolve, reject) => {
    const args = [
      '-y',
      '-loglevel', 'error',
      '-ss', String(timeSeconds),
      '-i', filePath,
      '-vframes', '1',
      '-vf', `scale=${width}:-2`,
      '-q:v', '2',
      outPath
    ]
    const child = spawn(ffmpeg, args, { windowsHide: true })
    let stderr = ''
    child.stderr?.on('data', (c) => { stderr += c.toString('utf-8') })
    child.on('error', reject)
    child.on('close', (code) => {
      if (code !== 0) {
        return reject(new Error(`ffmpeg cover extract failed (${code}): ${stderr.slice(-200)}`))
      }
      resolve()
    })
  })
}

// app reference kept so this module can be imported safely before app ready
void app
