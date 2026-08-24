import { createContext } from 'react'

export type Theme = 'light' | 'dark' | 'high-contrast' | 'ocean'

export type ChartColors = {
  line: string
  grid: string
  axis: string
  tooltipBackground: string
  tooltipText: string
}

export type ThemeContextValue = {
  theme: Theme
  setTheme: (theme: Theme) => void
  chartColors: ChartColors
}

export const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)
