import { randomUUID } from 'node:crypto'
import path from 'node:path'
import { BrowserWindow, Notification, app } from 'electron'
import { runAutoEditor, SpawnHandle } from '../cli/spawn'
import { buildArgs } from '../cli/buildArgs'
import { ProgressEmitter, ProgressParser } from '../cli/progressParser'
import { parseStats } from '../cli/statsParser'
import {
  applyRotationMetadata,
  applySocialPass,
  extractCoverJpeg,
  probeDuration,
  probeRotation
} from '../cli/ffmpeg'
import { getSocialPreset } from '@shared/types'
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
  const inputDuration = isVideoRender ? (probeDuration(input.filePath) ?? 0) : 0
  const socialSpec = getSocialPreset(input.settings.socialPreset)
  const wantsAspect = isVideoRender && !!socialSpec && input.settings.aspectMode && input.settings.aspectMode !== 'none'
  const wantsLoudness = isVideoRender && input.settings.loudnessTarget != null
  const wantsCover = isVideoRender && !!input.settings.exportCover && !!input.outputPath
  const coverPath = wantsCover && input.outputPath
    ? input.outputPath.replace(/\.[^.]+$/, '') + '_cover.jpg'
    : null
  const coverTime = (() => {
    if (!wantsCover) return 0
    const requested = input.coverTimeSeconds
    if (requested != null && requested > 0) return requested
    if (inputDuration > 0) return inputDuration * 0.1
    return 0.5
  })()

  const handle = runAutoEditor(binary, args, {
    onStdout: (line) => handleLine(entry, 'stdout', line, input.mode),
    onStderr: (line) => handleLine(entry, 'stderr', line, input.mode),
    onExit: async ({ code, signal, error }) => {
      entry.emitter.flush()
      if (input.mode === 'preview' && entry.rawText) {
        const stats = parseStats(entry.rawText)
        broadcast({ type: 'stats', jobId: entry.job.id, stats })
      }
      let status: JobStatus = error
        ? 'failed'
        : code === 0
          ? 'completed'
          : signal
            ? 'cancelled'
            : 'failed'
      let postError: string | undefined

      const finalize = () => {
        finish(entry, { status, exitCode: code, signal, errorMessage: postError ?? error?.message })
        currentRunningId = null
        void drain({ binary, input })
      }

      if (status !== 'completed' || !isVideoRender || !input.outputPath) {
        return finalize()
      }

      try {
        await runPostProcessChain([
          {
            name: 'rotation',
            shouldRun: inputRotation !== 0,
            critical: false,
            run: () => applyRotationMetadata(input.outputPath!, inputRotation)
          },
          {
            name: 'social',
            shouldRun: !!(wantsAspect || wantsLoudness),
            critical: true,
            run: () =>
              applySocialPass(input.outputPath!, {
                aspect: wantsAspect && socialSpec
                  ? {
                      mode: input.settings.aspectMode as Exclude<typeof input.settings.aspectMode, 'none' | undefined>,
                      width: socialSpec.outputWidth,
                      height: socialSpec.outputHeight
                    }
                  : null,
                loudness: wantsLoudness ? { target: input.settings.loudnessTarget! } : null
              })
          },
          {
            name: 'cover',
            shouldRun: !!(wantsCover && coverPath),
            critical: false,
            run: () => extractCoverJpeg(input.outputPath!, coverTime, coverPath!)
          }
        ], entry.job.id)
      } catch (err) {
        status = 'failed'
        postError = err instanceof Error ? err.message : String(err)
        logger.error('post-process critical step failed', err)
      }
      finalize()
    }
  })
  entry.handle = handle
}

interface PostStep {
  name: string
  shouldRun: boolean
  critical: boolean
  run: () => Promise<void>
}

async function runPostProcessChain(steps: PostStep[], jobId: string): Promise<void> {
  for (const step of steps) {
    if (!step.shouldRun) continue
    try {
      const t0 = Date.now()
      await step.run()
      logger.info('post-process step ok', { jobId, name: step.name, ms: Date.now() - t0 })
    } catch (err) {
      logger.error('post-process step failed', { jobId, name: step.name, err })
      if (step.critical) throw err
    }
  }
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

  if (
    info.status === 'completed' &&
    entry.job.mode === 'export' &&
    Notification.isSupported()
  ) {
    try {
      const notif = new Notification({
        title: app.name,
        body: `${entry.job.fileName} hazır`,
        silent: false
      })
      notif.show()
    } catch {
      /* notifications best-effort */
    }
  }
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
