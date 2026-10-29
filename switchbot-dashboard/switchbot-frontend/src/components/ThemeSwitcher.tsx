import { THEMES, type ThemeId } from '../context/ThemeContext'
import { useTheme } from '../context/useTheme'

const SYSTEM_VALUE = 'system'

export function ThemeSwitcher() {
  const { theme, setTheme, isSystem, followSystemTheme } = useTheme()

  const onChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value
    if (value === SYSTEM_VALUE) {
      followSystemTheme()
    } else {
      setTheme(value as ThemeId)
    }
  }

  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="hidden text-fg-muted sm:inline">Theme</span>
      <select
        aria-label="テーマ切替"
        data-testid="theme-select"
        className="rounded border border-border bg-surface px-2 py-1 text-fg focus:outline-none focus:ring-2 focus:ring-primary"
        value={isSystem ? SYSTEM_VALUE : theme}
        onChange={onChange}
      >
        <option value={SYSTEM_VALUE}>System (auto)</option>
        {THEMES.map((t) => (
          <option key={t.id} value={t.id}>
            {t.label}
          </option>
        ))}
      </select>
    </label>
  )
}
