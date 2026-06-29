import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertCircle, RotateCcw } from 'lucide-react'

interface Props {
  children: ReactNode
}
interface State {
  error: Error | null
  info: ErrorInfo | null
}

// Last-resort catch. Without this a render-time exception white-screens the
// whole window and there's no way to tell what blew up from a packaged build.
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null, info: null }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    this.setState({ info })
    // Forward to main so it lands in the rotated electron-log file.
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(window as any).autocut?.diag?.reportError?.({
        message: error.message,
        stack: error.stack ?? null,
        componentStack: info.componentStack ?? null
      })
    } catch {
      /* noop */
    }
  }

  render(): ReactNode {
    if (!this.state.error) return this.props.children
    const { error, info } = this.state
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-8">
        <AlertCircle className="h-10 w-10 text-rose-400" />
        <h1 className="text-xl font-semibold text-zinc-100">Bir şey patladı</h1>
        <p className="max-w-xl text-center text-sm text-zinc-400">
          UI render edilirken bir hata oluştu. Aşağıdaki teknik detayı paylaşırsan
          düzeltebiliriz. Uygulamayı yeniden yüklemek genelde çalışır.
        </p>
        <pre className="max-h-64 max-w-3xl overflow-auto rounded-md border border-edge bg-bg-elev p-3 text-left text-xs text-rose-200">
          {error.message}
          {error.stack ? '\n\n' + error.stack : ''}
          {info?.componentStack ? '\n\nComponent stack:' + info.componentStack : ''}
        </pre>
        <button className="btn-primary" onClick={() => window.location.reload()}>
          <RotateCcw className="h-4 w-4" /> Yeniden yükle
        </button>
      </div>
    )
  }
}
