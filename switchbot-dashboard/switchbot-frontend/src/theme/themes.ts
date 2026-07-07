export const THEMES = ['light', 'dark', 'midnight', 'solarized'] as const

export type ThemeName = (typeof THEMES)[number]

export const THEME_LABELS: Record<ThemeName, string> = {
  light: 'Light',
  dark: 'Dark',
  midnight: 'Midnight',
  solarized: 'Solarized',
}

export const DEFAULT_THEME: ThemeName = 'light'

export const STORAGE_KEY = 'temp-master-theme'

export function isThemeName(value: string | null): value is ThemeName {
  return value !== null && (THEMES as readonly string[]).includes(value)
}

export function getInitialTheme(): ThemeName {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (isThemeName(stored)) {
      return stored
    }
    if (
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
    ) {
      return 'dark'
    }
  } catch {
    // Ignore storage / matchMedia access errors and fall back to default.
  }
  return DEFAULT_THEME
}
