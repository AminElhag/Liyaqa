import type { ReactNode } from 'react'
import { useDirection } from '@/hooks/use-direction'
import { DirectionContext } from '@/lib/direction-context'

export function DirectionProvider({ children }: { children: ReactNode }) {
  const directionValue = useDirection()

  return (
    <DirectionContext.Provider value={directionValue}>
      {children}
    </DirectionContext.Provider>
  )
}
