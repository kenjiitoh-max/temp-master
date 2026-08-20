import { createContext } from 'react'
import type { Theme } from './themes'

export interface ThemeContextValue {
  theme: Theme
  themes: Theme[]
  setThemeId: (id: string) => void
}

export const ThemeContext = createContext<ThemeContextValue | null>(null)
