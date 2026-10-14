import { useCallback, useEffect, useLayoutEffect, useMemo, useState, type ReactNode } from 'react'
import { ThemeContext } from './context'
import {
  THEME_STORAGE_KEY,
  getStoredTheme,
  getSystemTheme,
  readChartColors,
  type ChartColors,
  type ThemeId,
} from './themes'

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeId>(() => getStoredTheme() ?? getSystemTheme())
  const [chartColors, setChartColors] = useState<ChartColors>(readChartColors)

  // 画面に描画される前に <html data-theme> を切り替え、チャート用の色も読み直す
  useLayoutEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    setChartColors(readChartColors())
  }, [theme])

  // ユーザーがまだテーマを選んでいない間は OS の設定変更に追従する
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => {
      if (!getStoredTheme()) setThemeState(getSystemTheme())
    }
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])

  const setTheme = useCallback((next: ThemeId) => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next)
    } catch {
      // localStorage が使えない環境 (プライベートモード等) ではメモリ上だけで切り替える
    }
    setThemeState(next)
  }, [])

  const value = useMemo(() => ({ theme, setTheme, chartColors }), [theme, setTheme, chartColors])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
