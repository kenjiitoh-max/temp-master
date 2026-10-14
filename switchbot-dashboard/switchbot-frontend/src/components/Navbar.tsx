import { Thermometer } from 'lucide-react'
import { ConnectionBadge, type ConnectionState } from './ConnectionBadge'
import { ThemeSwitcher } from './ThemeSwitcher'

export function Navbar({ connection }: { connection: ConnectionState }) {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-surface/85 backdrop-blur">
      <nav className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
        <a href="/" className="flex items-center gap-2 text-lg font-semibold text-foreground">
          <Thermometer className="size-5 text-temp" aria-hidden />
          Temp Master Dashboard
        </a>
        <a
          href="/"
          aria-current="page"
          className="rounded-md bg-surface-muted px-3 py-1.5 text-sm font-medium text-foreground"
        >
          Dashboard
        </a>
        <div className="ml-auto flex items-center gap-3">
          <ConnectionBadge state={connection} />
          <ThemeSwitcher />
        </div>
      </nav>
    </header>
  )
}
