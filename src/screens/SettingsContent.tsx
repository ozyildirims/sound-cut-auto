import { FolderOpen, RotateCcw, Terminal } from 'lucide-react'
import { Badge, Button, Card, CardBody, CardHeader, CardSeparator } from '../components/ui'
import { ipc } from '../ipc/client'
import { useAppStore } from '../state/store'

export function SettingsContent() {
  const cli = useAppStore((s) => s.cli)
  const setCliStatus = useAppStore((s) => s.setCliStatus)
  const settings = useAppStore((s) => s.settings)
  const patch = useAppStore((s) => s.patchSettings)
  const reset = useAppStore((s) => s.resetSettings)

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-8">
      <header>
        <div className="text-micro">Yapılandırma</div>
        <h1 className="mt-2 text-display text-2xl font-semibold tracking-tight text-text-primary">Settings</h1>
      </header>

      <Card>
        <CardHeader title="auto-editor CLI" description="Sidecar binary durumu" />
        <CardBody>
          <dl className="grid grid-cols-[110px_1fr] gap-y-2 text-sm">
            <dt className="text-text-muted">Durum</dt>
            <dd>
              {cli.found ? (
                <Badge tone="success" size="sm" dot>Bulundu</Badge>
              ) : (
                <Badge tone="critical" size="sm" dot>Bulunamadı</Badge>
              )}
              <span className="ml-2 text-text-muted">({cli.source})</span>
            </dd>
            <dt className="text-text-muted">Yol</dt>
            <dd className="truncate font-mono text-xs text-text-secondary">{cli.path ?? '—'}</dd>
            <dt className="text-text-muted">Sürüm</dt>
            <dd className="text-text-secondary">{cli.version ?? '—'}</dd>
            {cli.error && (
              <>
                <dt className="text-text-muted">Hata</dt>
                <dd className="text-critical">{cli.error}</dd>
              </>
            )}
          </dl>
          <div className="mt-4 flex gap-2">
            <Button variant="outline" size="sm" leading={<Terminal className="h-3.5 w-3.5" />} onClick={async () => setCliStatus(await ipc.cli.locateManual())}>
              Binary seç
            </Button>
            <Button variant="ghost" size="sm" leading={<RotateCcw className="h-3.5 w-3.5" />} onClick={async () => setCliStatus(await ipc.cli.resetOverride())}>
              Sıfırla
            </Button>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Varsayılan değerler" trailing={
          <Button variant="ghost" size="sm" onClick={() => void reset()}>Fabrika ayarları</Button>
        } />
        <CardBody>
          <dl className="grid grid-cols-[160px_1fr] gap-y-2 text-sm text-text-secondary">
            <dt>Threshold</dt><dd>{settings.thresholdAudio}</dd>
            <dt>Margin</dt><dd>{settings.margin}</dd>
            <dt>Smooth</dt><dd>{settings.smoothEnabled ? `${settings.smoothMincut}, ${settings.smoothMinclip}` : 'kapalı'}</dd>
            <dt>Export format</dt><dd>{settings.exportFormat}</dd>
            <dt>Output</dt><dd>{settings.outputDir ?? 'kaynak dosyanın yanı'}</dd>
          </dl>
          <CardSeparator />
          <label className="mt-3 flex items-center gap-2 text-sm text-text-secondary">
            <input type="checkbox" checked={settings.devShowCommand} onChange={(e) => patch({ devShowCommand: e.target.checked })} />
            Project ekranında command preview göster
          </label>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Güncelleme" description="App açıkken 6 saatte bir otomatik kontrol edilir." />
        <CardBody>
          <Button variant="outline" size="sm" onClick={() => void ipc.update.check()}>Güncelleme kontrol et</Button>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Loglar" description="Sorun olduğunda log dosyalarını paylaş." />
        <CardBody>
          <Button variant="outline" size="sm" leading={<FolderOpen className="h-3.5 w-3.5" />} onClick={() => void ipc.shell.openLogs()}>Log klasörünü aç</Button>
        </CardBody>
      </Card>
    </div>
  )
}
