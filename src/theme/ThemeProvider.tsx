import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'

type Theme = 'light' | 'dark'

interface Ctx {
  theme: Theme
  toggle: () => void
  set: (t: Theme) => void
}

const ThemeContext = createContext<Ctx | null>(null)

const STORAGE_KEY = 'sca:theme'

function readPreferred(): Theme {
  if (typeof window === 'undefined') return 'dark'
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (stored === 'light' || stored === 'dark') return stored
  } catch { /* noop */ }
  if (window.matchMedia?.('(prefers-color-scheme: light)').matches) return 'light'
  return 'dark'
}

function applyTheme(t: Theme) {
  document.documentElement.setAttribute('data-theme', t)
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => readPreferred())

  useEffect(() => {
    applyTheme(theme)
    try { window.localStorage.setItem(STORAGE_KEY, theme) } catch { /* noop */ }
  }, [theme])

  const toggle = useCallback(() => setTheme((t) => (t === 'light' ? 'dark' : 'light')), [])
  const set = useCallback((t: Theme) => setTheme(t), [])

  return (
    <ThemeContext.Provider value={{ theme, toggle, set }}>{children}</ThemeContext.Provider>
  )
}

export function useTheme(): Ctx {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be inside ThemeProvider')
  return ctx
}
