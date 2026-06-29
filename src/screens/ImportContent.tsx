import { useState, type DragEvent } from 'react'
import { ArrowRight, FolderOpen, Sparkles, UploadCloud } from 'lucide-react'
import { Button, Card } from '../components/ui'
import { ipc } from '../ipc/client'
import { useAppStore } from '../state/store'

const ALLOWED = new Set([
  'mp4', 'mov', 'mkv', 'webm', 'm4a', 'mp3', 'wav', 'aac', 'flac', 'ogg', 'avi'
])

export function ImportContent() {
  const addFiles = useAppStore((s) => s.addFiles)
  const files = useAppStore((s) => s.files)
  const setScreen = useAppStore((s) => s.setScreen)
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

  async function pick() {
    const paths = await ipc.dialog.openFiles()
    if (paths.length) addFiles(paths)
  }

  return (
    <div className="mx-auto flex h-full w-full max-w-5xl flex-col gap-8 p-10">
      <header>
        <div className="text-micro">Yeni proje</div>
        <h1 className="mt-2 text-display text-3xl font-semibold tracking-tightest text-text-primary">
          Video sürükle, sessizliği kessin.
        </h1>
        <p className="mt-2 max-w-xl text-md text-text-secondary">
          auto-editor sessiz boşlukları otomatik keser, sosyal medya için 9:16'ya çevirir, sesi -14 LUFS'a normalize eder. Hepsi yerelinde.
        </p>
      </header>

      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDrag(true)
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={onDrop}
        onClick={pick}
        className={`flex h-80 cursor-pointer flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed transition-colors duration-fast ease-out ${
          drag
            ? 'border-accent bg-accent/5'
            : 'border-edge bg-bg-surface/40 hover:border-edge-strong hover:bg-white/[0.03]'
        }`}
      >
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-accent/10 blur-2xl" />
          <UploadCloud className={`relative h-14 w-14 ${drag ? 'text-accent' : 'text-text-muted'}`} />
        </div>
        <div className="text-center">
          <div className="text-lg font-medium text-text-primary">
            Dosyaları sürükle veya tıkla
          </div>
          <div className="mt-1 text-xs text-text-muted">
            mp4 · mov · mkv · webm · m4a · mp3 · wav
          </div>
        </div>
        <Button variant="outline" size="md" leading={<FolderOpen className="h-4 w-4" />} onClick={(e) => { e.stopPropagation(); void pick() }}>
          Dosya seç
        </Button>
      </div>

      <Card variant="surface">
        <div className="flex items-start gap-4 p-5">
          <div className="rounded-md bg-accent/10 p-2">
            <Sparkles className="h-4 w-4 text-accent" />
          </div>
          <div className="flex-1">
            <div className="text-md font-medium text-text-primary">Hızlı ipucu</div>
            <div className="mt-1 text-sm text-text-secondary">
              <kbd className="rounded border border-edge bg-bg-elev px-1.5 py-0.5 font-mono text-2xs">⌘K</kbd> ile komut paletini aç, hızlıca dosya ekle / preset uygula / export başlat.
            </div>
          </div>
        </div>
      </Card>

      {files.length > 0 && (
        <div className="flex justify-end">
          <Button variant="primary" size="md" trailing={<ArrowRight className="h-4 w-4" />} onClick={() => setScreen('project')}>
            Devam et — {files.length} dosya
          </Button>
        </div>
      )}
    </div>
  )
}
