#!/usr/bin/env node
// Copies platform-appropriate ffmpeg + ffprobe binaries from the
// ffmpeg-static / ffprobe-static npm packages into:
//   resources/bin/<slug>/    (electron-builder's ${platform}-${arch} shape)
//
// electron-builder's extraResources block bundles that folder into the
// produced .app / .exe so the rotation post-process, thumbnail extraction,
// and waveform analysis all work for end users without needing brew/PATH.

import { copyFile, chmod, mkdir, stat } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const require = createRequire(import.meta.url)

function defaultSlug() {
  const p = process.platform === 'win32' ? 'win' : process.platform
  return `${p}-${process.arch}`
}
const SLUG = process.argv[2] || defaultSlug()
const isWin = SLUG.startsWith('win')
const outDir = join(ROOT, 'resources', 'bin', SLUG)

async function copyTo(src, dstName) {
  await mkdir(outDir, { recursive: true })
  const dst = join(outDir, dstName)
  await copyFile(src, dst)
  if (!isWin) await chmod(dst, 0o755)
  const s = await stat(dst)
  console.log(`[fetch-ffmpeg] ${dstName}  ${(s.size / 1024 / 1024).toFixed(1)} MB`)
}

async function main() {
  let ffmpegPath
  let ffprobePath
  try {
    ffmpegPath = require('ffmpeg-static')
  } catch {
    console.warn('[fetch-ffmpeg] ffmpeg-static not installed; skipping')
  }
  try {
    const ffprobeMod = require('ffprobe-static')
    ffprobePath = typeof ffprobeMod === 'string' ? ffprobeMod : ffprobeMod.path
  } catch {
    console.warn('[fetch-ffmpeg] ffprobe-static not installed; skipping')
  }

  if (!ffmpegPath && !ffprobePath) {
    console.warn('[fetch-ffmpeg] nothing to copy')
    return
  }

  if (ffmpegPath) await copyTo(ffmpegPath, isWin ? 'ffmpeg.exe' : 'ffmpeg')
  if (ffprobePath) await copyTo(ffprobePath, isWin ? 'ffprobe.exe' : 'ffprobe')

  console.log('[fetch-ffmpeg] target:', outDir)
}

main().catch((err) => {
  console.error('[fetch-ffmpeg]', err)
  process.exit(1)
})
