// Single source of truth for visual tokens. Tailwind theme + bespoke CSS
// vars both derive from this; runtime code (charts, generated SVG, dynamic
// styles) reads from here directly so we never drift between layers.

export const colors = {
  bg: {
    zenith: '#0a0a0b',
    base: '#0f0f12',
    surface: '#16161b',
    elev: '#1c1c22',
    elev2: '#232329'
  },
  edge: {
    DEFAULT: '#2a2a32',
    subtle: '#1d1d24',
    strong: '#3a3a44'
  },
  text: {
    primary: '#fafaf9',
    secondary: '#a3a3a3',
    muted: '#6b6b73',
    disabled: '#44444a'
  },
  accent: {
    DEFAULT: '#f5b942',
    muted: '#c19938',
    glow: 'rgba(245, 185, 66, 0.18)',
    soft: 'rgba(245, 185, 66, 0.10)',
    ring: 'rgba(245, 185, 66, 0.45)'
  },
  critical: '#f87171',
  success: '#4ade80',
  warning: '#fbbf24'
} as const

export const gradients = {
  zenith: 'linear-gradient(180deg, #0a0a0b 0%, #14141a 100%)',
  surface: 'linear-gradient(180deg, #16161b 0%, #18181e 100%)',
  accent: 'linear-gradient(135deg, #f5b942 0%, #d9a02e 100%)',
  accentSoft: 'linear-gradient(135deg, rgba(245,185,66,0.18) 0%, rgba(217,160,46,0.10) 100%)'
} as const

export const radius = {
  sm: '6px',
  md: '10px',
  lg: '14px',
  xl: '20px',
  full: '9999px'
} as const

export const shadow = {
  card: '0 1px 2px rgba(0,0,0,0.4), 0 2px 6px rgba(0,0,0,0.3)',
  float: '0 8px 24px rgba(0,0,0,0.5)',
  glow: '0 0 24px rgba(245,185,66,0.15)',
  ring: '0 0 0 1px rgba(245,185,66,0.45)'
} as const

export const motion = {
  durations: { fast: '150ms', med: '200ms', slow: '300ms' },
  easings: {
    out: 'cubic-bezier(0.16, 1, 0.3, 1)',
    spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)'
  }
} as const

export const fontStack = {
  sans:
    '"Inter Variable", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
  mono:
    '"JetBrains Mono", "Geist Mono", ui-monospace, SFMono-Regular, Menlo, monospace'
} as const
