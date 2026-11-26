export const THEMES = [
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Dark' },
  { id: 'sepia', label: 'Sepia' },
] as const

export type Theme = (typeof THEMES)[number]['id']

// index.html のインラインスクリプトと同じキーを使う
const STORAGE_KEY = 'temp-master-theme'

function isTheme(value: unknown): value is Theme {
  return THEMES.some((theme) => theme.id === value)
}

export function getInitialTheme(): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (isTheme(stored)) return stored
  } catch {
    // localStorage が使えない環境では OS 設定にフォールバックする
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function applyTheme(theme: Theme): void {
  document.documentElement.setAttribute('data-theme', theme)
}

export function storeTheme(theme: Theme): void {
  try {
    localStorage.setItem(STORAGE_KEY, theme)
  } catch {
    // 保存できなくても表示上の切替は続行する
  }
}
