import { useContext } from 'react'
import { ThemeContext } from '@/lib/theme-context'

export function useThemeContext() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useThemeContext must be used within ThemeProvider')
  return ctx
}
