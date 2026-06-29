import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'critical'
type Size = 'sm' | 'md' | 'lg' | 'icon'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  leading?: ReactNode
  trailing?: ReactNode
  active?: boolean
}

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-gradient-to-b from-accent to-accent-muted text-bg-zenith hover:from-accent hover:to-accent shadow-[0_1px_0_0_rgba(255,255,255,0.15)_inset,0_0_0_1px_rgba(0,0,0,0.2)] hover:shadow-[0_0_0_1px_rgba(245,185,66,0.5),0_4px_12px_rgba(245,185,66,0.25)]',
  secondary:
    'bg-bg-elev text-text-primary border border-edge hover:bg-bg-elev2 hover:border-edge-strong',
  ghost: 'text-text-secondary hover:text-text-primary hover:bg-white/5',
  outline:
    'border border-edge text-text-primary hover:bg-white/5 hover:border-edge-strong',
  critical: 'bg-critical/15 text-critical border border-critical/30 hover:bg-critical/20'
}

const SIZES: Record<Size, string> = {
  sm: 'h-7 px-2.5 text-xs gap-1.5',
  md: 'h-9 px-3.5 text-sm gap-2',
  lg: 'h-11 px-5 text-md gap-2',
  icon: 'h-8 w-8 p-0'
}

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { variant = 'secondary', size = 'md', leading, trailing, active, className = '', children, ...rest },
  ref
) {
  return (
    <button
      ref={ref}
      data-active={active || undefined}
      className={[
        'inline-flex items-center justify-center rounded-md font-medium',
        'transition-colors duration-fast ease-out',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/45',
        'disabled:opacity-40 disabled:cursor-not-allowed',
        'data-[active=true]:bg-accent/15 data-[active=true]:text-accent',
        VARIANTS[variant],
        SIZES[size],
        className
      ].join(' ')}
      {...rest}
    >
      {leading}
      {children}
      {trailing}
    </button>
  )
})
