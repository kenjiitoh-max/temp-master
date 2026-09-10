import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { DEFAULT_THEME, THEME_STORAGE_KEY, isTheme, type Theme } from './themes'
import { ThemeContext } from './ThemeContext'

function loadInitialTheme(): Theme {
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY)
    if (isTheme(stored)) return stored
  } catch {
    // localStorage が使えない環境では既定値を使う
  }
  return DEFAULT_THEME
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(loadInitialTheme)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme)
    } catch {
      // 永続化に失敗しても表示には影響しない
    }
  }, [theme])

  // 子コンポーネントが再レンダー時に新しい CSS 変数を読めるよう、state 更新前に属性を反映する
  const setTheme = useCallback((next: Theme) => {
    document.documentElement.setAttribute('data-theme', next)
    setThemeState(next)
  }, [])

  const value = useMemo(() => ({ theme, setTheme }), [theme, setTheme])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
