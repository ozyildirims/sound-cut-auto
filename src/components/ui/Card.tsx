import { type HTMLAttributes, type ReactNode } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'surface' | 'elev' | 'flat'
}

export function Card({ variant = 'surface', className = '', ...rest }: CardProps) {
  const base = 'rounded-lg'
  const styles = {
    surface:
      'border border-edge bg-gradient-to-b from-bg-surface to-[#18181e] shadow-card',
    elev: 'border border-edge-subtle bg-bg-elev',
    flat: 'border border-edge-subtle bg-bg-surface/40'
  }[variant]
  return <div className={[base, styles, className].join(' ')} {...rest} />
}

export function CardHeader({
  title,
  description,
  trailing,
  children
}: {
  title?: ReactNode
  description?: ReactNode
  trailing?: ReactNode
  children?: ReactNode
}) {
  return (
    <div className="flex items-start justify-between gap-3 p-4 pb-3">
      <div className="min-w-0 flex-1">
        {title && (
          <div className="text-md font-semibold tracking-tight text-text-primary">{title}</div>
        )}
        {description && <div className="mt-0.5 text-xs text-text-secondary">{description}</div>}
        {children}
      </div>
      {trailing}
    </div>
  )
}

export function CardBody({ className = '', ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={['px-4 pb-4', className].join(' ')} {...rest} />
}

export function CardSeparator() {
  return <div className="h-px bg-edge-subtle" />
}
