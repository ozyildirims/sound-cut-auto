import React from 'react'
import ReactDOM from 'react-dom/client'
import { App } from './App'
import { ErrorBoundary } from './components/system/ErrorBoundary'
import { ipc } from './ipc/client'
import './styles/globals.css'

const root = document.getElementById('root')
if (!root) throw new Error('root element missing')

// Forward uncaught runtime errors to main so packaged users can share logs
// instead of staring at a white window.
window.addEventListener('error', (e) => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(ipc as any)?.diag?.reportError?.({
      message: e.message,
      stack: e.error?.stack ?? null,
      source: 'window.onerror'
    })
  } catch { /* noop */ }
})
window.addEventListener('unhandledrejection', (e) => {
  try {
    const reason = e.reason
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(ipc as any)?.diag?.reportError?.({
      message: reason?.message ?? String(reason),
      stack: reason?.stack ?? null,
      source: 'unhandledrejection'
    })
  } catch { /* noop */ }
})

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
)
