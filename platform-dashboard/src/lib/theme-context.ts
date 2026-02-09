import { createContext } from 'react'
import type { useTheme } from '@/hooks/use-theme'

export type ThemeContextValue = ReturnType<typeof useTheme>

export const ThemeContext = createContext<ThemeContextValue | null>(null)
