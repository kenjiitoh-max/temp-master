export type ThemeName = 'dark' | 'light' | 'solarized' | 'ocean'

export interface ChartColors {
  line: string
  fill: string
  point: string
  pointHover: string
  grid: string
  axis: string
  tooltipBg: string
  tooltipText: string
}

export interface ThemeMeta {
  name: ThemeName
  label: string
}

export const THEMES: ThemeMeta[] = [
  { name: 'dark', label: 'Dark' },
  { name: 'light', label: 'Light' },
  { name: 'solarized', label: 'Solarized' },
  { name: 'ocean', label: 'Ocean' },
]

export const THEME_NAMES: ThemeName[] = THEMES.map((t) => t.name)

export function isThemeName(value: unknown): value is ThemeName {
  return typeof value === 'string' && (THEME_NAMES as string[]).includes(value)
}

// Chart palettes mirror each theme's CSS variables so Recharts colors change
// together with the rest of the UI when the theme is switched.
export const CHART_COLORS: Record<ThemeName, ChartColors> = {
  dark: {
    line: '#ff6b6b',
    fill: 'rgba(255, 107, 107, 0.18)',
    point: '#ff6b6b',
    pointHover: '#4dd0e1',
    grid: 'rgba(255, 255, 255, 0.08)',
    axis: '#9aa4b2',
    tooltipBg: '#1e2530',
    tooltipText: '#e6e9ef',
  },
  light: {
    line: '#d9534f',
    fill: 'rgba(217, 83, 79, 0.15)',
    point: '#d9534f',
    pointHover: '#5bc0de',
    grid: 'rgba(0, 0, 0, 0.06)',
    axis: '#777777',
    tooltipBg: '#ffffff',
    tooltipText: '#333333',
  },
  solarized: {
    line: '#cb4b16',
    fill: 'rgba(203, 75, 22, 0.15)',
    point: '#cb4b16',
    pointHover: '#2aa198',
    grid: 'rgba(101, 123, 131, 0.18)',
    axis: '#657b83',
    tooltipBg: '#eee8d5',
    tooltipText: '#586e75',
  },
  ocean: {
    line: '#00d1b2',
    fill: 'rgba(0, 209, 178, 0.16)',
    point: '#00d1b2',
    pointHover: '#7fdbff',
    grid: 'rgba(127, 219, 255, 0.12)',
    axis: '#8fa8bf',
    tooltipBg: '#0b2a3a',
    tooltipText: '#d6ecf7',
  },
}
