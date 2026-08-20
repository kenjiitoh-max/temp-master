import { useTheme } from '../theme/useTheme'

export function Header({ connected }: { connected: boolean }) {
  const { theme, themes, setThemeId } = useTheme()

  return (
    <header className="app-header">
      <div className="app-header__inner">
        <span className="app-header__brand">Temp Master Dashboard</span>
        <div className="app-header__actions">
          <label className="app-header__theme">
            Theme:
            <select
              aria-label="Theme"
              value={theme.id}
              onChange={(event) => setThemeId(event.target.value)}
            >
              {themes.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <span className={`badge ${connected ? 'badge--success' : 'badge--danger'}`}>
            {connected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>
    </header>
  )
}
