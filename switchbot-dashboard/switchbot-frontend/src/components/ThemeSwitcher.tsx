import { useTheme } from '../theme/useTheme'
import { THEMES, THEME_LABELS, type ThemeName } from '../theme/themes'

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="theme-switcher">
      <label htmlFor="theme-select">Theme:</label>
      <select
        id="theme-select"
        className="select"
        value={theme}
        onChange={(e) => setTheme(e.target.value as ThemeName)}
      >
        {THEMES.map((name) => (
          <option key={name} value={name}>
            {THEME_LABELS[name]}
          </option>
        ))}
      </select>
    </div>
  )
}
