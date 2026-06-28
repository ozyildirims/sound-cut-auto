import * as Select from '@radix-ui/react-select'
import { Check, ChevronDown } from 'lucide-react'
import { EXPORT_FORMATS, type ExportFormat } from '@shared/types'
import { useAppStore } from '../../state/store'

export function ExportFormatSelect() {
  const value = useAppStore((s) => s.settings.exportFormat)
  const patch = useAppStore((s) => s.patchSettings)

  return (
    <div className="space-y-2">
      <label className="label">Export formatı</label>
      <Select.Root value={value} onValueChange={(v) => patch({ exportFormat: v as ExportFormat })}>
        <Select.Trigger className="input flex items-center justify-between text-left">
          <Select.Value />
          <Select.Icon>
            <ChevronDown className="h-4 w-4 text-zinc-400" />
          </Select.Icon>
        </Select.Trigger>
        <Select.Portal>
          <Select.Content
            className="overflow-hidden rounded-lg border border-edge bg-bg-elev shadow-lg"
            position="popper"
            sideOffset={6}
          >
            <Select.Viewport className="p-1">
              {EXPORT_FORMATS.map((opt) => (
                <Select.Item
                  key={opt.value}
                  value={opt.value}
                  className="relative flex cursor-pointer flex-col rounded px-3 py-2 pl-8 text-sm text-zinc-200 outline-none data-[highlighted]:bg-accent/15"
                >
                  <Select.ItemText>{opt.label}</Select.ItemText>
                  <span className="text-xs text-zinc-500">{opt.description}</span>
                  <Select.ItemIndicator className="absolute left-2 top-2.5">
                    <Check className="h-4 w-4 text-accent" />
                  </Select.ItemIndicator>
                </Select.Item>
              ))}
            </Select.Viewport>
          </Select.Content>
        </Select.Portal>
      </Select.Root>
    </div>
  )
}
