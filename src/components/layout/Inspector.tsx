import * as Collapsible from '@radix-ui/react-collapsible'
import { ChevronDown } from 'lucide-react'
import { type ReactNode, useState } from 'react'

interface SectionProps {
  title: string
  defaultOpen?: boolean
  trailing?: ReactNode
  children: ReactNode
}

export function InspectorSection({ title, defaultOpen = true, trailing, children }: SectionProps) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <Collapsible.Root open={open} onOpenChange={setOpen}>
      <div className="border-b border-edge-subtle">
        <Collapsible.Trigger asChild>
          <button className="flex w-full items-center gap-2 px-4 py-2.5 text-left hover:bg-white/[0.02] transition-colors duration-fast">
            <ChevronDown
              className={`h-3.5 w-3.5 text-text-muted transition-transform duration-fast ease-out ${
                open ? '' : '-rotate-90'
              }`}
            />
            <span className="flex-1 text-micro">{title}</span>
            {trailing}
          </button>
        </Collapsible.Trigger>
        <Collapsible.Content className="overflow-hidden data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0">
          <div className="space-y-4 px-4 pb-4">{children}</div>
        </Collapsible.Content>
      </div>
    </Collapsible.Root>
  )
}

export function Inspector({ children }: { children: ReactNode }) {
  return (
    <aside className="flex w-[340px] flex-col border-l border-edge-subtle bg-bg-base/40">
      <div className="overflow-y-auto">{children}</div>
    </aside>
  )
}
