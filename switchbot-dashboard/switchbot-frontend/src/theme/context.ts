import { createContext, useContext } from 'react'
import type { ChartColors, ThemeId } from './themes'

export interface ThemeContextValue {
  theme: ThemeId
  setTheme: (theme: ThemeId) => void
  chartColors: ChartColors
}

export const ThemeContext = createContext<ThemeContextValue | null>(null)

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>')
  return ctx
}
