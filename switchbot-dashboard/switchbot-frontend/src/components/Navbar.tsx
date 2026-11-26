import type { Theme } from '../lib/theme'
import { ThemeSwitcher } from './ThemeSwitcher'

interface NavbarProps {
  connected: boolean
  theme: Theme
  onThemeChange: (theme: Theme) => void
}

export function Navbar({ connected, theme, onThemeChange }: NavbarProps) {
  return (
    <nav className="fixed inset-x-0 top-0 z-10 flex min-h-[50px] items-center gap-x-4 border-b border-border bg-surface-muted px-4">
      <a href="/" className="min-w-0 truncate py-3 text-lg text-text">
        Temp Master Dashboard
      </a>
      <a
        href="/"
        aria-current="page"
        className="hidden self-stretch bg-border/60 px-4 py-3.5 text-text sm:block"
      >
        Dashboard
      </a>
      <div className="ml-auto flex shrink-0 items-center gap-3">
        <ThemeSwitcher theme={theme} onChange={onThemeChange} />
        <span
          data-testid="connection-status"
          className={`rounded px-2 py-1 text-xs font-bold text-on-badge ${connected ? 'bg-success' : 'bg-danger'}`}
        >
          {connected ? 'Connected' : 'Disconnected'}
        </span>
      </div>
    </nav>
  )
}
