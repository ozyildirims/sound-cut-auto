import * as RT from '@radix-ui/react-tooltip'
import { type ReactNode } from 'react'

interface Props {
  content: ReactNode
  side?: 'top' | 'right' | 'bottom' | 'left'
  children: ReactNode
}

export function Tooltip({ content, side = 'bottom', children }: Props) {
  return (
    <RT.Provider delayDuration={200} skipDelayDuration={100}>
      <RT.Root>
        <RT.Trigger asChild>{children}</RT.Trigger>
        <RT.Portal>
          <RT.Content
            side={side}
            sideOffset={6}
            className="z-50 rounded-md border border-edge bg-bg-elev px-2.5 py-1.5 text-xs text-text-primary shadow-float animate-in fade-in-0 zoom-in-95"
          >
            {content}
            <RT.Arrow className="fill-edge" />
          </RT.Content>
        </RT.Portal>
      </RT.Root>
    </RT.Provider>
  )
}
