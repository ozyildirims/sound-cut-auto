import fs from 'node:fs'
import path from 'node:path'
import { spawn, spawnSync } from 'node:child_process'
import { app } from 'electron'
import { getResourcesBinDir } from '../util/paths'

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
  const platform = process.platform
  const arch = process.arch
  const exe = platform === 'win32' ? `${cmd}.exe` : cmd
  const candidate = path.join(getResourcesBinDir(), `${platform}-${arch}`, exe)
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

// app reference kept so this module can be imported safely before app ready
void app
