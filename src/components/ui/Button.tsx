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

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: [
    'text-white',
    'bg-gradient-to-b from-accent to-accent-muted',
    'shadow-[inset_0_1px_0_rgb(255_255_255_/_0.18),0_1px_0_rgb(0_0_0_/_0.12),0_0_0_1px_rgb(var(--accent)_/_0.45),0_0_24px_-4px_rgb(var(--accent)_/_0.55)]',
    'hover:shadow-[inset_0_1px_0_rgb(255_255_255_/_0.22),0_2px_8px_rgb(var(--accent)_/_0.35),0_0_0_1px_rgb(var(--accent)_/_0.65),0_0_32px_-2px_rgb(var(--accent)_/_0.7)]',
    'active:translate-y-[0.5px] active:duration-75'
  ].join(' '),
  secondary: 'bg-bg-elev text-text-primary border border-edge hover:bg-bg-elev2 hover:border-edge-strong',
  ghost: 'text-text-secondary hover:text-text-primary hover:bg-text-primary/[0.06]',
  outline: 'border border-edge text-text-primary hover:bg-text-primary/[0.04] hover:border-edge-strong',
  critical: 'bg-critical/15 text-critical border border-critical/30 hover:bg-critical/20'
}

const SIZE_CLASSES: Record<Size, string> = {
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
        'transition-all duration-200 ease-out',
        'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent/55',
        'disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none',
        'data-[active=true]:bg-accent/15 data-[active=true]:text-accent',
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
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
