import { Contrast, Moon, Sparkles, Sun, type LucideIcon } from 'lucide-react'

export const THEME_IDS = ['light', 'dark', 'contrast', 'neon'] as const
export type ThemeId = (typeof THEME_IDS)[number]

export const THEMES: { id: ThemeId; label: string; icon: LucideIcon }[] = [
  { id: 'light', label: 'Light', icon: Sun },
  { id: 'dark', label: 'Dark', icon: Moon },
  { id: 'contrast', label: 'High Contrast', icon: Contrast },
  { id: 'neon', label: 'Neon', icon: Sparkles },
]

export const THEME_STORAGE_KEY = 'temp-master-theme'

export function isThemeId(value: unknown): value is ThemeId {
  return typeof value === 'string' && (THEME_IDS as readonly string[]).includes(value)
}

export function getStoredTheme(): ThemeId | null {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY)
    return isThemeId(stored) ? stored : null
  } catch {
    return null
  }
}

export function getSystemTheme(): ThemeId {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export interface ChartColors {
  line: string
  grid: string
  axis: string
  activeDot: string
  tooltipBg: string
  tooltipFg: string
  tooltipBorder: string
}

const CHART_VARS: Record<keyof ChartColors, string> = {
  line: '--chart-line',
  grid: '--chart-grid',
  axis: '--chart-axis',
  activeDot: '--chart-active-dot',
  tooltipBg: '--chart-tooltip-bg',
  tooltipFg: '--chart-tooltip-fg',
  tooltipBorder: '--chart-tooltip-border',
}

// Recharts は SVG 属性に色を渡すので、CSS 変数を実際の色の文字列に解決してから渡す
export function readChartColors(): ChartColors {
  const style = getComputedStyle(document.documentElement)
  const entries = Object.entries(CHART_VARS).map(([key, cssVar]) => [
    key,
    style.getPropertyValue(cssVar).trim(),
  ])
  return Object.fromEntries(entries) as ChartColors
}
