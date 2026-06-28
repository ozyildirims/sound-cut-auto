#!/usr/bin/env node
// Downloads the auto-editor standalone binary for the host platform/arch
// into resources/bin/<platform>-<arch>/ so electron-builder can package it
// as a sidecar via extraResources.
//
// Strategy: we pin a release tag in PIN_TAG. For each host platform we know
// the asset filename pattern WyattBlue ships. If the host platform isn't
// covered, we exit 0 with a warning so dev installs can continue without it
// (the app will fall back to PATH/manual lookup).
//
// You can override the tag via env: AUTO_EDITOR_TAG=v30.5.0 node scripts/fetch-auto-editor.mjs

import { createWriteStream, existsSync, mkdirSync, chmodSync, statSync } from 'node:fs'
import { mkdir } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { pipeline } from 'node:stream/promises'
import { fileURLToPath } from 'node:url'
import { execSync, spawnSync } from 'node:child_process'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')

const PIN_TAG = process.env.AUTO_EDITOR_TAG || '30.5.0'
const TARGET = process.argv[2] || `${process.platform}-${process.arch}`

const ASSET_MAP = {
  // WyattBlue's release filenames. Update when upstream changes.
  'darwin-arm64': `auto-editor-darwin-arm64.tar.gz`,
  'darwin-x64': `auto-editor-darwin-x64.tar.gz`,
  'win32-x64': `auto-editor-win32-x64.zip`
}

async function main() {
  const asset = ASSET_MAP[TARGET]
  if (!asset) {
    console.warn(`[fetch-auto-editor] no published binary for ${TARGET}; skipping`)
    return
  }

  const outDir = join(ROOT, 'resources', 'bin', TARGET)
  await mkdir(outDir, { recursive: true })

  const binaryName = TARGET.startsWith('win32') ? 'auto-editor.exe' : 'auto-editor'
  const binaryPath = join(outDir, binaryName)
  if (existsSync(binaryPath)) {
    console.log(`[fetch-auto-editor] ${binaryPath} already present`)
    return
  }

  const url = `https://github.com/WyattBlue/auto-editor/releases/download/${PIN_TAG}/${asset}`
  const archivePath = join(outDir, asset)
  console.log(`[fetch-auto-editor] downloading ${url}`)

  const res = await fetch(url)
  if (!res.ok || !res.body) {
    console.warn(
      `[fetch-auto-editor] download failed (${res.status}). The app will fall back to PATH/manual lookup at runtime.`
    )
    return
  }
  await pipeline(res.body, createWriteStream(archivePath))

  if (asset.endsWith('.tar.gz')) {
    spawnSync('tar', ['-xzf', archivePath, '-C', outDir], { stdio: 'inherit' })
  } else if (asset.endsWith('.zip')) {
    spawnSync('unzip', ['-o', archivePath, '-d', outDir], { stdio: 'inherit' })
  }

  if (!existsSync(binaryPath)) {
    console.warn(`[fetch-auto-editor] archive did not produce ${binaryName} at the expected path.`)
    return
  }
  if (!TARGET.startsWith('win32')) {
    chmodSync(binaryPath, 0o755)
  }
  const size = statSync(binaryPath).size
  console.log(`[fetch-auto-editor] ready: ${binaryPath} (${(size / 1024 / 1024).toFixed(1)} MB)`)
}

main().catch((err) => {
  console.error('[fetch-auto-editor] error:', err)
  process.exit(1)
})
