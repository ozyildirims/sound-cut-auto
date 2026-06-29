import { Terminal } from 'lucide-react'
import { MediaPanel } from '../components/preview/MediaPanel'
import { PreviewPanel } from '../components/preview/PreviewPanel'
import { DurationGuide } from '../components/social/DurationGuide'
import { Card } from '../components/ui'
import { previewArgs } from '../lib/argsPreview'
import { useAppStore } from '../state/store'
import { useEffectiveSettings } from '../state/hooks'

export function ProjectCenter() {
  const files = useAppStore((s) => s.files)
  const selectedId = useAppStore((s) => s.selectedFileId)
  const selected = files.find((f) => f.id === selectedId) ?? files[0]
  const settings = useEffectiveSettings()
  const globalSettings = useAppStore((s) => s.settings)
  const patchSettings = useAppStore((s) => s.patchSettings)

  if (!selected) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-center">
        <div>
          <div className="text-micro">Boş</div>
          <div className="mt-2 text-lg text-text-secondary">Soldan bir dosya seç ya da yeni ekle.</div>
        </div>
      </div>
    )
  }

  const cmd = previewArgs({
    filePath: selected.path,
    settings,
    mode: 'export',
    outputPath: null
  })

  return (
    <div className="flex flex-col gap-5 p-6">
      <DurationGuide />
      <MediaPanel />
      <PreviewPanel />
      {globalSettings.devShowCommand && (
        <Card variant="elev">
          <div className="flex items-center justify-between border-b border-edge-subtle px-3 py-2">
            <div className="flex items-center gap-2 text-micro">
              <Terminal className="h-3 w-3" /> Command preview
            </div>
            <label className="flex items-center gap-2 text-2xs text-text-muted cursor-pointer">
              <input
                type="checkbox"
                checked={globalSettings.devShowCommand}
                onChange={(e) => patchSettings({ devShowCommand: e.target.checked })}
              />
              dev mode
            </label>
          </div>
          <pre className="overflow-x-auto p-3 font-mono text-2xs text-text-secondary">{cmd}</pre>
        </Card>
      )}
    </div>
  )
}
