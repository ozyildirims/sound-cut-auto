#!/usr/bin/env node
// Downloads the auto-editor standalone binary for the host platform/arch
// into resources/bin/<slug>/ where <slug> matches electron-builder's
// ${platform}-${arch} interpolation (darwin-arm64, darwin-x64, win-x64,
// win-arm64, linux-x64, linux-arm64) so the extraResources bundle picks
// it up correctly.
//
// WyattBlue ships *single-binary* assets (no archive) named:
//   auto-editor-macos-arm64        (Apple Silicon)
//   auto-editor-macos-x86_64       (Intel Mac)
//   auto-editor-windows-x86_64.exe (Windows x64)
//   auto-editor-windows-aarch64.exe(Windows ARM64)
//   auto-editor-linux-x86_64       (Linux)
//   auto-editor-linux-aarch64      (Linux ARM64)

import { createWriteStream, existsSync, chmodSync, statSync } from 'node:fs'
import { mkdir } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { pipeline } from 'node:stream/promises'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')

const PIN_TAG = process.env.AUTO_EDITOR_TAG || '31.0.2'

// Normalize Node's process.platform to electron-builder's slug shape
// (win32 → win). Caller can also pass an explicit slug as argv[2].
function defaultSlug() {
  const p = process.platform === 'win32' ? 'win' : process.platform
  return `${p}-${process.arch}`
}
const SLUG = process.argv[2] || defaultSlug()

const ASSET_MAP = {
  'darwin-arm64': 'auto-editor-macos-arm64',
  'darwin-x64': 'auto-editor-macos-x86_64',
  'win-x64': 'auto-editor-windows-x86_64.exe',
  'win-arm64': 'auto-editor-windows-aarch64.exe',
  'linux-x64': 'auto-editor-linux-x86_64',
  'linux-arm64': 'auto-editor-linux-aarch64'
}

async function main() {
  const asset = ASSET_MAP[SLUG]
  if (!asset) {
    console.warn(`[fetch-auto-editor] no published binary for ${SLUG}; skipping`)
    return
  }

  const outDir = join(ROOT, 'resources', 'bin', SLUG)
  await mkdir(outDir, { recursive: true })

  const isWin = SLUG.startsWith('win')
  const binaryName = isWin ? 'auto-editor.exe' : 'auto-editor'
  const binaryPath = join(outDir, binaryName)
  if (existsSync(binaryPath)) {
    console.log(`[fetch-auto-editor] ${binaryPath} already present`)
    return
  }

  const url = `https://github.com/WyattBlue/auto-editor/releases/download/${PIN_TAG}/${asset}`
  console.log(`[fetch-auto-editor] downloading ${url}`)

  const res = await fetch(url, { redirect: 'follow' })
  if (!res.ok || !res.body) {
    console.warn(
      `[fetch-auto-editor] download failed (${res.status}). The app will fall back to PATH/manual lookup at runtime.`
    )
    return
  }
  await pipeline(res.body, createWriteStream(binaryPath))

  if (!isWin) chmodSync(binaryPath, 0o755)
  const size = statSync(binaryPath).size
  console.log(`[fetch-auto-editor] ready: ${binaryPath} (${(size / 1024 / 1024).toFixed(1)} MB)`)
}

main().catch((err) => {
  console.error('[fetch-auto-editor] error:', err)
  process.exit(1)
})
