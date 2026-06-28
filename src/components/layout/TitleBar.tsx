import { ipc } from '../../ipc/client'

export function TitleBar() {
  const isMac = ipc.platform === 'darwin'
  return (
    <div
      className={`drag-region flex items-center border-b border-edge bg-bg-base/95 px-4 ${
        isMac ? 'h-9 pl-20' : 'h-10'
      }`}
    >
      <span className="text-xs uppercase tracking-[0.18em] text-zinc-500">autocut-ui</span>
    </div>
  )
}
