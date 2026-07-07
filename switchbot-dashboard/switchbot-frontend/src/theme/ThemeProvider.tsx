import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { ThemeContext } from './ThemeContext'
import { getInitialTheme, STORAGE_KEY, type ThemeName } from './themes'

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeName>(getInitialTheme)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    try {
      localStorage.setItem(STORAGE_KEY, theme)
    } catch {
      // Ignore persistence failures (e.g. storage disabled).
    }
  }, [theme])

  const setTheme = useCallback((next: ThemeName) => {
    setThemeState(next)
  }, [])

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}
