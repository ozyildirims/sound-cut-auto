import { useMemo } from 'react'
import { useAppStore } from './store'

// Subscribe to the underlying primitives separately so each selector returns
// a stable reference, then compose with useMemo. Returning a fresh
// `{ ...settings, ...override }` directly from a Zustand selector trips its
// Object.is equality check and re-renders forever.
export function useEffectiveSettings() {
  const settings = useAppStore((s) => s.settings)
  const fileId = useAppStore((s) => s.selectedFileId)
  const override = useAppStore((s) =>
    fileId ? s.files.find((f) => f.id === fileId)?.settingsOverride : undefined
  )
  return useMemo(() => {
    if (!override || Object.keys(override).length === 0) return settings
    return { ...settings, ...override }
  }, [settings, override])
}
