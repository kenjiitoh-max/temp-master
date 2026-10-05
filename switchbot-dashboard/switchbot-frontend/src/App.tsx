import { useState } from 'react';
import { backupUrl, errorMessage, triggerRefresh } from './api/client';
import { Controls } from './components/Controls';
import { Footer } from './components/Footer';
import { MeterGrid } from './components/MeterGrid';
import { Navbar } from './components/Navbar';
import { RateLimitWarning } from './components/RateLimitWarning';
import { StatusBar } from './components/StatusBar';
import { DEFAULT_TIME_SCALE, REFRESH_INTERVAL, type TimeScale } from './config';
import { useDashboardData } from './hooks/useDashboardData';

export default function App() {
  const { meters, status, connection, loading, error, lastRefresh, reload } =
    useDashboardData(REFRESH_INTERVAL);
  const [timeScale, setTimeScale] = useState<TimeScale>(DEFAULT_TIME_SCALE);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);

  const handleRefresh = async () => {
    setRefreshing(true);
    setRefreshError(null);
    try {
      await triggerRefresh();
    } catch (err) {
      setRefreshError(`Failed to refresh: ${errorMessage(err)}`);
    }
    await reload();
    setRefreshing(false);
  };

  const handleBackup = () => {
    window.open(backupUrl(), '_blank');
  };

  return (
    <>
      <Navbar connection={connection} />
      <main className="container">
        <Controls
          timeScale={timeScale}
          onTimeScaleChange={setTimeScale}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          onBackup={handleBackup}
        />

        {status && <StatusBar metersCount={status.meters_count ?? 0} lastRefresh={lastRefresh} />}
        {status?.is_rate_limited && <RateLimitWarning backoffRemaining={status.backoff_remaining ?? 0} />}

        {loading && (
          <div id="loading" className="loading">
            <span className="spinner" aria-hidden="true" />
            <p>Loading temperature data...</p>
          </div>
        )}

        {error && (
          <div id="error" className="alert alert--danger" role="alert">
            <strong>Error.</strong> <span id="error-text">{error}</span>
          </div>
        )}
        {refreshError && (
          <div id="refresh-error" className="alert alert--danger" role="alert">
            <strong>Error.</strong> <span>{refreshError}</span>
            <button
              type="button"
              className="alert__dismiss"
              aria-label="Dismiss"
              onClick={() => setRefreshError(null)}
            >
              ×
            </button>
          </div>
        )}

        {!loading && (
          <MeterGrid
            meters={meters}
            timeScale={timeScale}
            refreshToken={lastRefresh ? lastRefresh.getTime() : null}
          />
        )}

        <Footer />
      </main>
    </>
  );
}
