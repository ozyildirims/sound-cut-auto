import { useState, type DragEvent } from 'react'
import { UploadCloud } from 'lucide-react'
import { ipc } from '../../ipc/client'
import { useAppStore } from '../../state/store'

const ALLOWED = new Set([
  'mp4',
  'mov',
  'mkv',
  'webm',
  'm4a',
  'mp3',
  'wav',
  'aac',
  'flac',
  'ogg',
  'avi'
])

export function DropZone() {
  const addFiles = useAppStore((s) => s.addFiles)
  const [drag, setDrag] = useState(false)

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setDrag(false)
    const dropped: string[] = []
    for (const file of Array.from(e.dataTransfer.files)) {
      const path = (file as File & { path?: string }).path
      if (!path) continue
      const ext = path.split('.').pop()?.toLowerCase()
      if (!ext || !ALLOWED.has(ext)) continue
      dropped.push(path)
    }
    if (dropped.length) addFiles(dropped)
  }

  async function onPick() {
    const paths = await ipc.dialog.openFiles()
    if (paths.length) addFiles(paths)
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault()
        setDrag(true)
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={onDrop}
      onClick={onPick}
      className={`flex h-72 cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed transition-colors ${
        drag ? 'border-accent bg-accent/5' : 'border-edge bg-bg-surface/40 hover:bg-white/5'
      }`}
    >
      <UploadCloud className={`h-10 w-10 ${drag ? 'text-accent' : 'text-zinc-500'}`} />
      <div className="text-base font-medium text-zinc-200">
        Video / ses dosyalarını buraya sürükle
      </div>
      <div className="text-sm text-zinc-500">
        veya tıkla — mp4, mov, mkv, webm, m4a, mp3, wav…
      </div>
    </div>
  )
}
