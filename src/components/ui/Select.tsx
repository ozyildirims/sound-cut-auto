import * as RS from '@radix-ui/react-select'
import { Check, ChevronDown } from 'lucide-react'
import { forwardRef, type ReactNode } from 'react'

export const SelectRoot = RS.Root
export const SelectValue = RS.Value

interface TriggerProps {
  className?: string
  children?: ReactNode
  placeholder?: string
}

export const SelectTrigger = forwardRef<HTMLButtonElement, TriggerProps>(function SelectTrigger(
  { className = '', children, placeholder },
  ref
) {
  return (
    <RS.Trigger
      ref={ref}
      className={[
        'flex h-9 w-full items-center justify-between rounded-md border border-edge bg-bg-elev2 px-3 text-sm text-text-primary',
        'hover:border-edge-strong focus:outline-none focus:border-accent/60 focus:ring-2 focus:ring-accent/30',
        'transition-colors duration-fast ease-out',
        className
      ].join(' ')}
    >
      <RS.Value placeholder={placeholder} />
      {children}
      <RS.Icon>
        <ChevronDown className="h-4 w-4 text-text-muted" />
      </RS.Icon>
    </RS.Trigger>
  )
})

interface ContentProps {
  children: ReactNode
}

export function SelectContent({ children }: ContentProps) {
  return (
    <RS.Portal>
      <RS.Content
        position="popper"
        sideOffset={6}
        className="z-50 min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-lg border border-edge bg-bg-elev shadow-float animate-in fade-in-0 zoom-in-95"
      >
        <RS.Viewport className="p-1">{children}</RS.Viewport>
      </RS.Content>
    </RS.Portal>
  )
}

interface ItemProps {
  value: string
  children: ReactNode
  description?: ReactNode
}

export function SelectItem({ value, children, description }: ItemProps) {
  return (
    <RS.Item
      value={value}
      className="relative flex cursor-pointer flex-col rounded px-3 py-2 pl-8 text-sm text-text-primary outline-none data-[highlighted]:bg-accent/15 data-[highlighted]:text-accent"
    >
      <RS.ItemText>{children}</RS.ItemText>
      {description && <span className="text-xs text-text-muted">{description}</span>}
      <RS.ItemIndicator className="absolute left-2 top-2.5">
        <Check className="h-4 w-4 text-accent" />
      </RS.ItemIndicator>
    </RS.Item>
  )
}
