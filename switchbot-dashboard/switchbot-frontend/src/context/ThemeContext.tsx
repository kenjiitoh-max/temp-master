import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'

export const THEMES = [
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Dark' },
  { id: 'control-room', label: 'Control Room' },
] as const

export type ThemeId = (typeof THEMES)[number]['id']

export const THEME_STORAGE_KEY = 'temp-master-theme'

export interface ThemeContextValue {
  theme: ThemeId
  setTheme: (theme: ThemeId) => void
  /** true のとき OS 設定（prefers-color-scheme）に追従している */
  isSystem: boolean
  followSystemTheme: () => void
}

// eslint-disable-next-line react-refresh/only-export-components
export const ThemeContext = createContext<ThemeContextValue | null>(null)

function isThemeId(value: unknown): value is ThemeId {
  return THEMES.some((t) => t.id === value)
}

function readStoredTheme(): ThemeId | null {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY)
    return isThemeId(saved) ? saved : null
  } catch {
    return null
  }
}

function systemTheme(): ThemeId {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [stored, setStored] = useState<ThemeId | null>(readStoredTheme)
  const [system, setSystem] = useState<ThemeId>(systemTheme)

  // 保存済みテーマがないときだけ OS 設定の変化に追従する
  useEffect(() => {
    const mql = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = (e: MediaQueryListEvent) => setSystem(e.matches ? 'dark' : 'light')
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [])

  const theme = stored ?? system

  // <html data-theme="..."> を書き換えると themes.css の変数が切り替わる
  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  const setTheme = useCallback((next: ThemeId) => {
    setStored(next)
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next)
    } catch {
      // プライベートモードなどで保存できなくても動作は続ける
    }
  }, [])

  const followSystemTheme = useCallback(() => {
    setStored(null)
    try {
      localStorage.removeItem(THEME_STORAGE_KEY)
    } catch {
      // ignore
    }
  }, [])

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, setTheme, isSystem: stored === null, followSystemTheme }),
    [theme, setTheme, stored, followSystemTheme],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
