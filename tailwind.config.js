import animate from 'tailwindcss-animate'

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{ts,tsx,html}'],
  // Theming is driven entirely by CSS variables on <html data-theme="…">,
  // so we don't lean on Tailwind's dark variant. Colours below are var()
  // references — utilities like `bg-bg-zenith` resolve through the var
  // and update instantly on theme swap.
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: {
          zenith: 'rgb(var(--bg-zenith) / <alpha-value>)',
          base: 'rgb(var(--bg-base) / <alpha-value>)',
          surface: 'rgb(var(--bg-surface) / <alpha-value>)',
          elev: 'rgb(var(--bg-elev) / <alpha-value>)',
          elev2: 'rgb(var(--bg-elev2) / <alpha-value>)'
        },
        edge: {
          DEFAULT: 'rgb(var(--edge) / <alpha-value>)',
          subtle: 'rgb(var(--edge-subtle) / <alpha-value>)',
          strong: 'rgb(var(--edge-strong) / <alpha-value>)'
        },
        text: {
          primary: 'rgb(var(--text-primary) / <alpha-value>)',
          secondary: 'rgb(var(--text-secondary) / <alpha-value>)',
          muted: 'rgb(var(--text-muted) / <alpha-value>)',
          disabled: 'rgb(var(--text-disabled) / <alpha-value>)'
        },
        accent: {
          DEFAULT: 'rgb(var(--accent) / <alpha-value>)',
          muted: 'rgb(var(--accent-muted) / <alpha-value>)'
        },
        critical: 'rgb(var(--critical) / <alpha-value>)',
        success: 'rgb(var(--success) / <alpha-value>)',
        warning: 'rgb(var(--warning) / <alpha-value>)'
      },
      fontFamily: {
        sans: [
          'Inter Variable',
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'SF Pro Display',
          'Segoe UI',
          'system-ui',
          'sans-serif'
        ],
        mono: ['JetBrains Mono', 'Geist Mono', 'ui-monospace', 'monospace']
      },
      borderRadius: {
        sm: '6px',
        md: '10px',
        lg: '14px',
        xl: '20px',
        '2xl': '28px'
      },
      boxShadow: {
        card: '0 1px 2px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.14)',
        float: '0 12px 32px rgba(0,0,0,0.32)',
        glow: '0 0 32px rgb(var(--accent) / 0.20)',
        soft: '0 1px 2px rgba(0,0,0,0.08)'
      },
      transitionTimingFunction: {
        out: 'cubic-bezier(0.16, 1, 0.3, 1)',
        spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)'
      },
      transitionDuration: {
        fast: '150ms',
        med: '200ms'
      },
      fontSize: {
        '2xs': ['10px', { lineHeight: '14px' }],
        xs: ['11px', { lineHeight: '15px' }],
        sm: ['12px', { lineHeight: '16px' }],
        base: ['13px', { lineHeight: '18px' }],
        md: ['14px', { lineHeight: '20px' }],
        lg: ['16px', { lineHeight: '22px' }],
        xl: ['20px', { lineHeight: '26px' }],
        '2xl': ['24px', { lineHeight: '30px' }],
        '3xl': ['32px', { lineHeight: '38px' }],
        '4xl': ['40px', { lineHeight: '46px' }]
      },
      letterSpacing: {
        tightest: '-0.04em',
        tight: '-0.02em',
        wider: '0.08em'
      },
      keyframes: {
        breathe: {
          '0%, 100%': { opacity: '0.7', transform: 'scaleY(0.85)' },
          '50%': { opacity: '1', transform: 'scaleY(1)' }
        }
      },
      animation: {
        breathe: 'breathe 2.4s ease-in-out infinite'
      }
    }
  },
  plugins: [animate]
}
