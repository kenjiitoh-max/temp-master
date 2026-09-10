import { THEMES, THEME_LABELS, isTheme } from '../theme/themes'
import { useTheme } from '../theme/useTheme'

interface NavbarProps {
  connected: boolean
}

export function Navbar({ connected }: NavbarProps) {
  const { theme, setTheme } = useTheme()

  return (
    <nav className="fixed inset-x-0 top-0 z-10 border-b border-border bg-surface shadow-sm">
      <div className="mx-auto flex h-14 max-w-screen-2xl items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <a href="/" className="text-lg font-semibold tracking-tight">
            Temp Master Dashboard
          </a>
          <a href="/" className="hidden text-sm text-accent sm:inline">
            Dashboard
          </a>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-muted">
            <span className="hidden sm:inline">Theme</span>
            <select
              className="select"
              aria-label="Theme"
              value={theme}
              onChange={(e) => {
                if (isTheme(e.target.value)) setTheme(e.target.value)
              }}
            >
              {THEMES.map((t) => (
                <option key={t} value={t}>
                  {THEME_LABELS[t]}
                </option>
              ))}
            </select>
          </label>
          <span
            data-testid="connection-status"
            className={`badge ${connected ? 'bg-success' : 'bg-danger'}`}
          >
            {connected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>
    </nav>
  )
}
