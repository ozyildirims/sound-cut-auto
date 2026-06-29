import { RotateCcw, Users } from 'lucide-react'
import { InspectorSection } from '../components/layout/Inspector'
import { Badge, Button } from '../components/ui'
import { PresetBar } from '../components/settings/PresetBar'
import { ThresholdSlider } from '../components/settings/ThresholdSlider'
import { MarginInput } from '../components/settings/MarginInput'
import { SmoothInput } from '../components/settings/SmoothInput'
import { ExportFormatSelect } from '../components/settings/ExportFormatSelect'
import { OutputFolderInput } from '../components/settings/OutputFolderInput'
import { SocialPresetGrid } from '../components/social/SocialPresetGrid'
import { AspectRatioToggle } from '../components/social/AspectRatioToggle'
import { LoudnessToggle } from '../components/social/LoudnessToggle'
import { CoverFramePicker } from '../components/social/CoverFramePicker'
import { useAppStore } from '../state/store'
import { useEffectiveSettings } from '../state/hooks'

export function ProjectInspector() {
  const selectedId = useAppStore((s) => s.selectedFileId)
  const selected = useAppStore((s) => s.files.find((f) => f.id === selectedId) ?? null)
  const files = useAppStore((s) => s.files)
  const applyAll = useAppStore((s) => s.applyOverrideToAll)
  const resetOverride = useAppStore((s) => s.resetOverride)

  const hasOverride = Boolean(selected?.settingsOverride && Object.keys(selected.settingsOverride).length)
  const multi = files.length > 1
  const socialActive = !!useEffectiveSettings().socialPreset

  return (
    <>
      {selected && (
        <div className="border-b border-edge-subtle px-4 py-3">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="text-micro">Aktif dosya</div>
              <div className="mt-0.5 truncate text-sm text-text-primary">{selected.name}</div>
            </div>
            {hasOverride && <Badge tone="accent" size="sm">özel</Badge>}
          </div>
          {hasOverride && (
            <div className="mt-2 flex gap-2">
              {multi && (
                <Button variant="ghost" size="sm" leading={<Users className="h-3 w-3" />} onClick={applyAll}>
                  Tümüne uygula
                </Button>
              )}
              <Button variant="ghost" size="sm" leading={<RotateCcw className="h-3 w-3" />} onClick={resetOverride}>
                Sıfırla
              </Button>
            </div>
          )}
        </div>
      )}

      <InspectorSection title="Cut profili">
        <PresetBar />
      </InspectorSection>

      <InspectorSection title="Sosyal medya" trailing={socialActive ? <Badge tone="accent" size="sm">AÇIK</Badge> : undefined}>
        <SocialPresetGrid />
        {socialActive && (
          <>
            <AspectRatioToggle />
            <LoudnessToggle />
            <CoverFramePicker />
          </>
        )}
      </InspectorSection>

      <InspectorSection title="Cut">
        <ThresholdSlider />
        <MarginInput />
        <SmoothInput />
      </InspectorSection>

      <InspectorSection title="Output" defaultOpen={false}>
        <ExportFormatSelect />
        <OutputFolderInput />
      </InspectorSection>
    </>
  )
}
