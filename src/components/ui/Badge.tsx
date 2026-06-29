import { type HTMLAttributes } from 'react'

type Tone = 'neutral' | 'accent' | 'success' | 'warning' | 'critical' | 'subtle'
type Size = 'sm' | 'md'

interface Props extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone
  size?: Size
  dot?: boolean
}

const TONES: Record<Tone, string> = {
  neutral: 'bg-bg-elev2 text-text-secondary border border-edge',
  subtle: 'bg-white/5 text-text-secondary',
  accent: 'bg-accent/15 text-accent border border-accent/30',
  success: 'bg-success/15 text-success border border-success/30',
  warning: 'bg-warning/15 text-warning border border-warning/30',
  critical: 'bg-critical/15 text-critical border border-critical/30'
}

const SIZES: Record<Size, string> = {
  sm: 'h-5 px-1.5 text-2xs gap-1',
  md: 'h-6 px-2 text-xs gap-1.5'
}

const DOTS: Record<Tone, string> = {
  neutral: 'bg-text-muted',
  subtle: 'bg-text-muted',
  accent: 'bg-accent',
  success: 'bg-success',
  warning: 'bg-warning',
  critical: 'bg-critical'
}

export function Badge({ tone = 'neutral', size = 'md', dot, className = '', children, ...rest }: Props) {
  return (
    <span
      className={[
        'inline-flex items-center rounded-full font-medium tracking-wider uppercase',
        TONES[tone],
        SIZES[size],
        className
      ].join(' ')}
      {...rest}
    >
      {dot && <span className={['h-1.5 w-1.5 rounded-full', DOTS[tone]].join(' ')} />}
      {children}
    </span>
  )
}
