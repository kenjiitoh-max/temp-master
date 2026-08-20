/**
 * Theme registry. Adding a theme only requires appending an entry here:
 * tokens become CSS custom properties and chart colors are read by Recharts.
 */
export interface ThemeTokens {
  bg: string
  panel: string
  panelHeader: string
  border: string
  text: string
  textMuted: string
  accent: string
  accentText: string
  temperature: string
  humidity: string
  battery: string
  infoBg: string
  infoText: string
  warningBg: string
  warningText: string
  dangerBg: string
  dangerText: string
  successBg: string
  successText: string
  chartLine: string
  chartFill: string
  chartGrid: string
  chartAxis: string
  chartTooltipBg: string
}

export interface Theme {
  id: string
  label: string
  /** Used for the native form controls / scrollbars rendering. */
  colorScheme: 'light' | 'dark'
  tokens: ThemeTokens
}

export const THEMES: Theme[] = [
  {
    id: 'light',
    label: 'Light',
    colorScheme: 'light',
    tokens: {
      bg: '#f2f4f7',
      panel: '#ffffff',
      panelHeader: '#f8fafc',
      border: '#dde3ea',
      text: '#1f2933',
      textMuted: '#6b7684',
      accent: '#2563eb',
      accentText: '#ffffff',
      temperature: '#d9534f',
      humidity: '#0ea5e9',
      battery: '#16a34a',
      infoBg: '#e0f2fe',
      infoText: '#075985',
      warningBg: '#fef3c7',
      warningText: '#92400e',
      dangerBg: '#fee2e2',
      dangerText: '#991b1b',
      successBg: '#dcfce7',
      successText: '#166534',
      chartLine: '#d9534f',
      chartFill: 'rgba(217, 83, 79, 0.18)',
      chartGrid: 'rgba(0, 0, 0, 0.08)',
      chartAxis: '#6b7684',
      chartTooltipBg: '#ffffff',
    },
  },
  {
    id: 'dark',
    label: 'Dark',
    colorScheme: 'dark',
    tokens: {
      bg: '#0f172a',
      panel: '#1a2437',
      panelHeader: '#212d43',
      border: '#31405c',
      text: '#e6edf7',
      textMuted: '#9aa8bd',
      accent: '#60a5fa',
      accentText: '#0b1220',
      temperature: '#fb7185',
      humidity: '#38bdf8',
      battery: '#4ade80',
      infoBg: '#173045',
      infoText: '#93c5fd',
      warningBg: '#42320f',
      warningText: '#fcd34d',
      dangerBg: '#451a1f',
      dangerText: '#fca5a5',
      successBg: '#14361f',
      successText: '#86efac',
      chartLine: '#fb7185',
      chartFill: 'rgba(251, 113, 133, 0.22)',
      chartGrid: 'rgba(255, 255, 255, 0.12)',
      chartAxis: '#9aa8bd',
      chartTooltipBg: '#1a2437',
    },
  },
]

export const DEFAULT_THEME_ID = 'light'

export function findTheme(id: string | null): Theme | undefined {
  return THEMES.find((theme) => theme.id === id)
}
