import { createContext } from 'react'
import type { useDirection } from '@/hooks/use-direction'

export type DirectionContextValue = ReturnType<typeof useDirection>

export const DirectionContext = createContext<DirectionContextValue | null>(null)
