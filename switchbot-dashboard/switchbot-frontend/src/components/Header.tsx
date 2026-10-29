import { ThemeSwitcher } from './ThemeSwitcher'

interface HeaderProps {
  connected: boolean
}

export function Header({ connected }: HeaderProps) {
  return (
    <header className="fixed inset-x-0 top-0 z-10 border-b border-border bg-surface shadow-sm">
      <div className="mx-auto flex h-14 max-w-screen-2xl items-center justify-between gap-3 px-3 sm:gap-4 sm:px-4">
        <div className="flex min-w-0 items-center gap-6">
          <a
            href="/"
            className="truncate whitespace-nowrap text-base font-semibold text-fg no-underline sm:text-lg"
          >
            Temp Master<span className="hidden md:inline"> Dashboard</span>
          </a>
          <nav className="hidden sm:block">
            <a href="/" className="text-sm font-medium text-primary">
              Dashboard
            </a>
          </nav>
        </div>
        <div className="flex shrink-0 items-center gap-2 sm:gap-4">
          <ThemeSwitcher />
          <span
            id="connection-status"
            className={`whitespace-nowrap rounded px-2 py-1 text-xs font-semibold text-white ${
              connected ? 'bg-battery' : 'bg-temp'
            }`}
          >
            {connected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>
    </header>
  )
}
