import { useState } from "react";
import { useTheme, type ThemePreference } from "./hooks/useTheme";
import { useDashboardData } from "./hooks/useDashboardData";
import { API_URL, TIME_SCALE_OPTIONS } from "./constants";
import { formatClock } from "./utils";
import type { TimeScale } from "./types";
import { MeterCard } from "./components/MeterCard";

function App() {
  const { preference, setPreference, isDark } = useTheme();
  const [timeScale, setTimeScale] = useState<TimeScale>("day");
  const {
    meters,
    histories,
    status,
    loading,
    refreshing,
    connected,
    error,
    lastRefresh,
    refresh
  } = useDashboardData(timeScale);

  const handleBackup = () => {
    window.open(`${API_URL}/api/backup`, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors">
      <nav className="sticky top-0 z-10 border-b border-border bg-card/95 shadow-sm backdrop-blur">
        <div className="mx-auto flex max-w-screen-2xl flex-wrap items-center gap-4 px-4 py-3 sm:px-6">
          <a className="text-lg font-bold tracking-tight text-foreground" href="/">
            Temp Master Dashboard
          </a>
          <a className="text-sm font-medium text-accent" href="/">
            Dashboard
          </a>
          <div className="ml-auto flex items-center gap-3">
            <label className="sr-only" htmlFor="theme-select">
              Theme
            </label>
            <select
              id="theme-select"
              value={preference}
              onChange={(event) =>
                setPreference(event.target.value as ThemePreference)
              }
              className="rounded-md border border-border bg-background px-2 py-1.5 text-xs text-foreground outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="system">System</option>
            </select>
            <span
              id="connection-status"
              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                connected === false
                  ? "bg-danger/15 text-danger"
                  : "bg-success/15 text-success"
              }`}
            >
              {connected === false ? "Disconnected" : "Connected"}
            </span>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-screen-2xl space-y-5 px-4 py-6 sm:px-6">
        <section className="rounded-xl border border-border bg-card p-4 shadow-panel">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground" htmlFor="time-scale-select">
                Time Range
              </label>
              <select
                id="time-scale-select"
                value={timeScale}
                onChange={(event) => setTimeScale(event.target.value as TimeScale)}
                className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-accent"
              >
                {TIME_SCALE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              id="btn-refresh"
              disabled={refreshing}
              onClick={() => void refresh()}
              className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {refreshing ? "Refreshing..." : "Refresh Data"}
            </button>
            <button
              type="button"
              id="btn-backup"
              onClick={handleBackup}
              className="rounded-md border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-muted"
            >
              Download Backup
            </button>
          </div>
        </section>

        {status && (
          <section
            id="status-bar"
            className="flex flex-col gap-1 rounded-lg border border-info/30 bg-info/10 px-4 py-3 text-sm text-info sm:flex-row sm:justify-between"
          >
            <span id="status-meters-count">
              Monitoring {status.meters_count}{" "}
              {status.meters_count === 1 ? "meter" : "meters"}
            </span>
            {lastRefresh && (
              <span id="status-last-refresh">
                Last refresh: {formatClock(lastRefresh)}
              </span>
            )}
          </section>
        )}

        {status?.is_rate_limited && (
          <section
            id="rate-limit-warning"
            className="rounded-lg border border-amber-400/40 bg-amber-400/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-300"
          >
            <strong>Rate Limited.</strong>{" "}
            <span id="rate-limit-text">
              SwitchBot API rate limit reached. Retry in{" "}
              {status.backoff_remaining} seconds.
            </span>
          </section>
        )}

        {loading && (
          <p id="loading" className="py-10 text-center text-sm text-muted-foreground">
            Loading temperature data...
          </p>
        )}

        {error && (
          <section
            id="error"
            className="rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger"
          >
            <strong>Error.</strong> <span id="error-text">{error}</span>
          </section>
        )}

        {!loading && meters.length > 0 && (
          <section id="meters-container" className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {meters.map((meter) => (
              <MeterCard
                key={meter.device_id}
                meter={meter}
                history={histories[meter.device_id] ?? []}
                timeScale={timeScale}
                isDark={isDark}
              />
            ))}
          </section>
        )}

        {!loading && !error && meters.length === 0 && (
          <p className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
            No meter data available.
          </p>
        )}

        <footer className="py-4 text-center text-xs text-muted-foreground">
          Temp Master Dashboard v1.0 - Built with React + Tailwind CSS
        </footer>
      </main>
    </div>
  );
}

export default App;
