import { useAppStore } from './store'

// Effective settings = global ⊕ selected file's override (if any).
// Settings components read from this and call patchEffective so a slider
// edit lands on the per-file override when a file is selected, or on the
// global default when nothing is selected.
export function useEffectiveSettings() {
  const fileId = useAppStore((s) => s.selectedFileId)
  return useAppStore((s) => s.effectiveSettingsFor(fileId))
}
