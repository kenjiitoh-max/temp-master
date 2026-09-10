import { useEffect, useRef, useState } from 'react'
import { openBackup } from './api/client'
import { useMeters, useRefreshMeters, useStatus } from './api/queries'
import type { TimeScale } from './api/types'
import { Controls } from './components/Controls'
import { MeterCard } from './components/MeterCard'
import { Navbar } from './components/Navbar'
import { RateLimitWarning } from './components/RateLimitWarning'
import { StatusBar } from './components/StatusBar'

export default function App() {
  const [timeScale, setTimeScale] = useState<TimeScale>('day')
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)

  const metersQuery = useMeters()
  const statusQuery = useStatus()
  const refresh = useRefreshMeters()
  const refreshRef = useRef(refresh)
  refreshRef.current = refresh

  const meters = metersQuery.data?.meters ?? []
  const status = statusQuery.data
  const isLoading = metersQuery.isPending || statusQuery.isPending
  const error = metersQuery.error ?? statusQuery.error ?? refresh.error
  const connected = !metersQuery.isError && !statusQuery.isError

  useEffect(() => {
    if (metersQuery.dataUpdatedAt) {
      setLastRefresh(new Date(metersQuery.dataUpdatedAt))
      // 定期取得が成功したら、前回の手動更新エラー表示を消す
      if (refreshRef.current.isError) refreshRef.current.reset()
    }
  }, [metersQuery.dataUpdatedAt])

  return (
    <div className="min-h-screen pt-14">
      <Navbar connected={connected} />

      <main className="mx-auto flex max-w-screen-2xl flex-col gap-4 px-4 py-4">
        <Controls
          timeScale={timeScale}
          onTimeScaleChange={setTimeScale}
          onRefresh={() => refresh.mutate()}
          onBackup={openBackup}
          refreshing={refresh.isPending}
        />

        {status && <StatusBar metersCount={status.meters_count} lastRefresh={lastRefresh} />}

        {status?.is_rate_limited && <RateLimitWarning backoffRemaining={status.backoff_remaining} />}

        {isLoading && !error && (
          <p className="py-10 text-center text-muted">Loading temperature data...</p>
        )}

        {error && (
          <div role="alert" className="rounded-lg border border-danger/50 bg-danger/10 px-4 py-3 text-sm">
            <strong>Error.</strong> {error.message}
          </div>
        )}

        {meters.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {meters.map((meter) => (
              <MeterCard key={meter.device_id} meter={meter} timeScale={timeScale} />
            ))}
          </div>
        )}

        <footer className="my-6 text-center text-xs text-muted">
          Temp Master Dashboard v2.0 - Built with React + TypeScript
        </footer>
      </main>
    </div>
  )
}
