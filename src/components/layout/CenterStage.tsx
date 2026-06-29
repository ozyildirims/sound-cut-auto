import { type ReactNode } from 'react'

export function CenterStage({ children }: { children: ReactNode }) {
  return (
    <main className="relative flex flex-1 flex-col overflow-y-auto bg-bg-base/30">
      {children}
    </main>
  )
}
