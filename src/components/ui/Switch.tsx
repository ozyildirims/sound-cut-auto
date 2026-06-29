import * as RS from '@radix-ui/react-switch'
import { type ComponentProps } from 'react'

type Props = ComponentProps<typeof RS.Root>

export function Switch({ className = '', ...rest }: Props) {
  return (
    <RS.Root
      className={[
        'relative h-5 w-9 rounded-full bg-bg-elev2 transition-colors duration-fast ease-out',
        'data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-accent data-[state=checked]:to-accent-muted',
        'focus:outline-none focus:ring-2 focus:ring-accent/45',
        className
      ].join(' ')}
      {...rest}
    >
      <RS.Thumb className="block h-4 w-4 translate-x-0.5 rounded-full bg-text-primary shadow-card transition-transform duration-fast ease-spring data-[state=checked]:translate-x-[18px]" />
    </RS.Root>
  )
}
