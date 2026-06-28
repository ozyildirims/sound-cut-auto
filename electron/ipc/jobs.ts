import { randomUUID } from 'node:crypto'
import path from 'node:path'
import { BrowserWindow } from 'electron'
import { runAutoEditor, SpawnHandle } from '../cli/spawn'
import { buildArgs } from '../cli/buildArgs'
import { ProgressEmitter, ProgressParser } from '../cli/progressParser'
import { parseStats } from '../cli/statsParser'
import { applyRotationMetadata, probeRotation } from '../cli/ffmpeg'
import { logger } from '../util/logger'
import { IPC } from '@shared/ipc'
import type { Job, JobEvent, JobMode, JobStatus, StartJobInput } from '@shared/types'

const RING_SIZE = 200

interface RegistryEntry {
  job: Job
  handle?: SpawnHandle
  stdout: string[]
  stderr: string[]
  rawText: string
  emitter: ProgressEmitter
  parser: ProgressParser
}

const jobs = new Map<string, RegistryEntry>()
let currentRunningId: string | null = null
const queue: string[] = []

export function listJobs(): Job[] {
  return Array.from(jobs.values())
    .map((e) => e.job)
    .sort((a, b) => a.startedAt - b.startedAt)
}

interface CreateJobOptions {
  binary: string
  input: StartJobInput
}

export function createJob({ binary, input }: CreateJobOptions): { jobId: string } {
  const jobId = randomUUID()
  const fileName = path.basename(input.filePath)
  const job: Job = {
    id: jobId,
    mode: input.mode,
    filePath: input.filePath,
    fileName,
    status: 'queued',
    phase: 'starting',
    current: 0,
    total: 1,
    ratio: 0,
    startedAt: Date.now(),
    outputPath: input.outputPath
  }

  const entry: RegistryEntry = {
    job,
    stdout: [],
    stderr: [],
    rawText: '',
    parser: new ProgressParser(),
    emitter: new ProgressEmitter((p) => {
      job.phase = p.phase
      job.current = p.current
      job.total = p.total
      job.ratio = p.ratio
      broadcast({
        type: 'progress',
        jobId,
        phase: p.phase,
        current: p.current,
        total: p.total,
        ratio: p.ratio
      })
    })
  }
  jobs.set(jobId, entry)

  queue.push(jobId)
  void drain({ binary, input })

  return { jobId }
}

export function cancelJob(jobId: string): void {
  const entry = jobs.get(jobId)
  if (!entry) return
  if (entry.handle) {
    entry.handle.cancel()
  } else if (entry.job.status === 'queued') {
    finish(entry, { status: 'cancelled', exitCode: null, signal: null })
    const idx = queue.indexOf(jobId)
    if (idx >= 0) queue.splice(idx, 1)
  }
}

async function drain(ctx: { binary: string; input: StartJobInput }): Promise<void> {
  if (currentRunningId) return
  const nextId = queue.shift()
  if (!nextId) return
  const entry = jobs.get(nextId)
  if (!entry) return drain(ctx)
  currentRunningId = nextId
  startEntry(entry, ctx.binary, ctx.input)
}

function startEntry(entry: RegistryEntry, binary: string, input: StartJobInput): void {
  const args = buildArgs({
    filePath: input.filePath,
    settings: input.settings,
    mode: input.mode,
    outputPath: input.outputPath
  })

  entry.job.status = 'running'
  entry.job.phase = 'starting'
  entry.job.startedAt = Date.now()
  logger.info('spawn auto-editor', { jobId: entry.job.id, binary, args })

  // Capture input rotation up-front so we can re-apply it to the output, since
  // auto-editor's re-encode drops the display matrix on iPhone-style videos.
  // Only meaningful when we actually re-encode a video (the 'default' format);
  // other export modes write XML/JSON/audio where rotation tags don't apply.
  const isVideoRender = input.mode === 'export' && input.settings.exportFormat === 'default'
  const inputRotation = isVideoRender ? probeRotation(input.filePath).rotation : 0

  const handle = runAutoEditor(binary, args, {
    onStdout: (line) => handleLine(entry, 'stdout', line, input.mode),
    onStderr: (line) => handleLine(entry, 'stderr', line, input.mode),
    onExit: ({ code, signal, error }) => {
      entry.emitter.flush()
      if (input.mode === 'preview' && entry.rawText) {
        const stats = parseStats(entry.rawText)
        broadcast({ type: 'stats', jobId: entry.job.id, stats })
      }
      const status: JobStatus = error
        ? 'failed'
        : code === 0
          ? 'completed'
          : signal
            ? 'cancelled'
            : 'failed'

      const finalize = (errorMessage?: string) => {
        finish(entry, { status, exitCode: code, signal, errorMessage: errorMessage ?? error?.message })
        currentRunningId = null
        void drain({ binary, input })
      }

      if (status === 'completed' && isVideoRender && input.outputPath && inputRotation !== 0) {
        applyRotationMetadata(input.outputPath, inputRotation)
          .then(() => {
            logger.info('rotation metadata applied', { jobId: entry.job.id, degrees: inputRotation })
            finalize()
          })
          .catch((err) => {
            logger.error('rotation post-process failed', err)
            // Don't fail the job — the cut video is still usable, just not auto-rotated.
            finalize()
          })
      } else {
        finalize()
      }
    }
  })
  entry.handle = handle
}

function handleLine(entry: RegistryEntry, stream: 'stdout' | 'stderr', line: string, mode: JobMode): void {
  pushRing(stream === 'stdout' ? entry.stdout : entry.stderr, line)
  broadcast({ type: 'log', jobId: entry.job.id, stream, line })

  const parsed = entry.parser.parse(line)
  if (parsed) {
    entry.emitter.push(parsed)
    return
  }

  if (mode === 'preview') {
    entry.rawText += line + '\n'
  }
}

function finish(
  entry: RegistryEntry,
  info: { status: JobStatus; exitCode: number | null; signal: NodeJS.Signals | null; errorMessage?: string }
): void {
  entry.job.status = info.status
  entry.job.endedAt = Date.now()
  entry.job.exitCode = info.exitCode ?? undefined
  entry.job.errorMessage = info.errorMessage
  if (info.status === 'completed') {
    entry.job.phase = 'done'
    entry.job.ratio = 1
  }
  broadcast({
    type: 'exit',
    jobId: entry.job.id,
    status: info.status,
    exitCode: info.exitCode,
    signal: info.signal,
    errorMessage: info.errorMessage
  })
}

function pushRing(buf: string[], line: string): void {
  buf.push(line)
  if (buf.length > RING_SIZE) buf.shift()
}

function broadcast(event: JobEvent): void {
  for (const win of BrowserWindow.getAllWindows()) {
    win.webContents.send(IPC.jobEvent, event)
  }
}
