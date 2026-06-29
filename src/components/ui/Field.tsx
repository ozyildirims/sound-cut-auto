import { type ReactNode } from 'react'

interface Props {
  label?: ReactNode
  hint?: ReactNode
  trailing?: ReactNode
  children: ReactNode
}

export function Field({ label, hint, trailing, children }: Props) {
  return (
    <div className="space-y-2">
      {(label || trailing) && (
        <div className="flex items-center justify-between">
          {label && <div className="text-micro">{label}</div>}
          {trailing}
        </div>
      )}
      {children}
      {hint && <div className="text-xs text-text-muted">{hint}</div>}
    </div>
  )
}

export function Input({
  className = '',
  ...rest
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={[
        'h-9 w-full rounded-md border border-edge bg-bg-elev2 px-3 text-sm text-text-primary',
        'placeholder:text-text-muted focus:outline-none focus:border-accent/60 focus:ring-2 focus:ring-accent/30',
        'transition-colors duration-fast ease-out',
        'disabled:opacity-40 disabled:cursor-not-allowed',
        className
      ].join(' ')}
      {...rest}
    />
  )
}
