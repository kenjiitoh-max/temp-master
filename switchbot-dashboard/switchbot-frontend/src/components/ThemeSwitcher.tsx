import { THEMES, type Theme } from '../lib/theme'

interface ThemeSwitcherProps {
  theme: Theme
  onChange: (theme: Theme) => void
}

export function ThemeSwitcher({ theme, onChange }: ThemeSwitcherProps) {
  return (
    <label className="flex items-center gap-2 text-xs text-text-muted">
      <span className="hidden sm:inline">Theme:</span>
      <select
        aria-label="Theme"
        data-testid="theme-select"
        value={theme}
        onChange={(event) => onChange(event.target.value as Theme)}
        className="rounded border border-border bg-surface px-2 py-1 text-sm text-text"
      >
        {THEMES.map(({ id, label }) => (
          <option key={id} value={id}>
            {label}
          </option>
        ))}
      </select>
    </label>
  )
}
