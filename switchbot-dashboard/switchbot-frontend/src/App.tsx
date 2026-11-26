import { useState } from 'react';
import { useMutation, useQueries, useQueryClient } from '@tanstack/react-query';
import { api, type TimeScale } from './lib/api';
import { ThemeProvider } from './theme/ThemeProvider';
import { ThemeSwitcher } from './components/ThemeSwitcher';
import { TimeScaleSelect } from './components/TimeScaleSelect';
import { ConnectionBadge, StatusBar } from './components/StatusBar';
import { MeterCard } from './components/MeterCard';

const REFRESH_INTERVAL = 30000;

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

function Dashboard() {
  const queryClient = useQueryClient();
  const [timeScale, setTimeScale] = useState<TimeScale>('day');

  const [metersQuery, statusQuery] = useQueries({
    queries: [
      { queryKey: ['meters'], queryFn: api.getMeters, refetchInterval: REFRESH_INTERVAL },
      { queryKey: ['status'], queryFn: api.getStatus, refetchInterval: REFRESH_INTERVAL },
    ],
  });

  const meters = metersQuery.data?.meters ?? [];

  const historyQueries = useQueries({
    queries: meters.map((m) => ({
      queryKey: ['history', m.device_id, timeScale],
      queryFn: () => api.getHistory(m.device_id, timeScale),
      refetchInterval: REFRESH_INTERVAL,
    })),
  });

  const refresh = useMutation({
    mutationFn: api.refresh,
    onSettled: () => queryClient.invalidateQueries(),
  });

  const loading = metersQuery.isPending || statusQuery.isPending;
  const fetchError = metersQuery.error
    ? `Failed to fetch meters: ${errorMessage(metersQuery.error)}`
    : statusQuery.error
      ? `Failed to fetch status: ${errorMessage(statusQuery.error)}`
      : null;
  const connected = !loading && !fetchError;
  const lastRefresh = metersQuery.dataUpdatedAt ? new Date(metersQuery.dataUpdatedAt) : null;

  return (
    <div className="min-h-screen">
      <nav className="sticky top-0 z-10 border-b border-border bg-card/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <a href="/" className="text-lg font-bold tracking-tight">
            Temp Master Dashboard
          </a>
          <div className="flex flex-wrap items-center gap-3">
            <ThemeSwitcher />
            {!loading && <ConnectionBadge connected={connected} />}
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl space-y-4 px-4 py-6">
        <section className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-4">
          <TimeScaleSelect value={timeScale} onChange={setTimeScale} />
          <button
            type="button"
            data-testid="btn-refresh"
            disabled={refresh.isPending}
            onClick={() => refresh.mutate()}
            className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-fg transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {refresh.isPending ? 'Refreshing...' : 'Refresh Data'}
          </button>
          <button
            type="button"
            data-testid="btn-backup"
            onClick={() => window.open(api.backupUrl(), '_blank')}
            className="rounded-md border border-border px-4 py-2 text-sm font-semibold hover:bg-bg"
          >
            Download Backup
          </button>
        </section>

        {statusQuery.data && !fetchError && <StatusBar status={statusQuery.data} lastRefresh={lastRefresh} />}

        {refresh.isError && (
          <div role="alert" className="rounded-lg border border-danger/50 bg-danger/15 px-4 py-3 text-sm">
            <strong>Error.</strong> Failed to refresh: {errorMessage(refresh.error)}
          </div>
        )}

        {loading && (
          <p data-testid="loading" className="py-10 text-center text-muted">
            Loading temperature data...
          </p>
        )}

        {fetchError && (
          <div role="alert" data-testid="error" className="rounded-lg border border-danger/50 bg-danger/15 px-4 py-3 text-sm">
            <strong>Error.</strong> {fetchError}
          </div>
        )}

        {!loading && !fetchError && meters.length === 0 && (
          <p className="py-10 text-center text-muted">No meters found.</p>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" data-testid="meters-container">
          {meters.map((meter, i) => (
            <MeterCard key={meter.device_id} meter={meter} timeScale={timeScale} history={historyQueries[i]} />
          ))}
        </div>
      </main>

      <footer className="py-6 text-center text-xs text-muted">
        Temp Master Dashboard v2.0 - Built with React + Vite
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <Dashboard />
    </ThemeProvider>
  );
}
