import { useState } from 'react';
import { Controls } from './components/Controls';
import { ErrorBanner } from './components/ErrorBanner';
import { Header, type ConnectionState } from './components/Header';
import { LoadingState } from './components/LoadingState';
import { MeterCard } from './components/MeterCard';
import { StatusBar } from './components/StatusBar';
import { useMeters, useRefreshMeters, useStatus } from './hooks/queries';
import { useTheme } from './hooks/useTheme';
import { api } from './lib/api';
import type { TimeScale } from './lib/types';

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

export default function App() {
  const { theme, setTheme } = useTheme();
  const [timeScale, setTimeScale] = useState<TimeScale>('day');

  const meters = useMeters();
  const status = useStatus();
  const refresh = useRefreshMeters();

  const fetchError = meters.error
    ? `Failed to fetch meters: ${errorMessage(meters.error)}`
    : status.error
      ? `Failed to fetch status: ${errorMessage(status.error)}`
      : null;

  const connection: ConnectionState = fetchError
    ? 'disconnected'
    : meters.isSuccess && status.isSuccess
      ? 'connected'
      : 'connecting';

  const lastRefresh = meters.dataUpdatedAt ? new Date(meters.dataUpdatedAt) : null;

  return (
    <div className="min-h-screen">
      <Header
        theme={theme}
        onThemeChange={setTheme}
        connection={connection}
        onRefresh={() => refresh.mutate()}
        isRefreshing={refresh.isPending}
      />

      <main className="space-y-4 p-4">
        <Controls
          timeScale={timeScale}
          onTimeScaleChange={setTimeScale}
          backupUrl={api.url('/api/backup')}
        />

        {status.data && <StatusBar status={status.data} lastRefresh={lastRefresh} />}

        {fetchError && <ErrorBanner message={fetchError} />}
        {refresh.error && (
          <ErrorBanner
            message={`Failed to refresh: ${errorMessage(refresh.error)}`}
            onDismiss={() => refresh.reset()}
          />
        )}

        {meters.isPending ? (
          <LoadingState />
        ) : meters.data && meters.data.meters.length === 0 ? (
          <p className="py-10 text-center text-muted">No meters found.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
            {meters.data?.meters.map((meter) => (
              <MeterCard key={meter.device_id} meter={meter} timeScale={timeScale} />
            ))}
          </div>
        )}
      </main>

      <footer className="my-8 text-center text-xs text-muted">
        Temp Master Dashboard v2.0 - Built with React + TanStack Query + Tailwind CSS
      </footer>
    </div>
  );
}
