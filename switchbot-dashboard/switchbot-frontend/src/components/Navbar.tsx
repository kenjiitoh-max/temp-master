import type { ConnectionState } from '../hooks/useDashboardData';
import { ThemeSwitcher } from './ThemeSwitcher';

const CONNECTION_LABELS: Record<ConnectionState, string> = {
  connecting: 'Connecting...',
  connected: 'Connected',
  disconnected: 'Disconnected',
};

export function Navbar({ connection }: { connection: ConnectionState }) {
  return (
    <header className="navbar">
      <div className="navbar__inner">
        <a className="navbar__brand" href="/">
          <span className="navbar__logo" aria-hidden="true">
            ◉
          </span>
          Temp Master Dashboard
        </a>
        <nav className="navbar__nav" aria-label="Main">
          <a className="navbar__link navbar__link--active" href="/" aria-current="page">
            Dashboard
          </a>
        </nav>
        <div className="navbar__right">
          <ThemeSwitcher />
          <span
            id="connection-status"
            className={`status-badge status-badge--${connection}`}
            role="status"
            aria-live="polite"
          >
            <span className="status-badge__dot" aria-hidden="true" />
            {CONNECTION_LABELS[connection]}
          </span>
        </div>
      </div>
    </header>
  );
}
