export const THEMES = ['light', 'dark', 'midnight'] as const
export type Theme = (typeof THEMES)[number]

export const THEME_LABELS: Record<Theme, string> = {
  light: 'Light',
  dark: 'Dark',
  midnight: 'Midnight',
}

export const THEME_STORAGE_KEY = 'temp-master-theme'
export const DEFAULT_THEME: Theme = 'light'

export function isTheme(value: unknown): value is Theme {
  return typeof value === 'string' && (THEMES as readonly string[]).includes(value)
}

export interface ChartPalette {
  line: string
  fill: string
  point: string
  pointHover: string
  grid: string
  tick: string
  tooltipBg: string
  tooltipFg: string
}

export function readChartPalette(theme: Theme): ChartPalette {
  const root = document.documentElement
  if (root.getAttribute('data-theme') !== theme) root.setAttribute('data-theme', theme)
  const style = getComputedStyle(document.documentElement)
  const v = (name: string) => style.getPropertyValue(name).trim()
  return {
    line: v('--chart-line'),
    fill: v('--chart-fill'),
    point: v('--chart-point'),
    pointHover: v('--chart-point-hover'),
    grid: v('--chart-grid'),
    tick: v('--chart-tick'),
    tooltipBg: v('--chart-tooltip-bg'),
    tooltipFg: v('--chart-tooltip-fg'),
  }
}
