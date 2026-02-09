import { useContext } from 'react'
import { DirectionContext } from '@/lib/direction-context'

export function useDirectionContext() {
  const ctx = useContext(DirectionContext)
  if (!ctx) throw new Error('useDirectionContext must be used within DirectionProvider')
  return ctx
}
