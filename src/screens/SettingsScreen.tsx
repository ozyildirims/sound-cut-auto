import { FolderOpen, RotateCcw, Terminal } from 'lucide-react'
import { ipc } from '../ipc/client'
import { useAppStore } from '../state/store'

export function SettingsScreen() {
  const cli = useAppStore((s) => s.cli)
  const setCliStatus = useAppStore((s) => s.setCliStatus)
  const settings = useAppStore((s) => s.settings)
  const patch = useAppStore((s) => s.patchSettings)
  const reset = useAppStore((s) => s.resetSettings)

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 p-8">
      <header>
        <h1 className="text-2xl font-semibold text-zinc-100">Settings</h1>
      </header>

      <section className="card p-5">
        <h2 className="text-sm font-semibold text-zinc-200">auto-editor CLI</h2>
        <div className="mt-3 grid grid-cols-[120px_1fr] gap-y-2 text-sm">
          <div className="text-zinc-500">Durum</div>
          <div>
            {cli.found ? (
              <span className="text-emerald-400">Bulundu</span>
            ) : (
              <span className="text-rose-300">Bulunamadı</span>
            )}{' '}
            <span className="text-zinc-500">({cli.source})</span>
          </div>
          <div className="text-zinc-500">Yol</div>
          <div className="truncate font-mono text-xs text-zinc-300">{cli.path ?? '—'}</div>
          <div className="text-zinc-500">Sürüm</div>
          <div className="text-zinc-300">{cli.version ?? '—'}</div>
          {cli.error && (
            <>
              <div className="text-zinc-500">Hata</div>
              <div className="text-rose-300">{cli.error}</div>
            </>
          )}
        </div>
        <div className="mt-4 flex gap-2">
          <button
            className="btn-outline"
            onClick={async () => setCliStatus(await ipc.cli.locateManual())}
          >
            <Terminal className="h-4 w-4" /> Binary seç
          </button>
          <button
            className="btn-ghost"
            onClick={async () => setCliStatus(await ipc.cli.resetOverride())}
          >
            <RotateCcw className="h-4 w-4" /> Sıfırla
          </button>
        </div>
      </section>

      <section className="card p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-200">Varsayılan değerler</h2>
          <button className="btn-ghost text-zinc-400" onClick={() => void reset()}>
            Fabrika ayarları
          </button>
        </div>
        <div className="mt-3 grid grid-cols-[160px_1fr] gap-y-2 text-sm text-zinc-400">
          <div>Threshold</div>
          <div>{settings.thresholdAudio}</div>
          <div>Margin</div>
          <div>{settings.margin}</div>
          <div>Smooth</div>
          <div>
            {settings.smoothEnabled
              ? `${settings.smoothMincut}, ${settings.smoothMinclip}`
              : 'kapalı'}
          </div>
          <div>Export format</div>
          <div>{settings.exportFormat}</div>
          <div>Output</div>
          <div>{settings.outputDir ?? 'kaynak dosyanın yanı'}</div>
        </div>
        <div className="mt-4 flex items-center gap-2 text-sm text-zinc-400">
          <input
            type="checkbox"
            id="dev"
            checked={settings.devShowCommand}
            onChange={(e) => patch({ devShowCommand: e.target.checked })}
          />
          <label htmlFor="dev">Project ekranında command preview göster</label>
        </div>
      </section>

      <section className="card p-5">
        <h2 className="text-sm font-semibold text-zinc-200">Güncelleme</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Yeni sürüm var mı manuel kontrol et. App açıkken otomatik 6 saatte bir kontrol edilir.
        </p>
        <div className="mt-3">
          <button className="btn-outline" onClick={() => void ipc.update.check()}>
            Güncelleme kontrol et
          </button>
        </div>
      </section>

      <section className="card p-5">
        <h2 className="text-sm font-semibold text-zinc-200">Loglar</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Sorun olduğunda log dosyalarını buradan açabilirsin.
        </p>
        <div className="mt-3">
          <button className="btn-outline" onClick={() => void ipc.shell.openLogs()}>
            <FolderOpen className="h-4 w-4" /> Log klasörünü aç
          </button>
        </div>
      </section>
    </div>
  )
}
