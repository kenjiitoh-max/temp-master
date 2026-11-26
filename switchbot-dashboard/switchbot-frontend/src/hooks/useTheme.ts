import { useCallback, useState } from 'react'
import { applyTheme, getInitialTheme, storeTheme, type Theme } from '../lib/theme'

export function useTheme(): [Theme, (theme: Theme) => void] {
  const [theme, setThemeState] = useState<Theme>(() => {
    const initial = getInitialTheme()
    applyTheme(initial)
    return initial
  })

  const setTheme = useCallback((next: Theme) => {
    applyTheme(next)
    storeTheme(next)
    setThemeState(next)
  }, [])

  return [theme, setTheme]
}
