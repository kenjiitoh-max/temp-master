import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { ThemeContext } from './context'
import { DEFAULT_THEME_ID, THEMES, findTheme, type Theme } from './themes'

const STORAGE_KEY = 'temp-master-theme'

function toCssVarName(token: string): string {
  return `--${token.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}`
}

function initialTheme(): Theme {
  const stored = findTheme(localStorage.getItem(STORAGE_KEY))
  if (stored) return stored
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  return findTheme(prefersDark ? 'dark' : DEFAULT_THEME_ID) ?? THEMES[0]
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(initialTheme)

  useEffect(() => {
    const root = document.documentElement
    for (const [token, value] of Object.entries(theme.tokens)) {
      root.style.setProperty(toCssVarName(token), value)
    }
    root.style.colorScheme = theme.colorScheme
    root.dataset.theme = theme.id
  }, [theme])

  const setThemeId = useCallback((id: string) => {
    const next = findTheme(id)
    if (!next) return
    localStorage.setItem(STORAGE_KEY, next.id)
    setTheme(next)
  }, [])

  const value = useMemo(() => ({ theme, themes: THEMES, setThemeId }), [theme, setThemeId])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
