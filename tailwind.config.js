import { colors, fontStack, radius, shadow } from './src/theme/tokens.ts'
import animate from 'tailwindcss-animate'

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{ts,tsx,html}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: colors.bg,
        edge: colors.edge,
        text: colors.text,
        accent: colors.accent,
        critical: colors.critical,
        success: colors.success,
        warning: colors.warning
      },
      fontFamily: {
        sans: fontStack.sans.split(','),
        mono: fontStack.mono.split(',')
      },
      borderRadius: radius,
      boxShadow: shadow,
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
        '3xl': ['32px', { lineHeight: '38px' }]
      },
      letterSpacing: {
        tightest: '-0.04em',
        tight: '-0.02em',
        wider: '0.08em'
      }
    }
  },
  plugins: [animate]
}
