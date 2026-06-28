import { spawn } from 'cross-spawn'

export function getVersion(binaryPath: string, timeoutMs = 4000): Promise<string | null> {
  return new Promise((resolve) => {
    let resolved = false
    const child = spawn(binaryPath, ['--version'], { windowsHide: true })
    let stdout = ''
    let stderr = ''

    const done = (value: string | null) => {
      if (resolved) return
      resolved = true
      try {
        child.kill()
      } catch {
        /* noop */
      }
      resolve(value)
    }

    const timer = setTimeout(() => done(null), timeoutMs)

    child.stdout?.on('data', (chunk) => {
      stdout += chunk.toString()
    })
    child.stderr?.on('data', (chunk) => {
      stderr += chunk.toString()
    })
    child.on('error', () => {
      clearTimeout(timer)
      done(null)
    })
    child.on('close', () => {
      clearTimeout(timer)
      const raw = (stdout || stderr).trim()
      const match = raw.match(/(\d+\.\d+\.\d+(?:[-\w.]*)?)/)
      done(match ? match[1] : raw || null)
    })
  })
}
