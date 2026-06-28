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

interface State {
  screen: Screen
  setScreen: (screen: Screen) => void

  files: VideoFile[]
  selectedFileId: string | null
  setSelectedFile: (id: string | null) => void
  addFiles: (paths: string[]) => void
  removeFile: (id: string) => void
  reorderFile: (id: string, direction: -1 | 1) => void
  clearFiles: () => void
  updateFile: (id: string, patch: Partial<VideoFile>) => void

  settings: AutoEditSettings
  loadSettings: () => Promise<void>
  patchSettings: (patch: Partial<AutoEditSettings>) => void
  resetSettings: () => Promise<void>

  effectiveSettingsFor: (fileId: string | null) => AutoEditSettings
  patchEffective: (patch: Partial<AutoEditSettings>) => void
  applyOverrideToAll: () => void
  resetOverride: () => void

  cli: CliStatus
  refreshCli: () => Promise<void>
  setCliStatus: (status: CliStatus) => void

  recentFiles: string[]
  loadRecent: () => Promise<void>
  setRecentFiles: (paths: string[]) => void
  clearRecent: () => Promise<void>

  preview: PreviewState
  startPreview: (filePath: string) => Promise<void>

  jobs: Job[]
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
  selectedFileId: null,
  setSelectedFile: (id) => set({ selectedFileId: id }),
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
      const next = [...get().files, ...additions]
      set({
        files: next,
        screen: 'project',
        selectedFileId: get().selectedFileId ?? additions[0].id
      })
      void ipc.recent.add(additions.map((a) => a.path))
      // Lazily fetch duration + thumbnail in the background; UI updates as they land.
      for (const f of additions) {
        void ipc.media.probe(f.path).then((info) => {
          get().updateFile(f.id, {
            durationSeconds: info.durationSeconds ?? undefined,
            thumbnailDataUrl: info.thumbnailDataUrl ?? undefined
          })
        }).catch(() => { /* best-effort */ })
      }
    }
  },
  removeFile: (id) => {
    const list = get().files.filter((f) => f.id !== id)
    set({
      files: list,
      selectedFileId: get().selectedFileId === id ? (list[0]?.id ?? null) : get().selectedFileId
    })
  },
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
  clearFiles: () => set({ files: [], selectedFileId: null, preview: { ...emptyPreview } }),
  updateFile: (id, patch) => {
    set({ files: get().files.map((f) => (f.id === id ? { ...f, ...patch } : f)) })
  },

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

  effectiveSettingsFor: (fileId) => {
    const { settings, files } = get()
    if (!fileId) return settings
    const f = files.find((x) => x.id === fileId)
    if (!f?.settingsOverride) return settings
    return { ...settings, ...f.settingsOverride }
  },
  patchEffective: (patch) => {
    const { selectedFileId, files, settings } = get()
    if (!selectedFileId) {
      get().patchSettings(patch)
      return
    }
    set({
      files: files.map((f) => {
        if (f.id !== selectedFileId) return f
        const merged = { ...(f.settingsOverride ?? {}), ...patch }
        // Drop keys that match the global settings to keep override minimal
        const minimal: Partial<AutoEditSettings> = {}
        const globalRecord = settings as unknown as Record<string, unknown>
        const minimalRecord = minimal as unknown as Record<string, unknown>
        for (const [key, value] of Object.entries(merged)) {
          if (globalRecord[key] !== value) minimalRecord[key] = value
        }
        return { ...f, settingsOverride: Object.keys(minimal).length ? minimal : undefined }
      })
    })
  },
  applyOverrideToAll: () => {
    const { selectedFileId, files, settings } = get()
    if (!selectedFileId) return
    const sel = files.find((f) => f.id === selectedFileId)
    if (!sel?.settingsOverride) return
    const next = { ...settings, ...sel.settingsOverride }
    set({
      settings: next,
      files: files.map((f) => ({ ...f, settingsOverride: undefined }))
    })
    void ipc.settings.set(next)
  },
  resetOverride: () => {
    const { selectedFileId, files } = get()
    if (!selectedFileId) return
    set({
      files: files.map((f) => (f.id === selectedFileId ? { ...f, settingsOverride: undefined } : f))
    })
  },

  cli: { found: false, path: null, version: null, source: 'none' },
  refreshCli: async () => {
    const status = await ipc.cli.getStatus()
    set({ cli: status })
  },
  setCliStatus: (status) => set({ cli: status }),

  recentFiles: [],
  loadRecent: async () => set({ recentFiles: await ipc.recent.list() }),
  setRecentFiles: (paths) => set({ recentFiles: paths }),
  clearRecent: async () => {
    await ipc.recent.clear()
    set({ recentFiles: [] })
  },

  preview: { ...emptyPreview },
  startPreview: async (filePath) => {
    // Cancel any in-flight preview so rapid slider changes don't queue up
    // a backlog of expensive auto-editor runs.
    const previousId = get().preview.jobId
    if (previousId) {
      void ipc.jobs.cancel(previousId)
    }
    const settings = get().effectiveSettingsFor(
      get().files.find((f) => f.path === filePath)?.id ?? null
    )
    set({ preview: { ...emptyPreview, filePath, running: true } })
    try {
      const { jobId } = await ipc.jobs.start({
        mode: 'preview',
        filePath,
        settings
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
  startExport: async () => {
    const { files } = get()
    if (!files.length) return
    const jobIds: string[] = []
    for (const file of files) {
      const settings = get().effectiveSettingsFor(file.id)
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
    set({ screen: 'jobs' })
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
