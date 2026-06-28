import { ThresholdSlider } from './ThresholdSlider'
import { MarginInput } from './MarginInput'
import { SmoothInput } from './SmoothInput'
import { ExportFormatSelect } from './ExportFormatSelect'
import { OutputFolderInput } from './OutputFolderInput'

export function SettingsPanel() {
  return (
    <div className="card divide-y divide-edge">
      <div className="p-5">
        <ThresholdSlider />
      </div>
      <div className="p-5">
        <MarginInput />
      </div>
      <div className="p-5">
        <SmoothInput />
      </div>
      <div className="p-5">
        <ExportFormatSelect />
      </div>
      <div className="p-5">
        <OutputFolderInput />
      </div>
    </div>
  )
}
