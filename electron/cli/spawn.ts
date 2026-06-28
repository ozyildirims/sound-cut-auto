import { spawn } from 'cross-spawn'
import type { ChildProcess } from 'node:child_process'
import treeKill from 'tree-kill'

export interface SpawnCallbacks {
  onStdout?: (line: string) => void
  onStderr?: (line: string) => void
  onExit: (info: { code: number | null; signal: NodeJS.Signals | null; error?: Error }) => void
}

export interface SpawnHandle {
  child: ChildProcess
  cancel: () => void
}

export function runAutoEditor(
  binary: string,
  args: string[],
  callbacks: SpawnCallbacks
): SpawnHandle {
  const child = spawn(binary, args, {
    windowsHide: true,
    env: {
      ...process.env,
      PYTHONIOENCODING: 'utf-8',
      FORCE_COLOR: '0',
      NO_COLOR: '1'
    }
  })

  let stdoutBuf = ''
  let stderrBuf = ''

  // auto-editor's --progress machine uses '\r' to overwrite the progress line.
  // Treat both '\n' and '\r' as line breaks so each progress update arrives
  // as its own callback.
  const flushLines = (bufRef: { value: string }, cb?: (line: string) => void): void => {
    bufRef.value = bufRef.value.replace(/\r/g, '\n')
    let idx: number
    while ((idx = bufRef.value.indexOf('\n')) !== -1) {
      const line = stripAnsi(bufRef.value.slice(0, idx))
      bufRef.value = bufRef.value.slice(idx + 1)
      if (cb && line.trim()) cb(line)
    }
  }

  const stdoutRef = { value: stdoutBuf }
  const stderrRef = { value: stderrBuf }

  child.stdout?.on('data', (chunk: Buffer) => {
    stdoutRef.value += chunk.toString('utf-8')
    flushLines(stdoutRef, callbacks.onStdout)
  })

  child.stderr?.on('data', (chunk: Buffer) => {
    stderrRef.value += chunk.toString('utf-8')
    flushLines(stderrRef, callbacks.onStderr)
  })

  child.on('error', (error) => {
    callbacks.onExit({ code: null, signal: null, error })
  })

  child.on('close', (code, signal) => {
    if (stdoutRef.value.trim() && callbacks.onStdout) {
      callbacks.onStdout(stripAnsi(stdoutRef.value.trim()))
    }
    if (stderrRef.value.trim() && callbacks.onStderr) {
      callbacks.onStderr(stripAnsi(stderrRef.value.trim()))
    }
    callbacks.onExit({ code, signal })
  })

  const cancel = () => {
    if (!child.pid || child.exitCode !== null) return
    treeKill(child.pid, 'SIGTERM', (err) => {
      if (err && child.pid && child.exitCode === null) {
        setTimeout(() => {
          if (child.pid && child.exitCode === null) treeKill(child.pid, 'SIGKILL')
        }, 2000)
      }
    })
  }

  return { child, cancel }
}

const ANSI_PATTERN = /\x1B(?:\[[0-?]*[ -/]*[@-~]|\][^\x07]*\x07|[@-Z\\-_])/g
function stripAnsi(s: string): string {
  return s.replace(ANSI_PATTERN, '')
}
