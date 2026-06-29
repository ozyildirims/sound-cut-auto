import * as RS from '@radix-ui/react-slider'
import { type ComponentProps } from 'react'

type Props = ComponentProps<typeof RS.Root>

export function Slider({ className = '', ...rest }: Props) {
  return (
    <RS.Root
      className={['relative flex h-5 w-full touch-none select-none items-center', className].join(' ')}
      {...rest}
    >
      <RS.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-bg-elev2">
        <RS.Range className="absolute h-full accent-gradient" />
      </RS.Track>
      <RS.Thumb
        className="block h-4 w-4 rounded-full border border-edge bg-text-primary shadow-card transition-transform duration-fast ease-spring hover:scale-110 focus:outline-none focus:ring-2 focus:ring-accent/45"
        aria-label="value"
      />
    </RS.Root>
  )
}
