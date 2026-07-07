import type { ThemeName } from '../theme/themes'

export interface ChartColors {
  line: string
  fill: string
  point: string
  grid: string
  tick: string
}

// Chart.js cannot read CSS custom properties, so chart colors are defined here
// per theme. Keep these in sync with the --chart-* variables in theme.css.
export const CHART_COLORS: Record<ThemeName, ChartColors> = {
  light: {
    line: '#d9534f',
    fill: 'rgba(217, 83, 79, 0.15)',
    point: '#d9534f',
    grid: 'rgba(0, 0, 0, 0.06)',
    tick: '#777777',
  },
  dark: {
    line: '#ff8a85',
    fill: 'rgba(255, 138, 133, 0.18)',
    point: '#ff8a85',
    grid: 'rgba(255, 255, 255, 0.08)',
    tick: '#9aa1ad',
  },
  midnight: {
    line: '#b083ff',
    fill: 'rgba(176, 131, 255, 0.20)',
    point: '#ff7ac6',
    grid: 'rgba(176, 131, 255, 0.12)',
    tick: '#9fa3d4',
  },
  solarized: {
    line: '#cb4b16',
    fill: 'rgba(203, 75, 22, 0.15)',
    point: '#cb4b16',
    grid: 'rgba(7, 54, 66, 0.10)',
    tick: '#657b83',
  },
}

export function getChartColors(theme: ThemeName): ChartColors {
  return CHART_COLORS[theme]
}
