import type { ReactNode } from 'react'
import { useTheme } from '@/hooks/use-theme'
import { ThemeContext } from '@/lib/theme-context'

export function ThemeProvider({ children }: { children: ReactNode }) {
  const themeValue = useTheme()

  return (
    <ThemeContext.Provider value={themeValue}>
      {children}
    </ThemeContext.Provider>
  )
}
