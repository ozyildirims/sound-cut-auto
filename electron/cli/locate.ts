import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { getSidecarBinaryPath } from '../util/paths'
import { getVersion } from './version'
import type { CliStatus } from '@shared/types'

interface LocateOptions {
  override: string | null
}

export async function locateCli({ override }: LocateOptions): Promise<CliStatus> {
  // 1. user-set override
  if (override) {
    if (fs.existsSync(override)) {
      const version = await getVersion(override)
      if (version) {
        return { found: true, path: override, version, source: 'override' }
      }
      return {
        found: false,
        path: override,
        version: null,
        source: 'override',
        error: 'Override path exists but did not respond to --version.'
      }
    }
    return {
      found: false,
      path: override,
      version: null,
      source: 'override',
      error: 'Override path does not exist.'
    }
  }

  // 2. sidecar
  const sidecar = getSidecarBinaryPath()
  if (fs.existsSync(sidecar)) {
    const version = await getVersion(sidecar)
    if (version) {
      return { found: true, path: sidecar, version, source: 'sidecar' }
    }
  }

  // 3. PATH lookup
  const fromPath = findOnPath('auto-editor')
  if (fromPath) {
    const version = await getVersion(fromPath)
    if (version) {
      return { found: true, path: fromPath, version, source: 'path' }
    }
  }

  return { found: false, path: null, version: null, source: 'none' }
}

function findOnPath(cmd: string): string | null {
  const isWin = process.platform === 'win32'
  const lookup = isWin ? 'where' : 'which'
  try {
    const result = spawnSync(lookup, [cmd], { encoding: 'utf-8' })
    if (result.status === 0) {
      const line = result.stdout.split(/\r?\n/).map((l) => l.trim()).find(Boolean)
      if (line && fs.existsSync(line)) return line
    }
  } catch {
    /* noop */
  }
  // Manual PATH scan as a fallback
  const PATH = process.env.PATH || ''
  const sep = isWin ? ';' : ':'
  const exts = isWin ? (process.env.PATHEXT || '.EXE').split(';') : ['']
  for (const dir of PATH.split(sep)) {
    for (const ext of exts) {
      const candidate = path.join(dir, cmd + ext)
      if (fs.existsSync(candidate)) return candidate
    }
  }
  return null
}
