import { useTheme } from '../theme/useTheme'
import { THEMES, type ThemeName } from '../theme/themes'

interface NavbarProps {
  connected: boolean
}

export function Navbar({ connected }: NavbarProps) {
  const { theme, setTheme } = useTheme()

  return (
    <nav className="navbar">
      <a className="navbar-brand" href="/">
        Temp Master Dashboard
      </a>
      <div className="navbar-right">
        <select
          id="theme-select"
          className="theme-select"
          value={theme}
          onChange={(e) => setTheme(e.target.value as ThemeName)}
          aria-label="Theme"
        >
          {THEMES.map((t) => (
            <option key={t.name} value={t.name}>
              {t.label}
            </option>
          ))}
        </select>
        <span className={connected ? 'badge badge-connected' : 'badge badge-disconnected'}>
          {connected ? 'Connected' : 'Disconnected'}
        </span>
      </div>
    </nav>
  )
}
