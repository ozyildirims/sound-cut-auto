import { create } from 'zustand'
import { ipc } from '../ipc/client'
import {
  DEFAULT_SETTINGS,
  type AutoEditSettings,
  type CliStatus,
  type Job,
  type JobEvent,
  type PreviewStats,
  type VideoFile
} from '@shared/types'

export type Screen = 'import' | 'project' | 'jobs' | 'settings'

interface PreviewState {
  filePath: string | null
  jobId: string | null
  running: boolean
  stats: PreviewStats | null
  logTail: string[]
  error: string | null
}

interface ExportRunState {
  jobIds: string[]
}

interface State {
  screen: Screen
  setScreen: (screen: Screen) => void

  files: VideoFile[]
  addFiles: (paths: string[]) => void
  removeFile: (id: string) => void
  reorderFile: (id: string, direction: -1 | 1) => void
  clearFiles: () => void

  settings: AutoEditSettings
  loadSettings: () => Promise<void>
  patchSettings: (patch: Partial<AutoEditSettings>) => void
  resetSettings: () => Promise<void>

  cli: CliStatus
  refreshCli: () => Promise<void>
  setCliStatus: (status: CliStatus) => void

  preview: PreviewState
  startPreview: (filePath: string) => Promise<void>

  jobs: Job[]
  exportRun: ExportRunState
  startExport: () => Promise<void>
  cancelJob: (jobId: string) => Promise<void>
  hydrateJobs: () => Promise<void>
  applyJobEvent: (event: JobEvent) => void
}

const emptyPreview: PreviewState = {
  filePath: null,
  jobId: null,
  running: false,
  stats: null,
  logTail: [],
  error: null
}

export const useAppStore = create<State>((set, get) => ({
  screen: 'import',
  setScreen: (screen) => set({ screen }),

  files: [],
  addFiles: (paths) => {
    const existing = new Set(get().files.map((f) => f.path))
    const additions: VideoFile[] = []
    for (const p of paths) {
      if (existing.has(p)) continue
      const name = p.split(/[/\\]/).pop() || p
      additions.push({
        id: crypto.randomUUID(),
        path: p,
        name,
        sizeBytes: 0,
        addedAt: Date.now()
      })
    }
    if (additions.length) {
      set({ files: [...get().files, ...additions], screen: 'project' })
    }
  },
  removeFile: (id) => set({ files: get().files.filter((f) => f.id !== id) }),
  reorderFile: (id, direction) => {
    const list = [...get().files]
    const idx = list.findIndex((f) => f.id === id)
    if (idx === -1) return
    const target = idx + direction
    if (target < 0 || target >= list.length) return
    const [item] = list.splice(idx, 1)
    list.splice(target, 0, item)
    set({ files: list })
  },
  clearFiles: () => set({ files: [], preview: { ...emptyPreview } }),

  settings: DEFAULT_SETTINGS,
  loadSettings: async () => {
    const s = await ipc.settings.get()
    set({ settings: s })
  },
  patchSettings: (patch) => {
    const next = { ...get().settings, ...patch }
    set({ settings: next })
    void ipc.settings.set(next)
  },
  resetSettings: async () => {
    const next = await ipc.settings.set({ ...DEFAULT_SETTINGS })
    set({ settings: next })
  },

  cli: { found: false, path: null, version: null, source: 'none' },
  refreshCli: async () => {
    const status = await ipc.cli.getStatus()
    set({ cli: status })
  },
  setCliStatus: (status) => set({ cli: status }),

  preview: { ...emptyPreview },
  startPreview: async (filePath) => {
    set({ preview: { ...emptyPreview, filePath, running: true } })
    try {
      const { jobId } = await ipc.jobs.start({
        mode: 'preview',
        filePath,
        settings: get().settings
      })
      set({ preview: { ...get().preview, jobId } })
    } catch (err) {
      set({
        preview: {
          ...emptyPreview,
          filePath,
          error: err instanceof Error ? err.message : String(err)
        }
      })
    }
  },

  jobs: [],
  exportRun: { jobIds: [] },
  startExport: async () => {
    const { files, settings } = get()
    if (!files.length) return
    const jobIds: string[] = []
    for (const file of files) {
      try {
        const { jobId } = await ipc.jobs.start({
          mode: 'export',
          filePath: file.path,
          settings
        })
        jobIds.push(jobId)
      } catch (err) {
        console.error('export failed for', file.path, err)
      }
    }
    set({ exportRun: { jobIds }, screen: 'jobs' })
    await get().hydrateJobs()
  },
  cancelJob: async (jobId) => {
    await ipc.jobs.cancel(jobId)
  },
  hydrateJobs: async () => {
    const list = await ipc.jobs.list()
    set({ jobs: list })
  },
  applyJobEvent: (event) => {
    set((state) => {
      switch (event.type) {
        case 'progress': {
          const jobs = state.jobs.map((j) =>
            j.id === event.jobId
              ? {
                  ...j,
                  phase: event.phase,
                  current: event.current,
                  total: event.total,
                  ratio: event.ratio,
                  status: 'running' as const
                }
              : j
          )
          return { jobs }
        }
        case 'stats': {
          if (state.preview.jobId !== event.jobId) return {}
          return {
            preview: {
              ...state.preview,
              stats: event.stats,
              running: false
            }
          }
        }
        case 'log': {
          if (state.preview.jobId === event.jobId) {
            const tail = [...state.preview.logTail, event.line].slice(-50)
            return { preview: { ...state.preview, logTail: tail } }
          }
          return {}
        }
        case 'exit': {
          const jobs = state.jobs.map((j) =>
            j.id === event.jobId
              ? {
                  ...j,
                  status: event.status,
                  exitCode: event.exitCode ?? undefined,
                  errorMessage: event.errorMessage,
                  endedAt: Date.now(),
                  ratio: event.status === 'completed' ? 1 : j.ratio
                }
              : j
          )
          let preview = state.preview
          if (state.preview.jobId === event.jobId) {
            preview = {
              ...state.preview,
              running: false,
              error:
                event.status === 'completed' || event.status === 'cancelled'
                  ? null
                  : (event.errorMessage ?? 'auto-editor hata verdi.')
            }
          }
          return { jobs, preview }
        }
      }
    })
  }
}))
