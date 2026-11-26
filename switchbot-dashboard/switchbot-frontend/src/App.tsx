import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { triggerRefresh } from './api'
import { ControlPanel } from './components/ControlPanel'
import { Alert } from './components/Alert'
import { MeterCard } from './components/MeterCard'
import { Navbar } from './components/Navbar'
import { StatusBar } from './components/StatusBar'
import { useMeters, useStatus } from './hooks/queries'
import { useTheme } from './hooks/useTheme'
import type { TimeScale } from './types'

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

export default function App() {
  const [theme, setTheme] = useTheme()
  const [timeScale, setTimeScale] = useState<TimeScale>('day')
  const queryClient = useQueryClient()

  const metersQuery = useMeters()
  const statusQuery = useStatus()

  const refresh = useMutation({
    mutationFn: triggerRefresh,
    // 旧実装と同じく、成否にかかわらず全データを再取得する
    onSettled: () => queryClient.invalidateQueries(),
  })

  let error: string | null = null
  if (metersQuery.isError) {
    error = `Failed to fetch meters: ${errorMessage(metersQuery.error)}`
  } else if (statusQuery.isError) {
    error = `Failed to fetch status: ${errorMessage(statusQuery.error)}`
  } else if (refresh.isError) {
    error = `Failed to refresh: ${errorMessage(refresh.error)}`
  }

  const connected = !metersQuery.isError && !statusQuery.isError
  const isLoading = metersQuery.isPending || statusQuery.isPending
  const meters = metersQuery.data?.meters ?? []
  const status = statusQuery.data
  const lastRefresh = Math.max(metersQuery.dataUpdatedAt, statusQuery.dataUpdatedAt)

  return (
    <>
      <Navbar connected={connected} theme={theme} onThemeChange={setTheme} />

      <main className="px-4 pt-[70px]">
        <ControlPanel
          timeScale={timeScale}
          onTimeScaleChange={setTimeScale}
          onRefresh={() => refresh.mutate()}
          isRefreshing={refresh.isPending}
        />

        {status ? (
          <StatusBar metersCount={status.meters_count} lastRefresh={lastRefresh} />
        ) : null}

        {status?.is_rate_limited ? (
          <Alert variant="warning" data-testid="rate-limit-warning">
            <strong>Rate Limited.</strong> SwitchBot API rate limit reached. Retry in{' '}
            {status.backoff_remaining} seconds.
          </Alert>
        ) : null}

        {isLoading ? (
          <p className="py-10 text-center text-text-muted" data-testid="loading">
            Loading temperature data...
          </p>
        ) : null}

        {error ? (
          <Alert variant="danger" data-testid="error">
            <strong>Error.</strong> {error}
          </Alert>
        ) : null}

        <div
          className="grid grid-cols-1 gap-x-[30px] sm:grid-cols-2 lg:grid-cols-3"
          data-testid="meters-container"
        >
          {meters.map((meter) => (
            <MeterCard key={meter.device_id} meter={meter} timeScale={timeScale} />
          ))}
        </div>

        <footer className="mt-[30px] mb-5 text-center text-xs text-text-muted">
          Temp Master Dashboard v2.0 - Built with React + Vite + Tailwind CSS
        </footer>
      </main>
    </>
  )
}
