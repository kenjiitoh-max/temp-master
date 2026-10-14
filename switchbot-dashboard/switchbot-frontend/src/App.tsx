import { useState } from 'react'
import { Controls } from './components/Controls'
import { ErrorAlert } from './components/ErrorAlert'
import { MeterCard } from './components/MeterCard'
import type { ConnectionState } from './components/ConnectionBadge'
import { Navbar } from './components/Navbar'
import { StatusBar } from './components/StatusBar'
import { api } from './api/client'
import { DEFAULT_TIME_SCALE, type TimeScale } from './constants'
import { useMeters, useRefreshMeters, useStatus } from './hooks/useMeters'

export default function App() {
  const [timeScale, setTimeScale] = useState<TimeScale>(DEFAULT_TIME_SCALE)
  const meters = useMeters()
  const status = useStatus()
  const refresh = useRefreshMeters()

  const fetchError = meters.error
    ? `Failed to fetch meters: ${meters.error.message}`
    : status.error
      ? `Failed to fetch status: ${status.error.message}`
      : null

  const connection: ConnectionState = fetchError
    ? 'disconnected'
    : meters.isSuccess && status.isSuccess
      ? 'connected'
      : 'connecting'

  const isLoading = meters.isPending || status.isPending

  return (
    <div className="min-h-screen">
      <Navbar connection={connection} />

      <main className="mx-auto max-w-7xl space-y-4 px-4 py-6">
        <Controls
          timeScale={timeScale}
          onTimeScaleChange={setTimeScale}
          onRefresh={() => refresh.mutate()}
          isRefreshing={refresh.isPending}
          onBackup={() => window.open(api.backupUrl(), '_blank', 'noopener')}
        />

        {status.data && !fetchError && (
          <StatusBar status={status.data} lastRefresh={new Date(status.dataUpdatedAt)} />
        )}

        {refresh.error && <ErrorAlert message={`Failed to refresh: ${refresh.error.message}`} />}
        {fetchError && <ErrorAlert message={fetchError} />}

        {isLoading && !fetchError && (
          <p id="loading" className="py-10 text-center text-muted-foreground">
            Loading temperature data...
          </p>
        )}

        {meters.data && (
          <div id="meters-container" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {meters.data.map((meter) => (
              <MeterCard key={meter.device_id} meter={meter} timeScale={timeScale} />
            ))}
          </div>
        )}
      </main>

      <footer className="py-8 text-center text-xs text-muted-foreground">
        Temp Master Dashboard v2.0 - Built with React + Vite + Tailwind CSS
      </footer>
    </div>
  )
}
