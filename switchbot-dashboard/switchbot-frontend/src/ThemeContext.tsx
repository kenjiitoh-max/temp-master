import {
  type ReactNode,
  useEffect,
  useState,
} from 'react'
import { ThemeContext, type Theme } from './theme'
import type { ChartColors } from './theme'

const STORAGE_KEY = 'temp-master-theme'
export type { Theme } from './theme'

function initialTheme(): Theme {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (
    stored === 'light' ||
    stored === 'dark' ||
    stored === 'high-contrast' ||
    stored === 'ocean'
  ) {
    return stored
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

const INITIAL_THEME = initialTheme()
document.documentElement.dataset.theme = INITIAL_THEME

function readChartColors(): ChartColors {
  const styles = getComputedStyle(document.documentElement)
  return {
    line: styles.getPropertyValue('--chart-line').trim(),
    grid: styles.getPropertyValue('--chart-grid').trim(),
    axis: styles.getPropertyValue('--chart-axis').trim(),
    tooltipBackground: styles.getPropertyValue('--chart-tooltip-bg').trim(),
    tooltipText: styles.getPropertyValue('--chart-tooltip-text').trim(),
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(INITIAL_THEME)
  const [chartColors, setChartColors] = useState<ChartColors>(readChartColors)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem(STORAGE_KEY, theme)
    setChartColors(readChartColors())
  }, [theme])

  const setTheme = (nextTheme: Theme) => setThemeState(nextTheme)

  return (
    <ThemeContext.Provider value={{ theme, setTheme, chartColors }}>
      {children}
    </ThemeContext.Provider>
  )
}
