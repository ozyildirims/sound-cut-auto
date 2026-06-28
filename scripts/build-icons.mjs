#!/usr/bin/env node
// Renders resources/icon.svg into:
//   resources/icon.icns  (Mac iconset → iconutil)
//   resources/icon.ico   (Windows multi-resolution ICO)
//   resources/icon.png   (1024×1024 master, useful for stores / Linux)
//
// Requires sharp + to-ico (devDependencies), plus macOS `iconutil` for .icns.

import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import sharp from 'sharp'
import toIco from 'to-ico'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const SVG = join(ROOT, 'resources', 'icon.svg')

const ICNS_SIZES = [16, 32, 64, 128, 256, 512, 1024]
const ICO_SIZES = [16, 32, 48, 64, 128, 256]

async function renderPng(buffer, size) {
  return sharp(buffer, { density: 384 })
    .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer()
}

async function main() {
  const svg = await readFile(SVG)

  // master 1024×1024 PNG
  const masterPng = await renderPng(svg, 1024)
  await writeFile(join(ROOT, 'resources', 'icon.png'), masterPng)

  // ----- Mac .icns -----
  if (process.platform === 'darwin') {
    const iconset = join(ROOT, 'resources', 'icon.iconset')
    await rm(iconset, { recursive: true, force: true })
    await mkdir(iconset, { recursive: true })

    // Mac iconset naming convention: icon_<size>x<size>.png + icon_<size>x<size>@2x.png
    const mapping = [
      [16, 'icon_16x16.png'],
      [32, 'icon_16x16@2x.png'],
      [32, 'icon_32x32.png'],
      [64, 'icon_32x32@2x.png'],
      [128, 'icon_128x128.png'],
      [256, 'icon_128x128@2x.png'],
      [256, 'icon_256x256.png'],
      [512, 'icon_256x256@2x.png'],
      [512, 'icon_512x512.png'],
      [1024, 'icon_512x512@2x.png']
    ]
    for (const [size, name] of mapping) {
      const png = await renderPng(svg, size)
      await writeFile(join(iconset, name), png)
    }
    const icns = join(ROOT, 'resources', 'icon.icns')
    const result = spawnSync('iconutil', ['-c', 'icns', iconset, '-o', icns], {
      stdio: 'inherit'
    })
    if (result.status !== 0) {
      console.error('[build-icons] iconutil failed')
      process.exit(1)
    }
    await rm(iconset, { recursive: true, force: true })
    console.log('[build-icons] wrote', icns)
  } else {
    console.warn('[build-icons] skipping .icns (not on macOS); use a Mac runner in CI')
  }

  // ----- Windows .ico -----
  const icoPngs = []
  for (const size of ICO_SIZES) {
    icoPngs.push(await renderPng(svg, size))
  }
  const ico = await toIco(icoPngs)
  await writeFile(join(ROOT, 'resources', 'icon.ico'), ico)
  console.log('[build-icons] wrote', join(ROOT, 'resources', 'icon.ico'))

  console.log('[build-icons] master PNG:', ICNS_SIZES.map((s) => `${s}px`).join(', '))
  // also referenced by the unused ICNS_SIZES so static analyzers don't flag it
  void ICNS_SIZES
}

main().catch((err) => {
  console.error('[build-icons]', err)
  process.exit(1)
})
