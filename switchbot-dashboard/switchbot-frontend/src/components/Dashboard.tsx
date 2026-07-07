import { useCallback, useState } from 'react'
import type { TimeScale } from '../api/types'
import { backupUrl } from '../api/client'
import { useMeters } from '../hooks/useMeters'
import { usePolling } from '../hooks/usePolling'
import { ControlBar } from './ControlBar'
import { MeterCard } from './MeterCard'
import { RateLimitBanner } from './RateLimitBanner'
import { StatusBar } from './StatusBar'

const REFRESH_INTERVAL = 30000

export function Dashboard() {
  const [timeScale, setTimeScale] = useState<TimeScale>('day')
  const [refreshKey, setRefreshKey] = useState(0)
  const {
    meters,
    status,
    connected,
    loading,
    error,
    lastRefresh,
    refreshing,
    reload,
    refreshData,
  } = useMeters()

  // Poll every 30s: reload meters/status and force charts to refetch history.
  usePolling(
    useCallback(() => {
      void reload()
      setRefreshKey((k) => k + 1)
    }, [reload]),
    REFRESH_INTERVAL,
  )

  const handleTimeScaleChange = useCallback((value: TimeScale) => {
    setTimeScale(value)
    setRefreshKey((k) => k + 1)
  }, [])

  const handleRefresh = useCallback(async () => {
    await refreshData()
    setRefreshKey((k) => k + 1)
  }, [refreshData])

  const handleBackup = useCallback(() => {
    window.open(backupUrl(), '_blank')
  }, [])

  return (
    <>
      <nav className="navbar">
        <span className="navbar-brand">Temp Master Dashboard</span>
        <div className="navbar-right">
          <span
            className={`connection-status ${
              connected ? 'connected' : 'disconnected'
            }`}
          >
            {connected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </nav>

      <div className="container">
        <ControlBar
          timeScale={timeScale}
          onTimeScaleChange={handleTimeScaleChange}
          onRefresh={handleRefresh}
          onBackup={handleBackup}
          refreshing={refreshing}
        />

        <StatusBar status={status} lastRefresh={lastRefresh} />
        <RateLimitBanner status={status} />

        {loading && <div className="loading">Loading temperature data...</div>}

        {error && !connected && (
          <div className="alert alert-danger">
            <strong>Error.</strong> {error}
          </div>
        )}

        {!loading && (
          <div className="meters-grid">
            {meters.map((meter) => (
              <MeterCard
                key={meter.device_id}
                meter={meter}
                timeScale={timeScale}
                refreshKey={refreshKey}
              />
            ))}
          </div>
        )}

        <footer>Temp Master Dashboard v2.0 - Built with React + Vite</footer>
      </div>
    </>
  )
}
