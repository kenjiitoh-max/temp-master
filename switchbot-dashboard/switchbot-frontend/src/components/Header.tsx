import { THEMES, type ThemeId } from '../lib/theme';

export type ConnectionState = 'connecting' | 'connected' | 'disconnected';

interface HeaderProps {
  theme: ThemeId;
  onThemeChange: (theme: ThemeId) => void;
  connection: ConnectionState;
  onRefresh: () => void;
  isRefreshing: boolean;
}

const CONNECTION_LABEL: Record<ConnectionState, string> = {
  connecting: 'Connecting...',
  connected: 'Connected',
  disconnected: 'Disconnected',
};

const CONNECTION_CLASS: Record<ConnectionState, string> = {
  connecting: 'bg-muted',
  connected: 'bg-success',
  disconnected: 'bg-danger',
};

export function Header({ theme, onThemeChange, connection, onRefresh, isRefreshing }: HeaderProps) {
  return (
    <header className="sticky top-0 z-10 border-b border-border bg-surface shadow-sm">
      <div className="flex flex-wrap items-center gap-3 px-4 py-3">
        <h1 className="mr-auto text-lg font-semibold">Temp Master Dashboard</h1>

        <label className="flex items-center gap-2 text-sm">
          <span className="text-muted">Theme</span>
          <select
            aria-label="Theme"
            value={theme}
            onChange={(e) => onThemeChange(e.target.value as ThemeId)}
            className="rounded border border-border bg-surface px-2 py-1 text-fg"
          >
            {THEMES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="rounded bg-primary px-3 py-1.5 text-sm font-medium text-primary-fg hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
        </button>

        <span
          role="status"
          data-state={connection}
          className={`rounded px-2 py-1 text-xs font-bold text-badge-fg ${CONNECTION_CLASS[connection]}`}
        >
          {CONNECTION_LABEL[connection]}
        </span>
      </div>
    </header>
  );
}
