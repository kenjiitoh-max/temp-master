import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { API_URL, fetchHistory, fetchMeters, fetchStatus, triggerRefresh } from './api'
import { ErrorBanner } from './components/ErrorBanner'
import { MeterCard } from './components/MeterCard'
import { RateLimitWarning } from './components/RateLimitWarning'
import { StatusBar } from './components/StatusBar'
import { TimeScaleSelector } from './components/TimeScaleSelector'
import { type Theme } from './theme'
import { useTheme } from './useTheme'
import type { MeterDevice, MeterReading, StatusResponse, TimeScale } from './types'
import './styles.css'

const REFRESH_INTERVAL = 30000

export default function App() {
  const { theme, setTheme } = useTheme()
  const [meters, setMeters] = useState<MeterDevice[]>([])
  const [status, setStatus] = useState<StatusResponse | null>(null)
  const [histories, setHistories] = useState<Record<string, MeterReading[]>>({})
  const historiesRef = useRef(histories)
  const [timeScale, setTimeScale] = useState<TimeScale>('day')
  const [loading, setLoading] = useState(true)
  const [historyLoading, setHistoryLoading] = useState<Record<string, boolean>>({})
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)
  const [refreshVersion, setRefreshVersion] = useState(0)

  const loadData = useCallback(async () => {
    try {
      const [metersResponse, statusResponse] = await Promise.all([
        fetchMeters(),
        fetchStatus(),
      ])
      setMeters(metersResponse.meters)
      setStatus(statusResponse)
      setError(null)
      setLastRefresh(new Date())
      setRefreshVersion((version) => version + 1)
    } catch (loadError) {
      setError(`Failed to fetch data: ${loadError instanceof Error ? loadError.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadData()
    const interval = window.setInterval(() => void loadData(), REFRESH_INTERVAL)
    return () => window.clearInterval(interval)
  }, [loadData])

  const deviceIds = useMemo(
    () => meters.map((meter) => meter.device_id).join('|'),
    [meters],
  )

  useEffect(() => {
    historiesRef.current = histories
  }, [histories])

  useEffect(() => {
    if (!deviceIds) {
      setHistories({})
      setHistoryLoading({})
      return
    }
    let cancelled = false
    const devices = deviceIds.split('|')
    setHistoryLoading((previous) => {
      const next = { ...previous }
      devices.forEach((deviceId) => {
        next[deviceId] = !Object.prototype.hasOwnProperty.call(historiesRef.current, deviceId)
      })
      return next
    })

    Promise.allSettled(devices.map((deviceId) => fetchHistory(deviceId, timeScale)))
      .then((results) => {
        if (cancelled) return
        const nextHistories: Record<string, MeterReading[]> = {}
        results.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            nextHistories[devices[index]] = result.value.history
          }
        })
        setHistories((previous) => {
          const next = { ...previous }
          Object.assign(next, nextHistories)
          return next
        })
      })
      .finally(() => {
        if (!cancelled) {
          setHistoryLoading((previous) => {
            const next = { ...previous }
            devices.forEach((deviceId) => {
              next[deviceId] = false
            })
            return next
          })
        }
      })

    return () => {
      cancelled = true
    }
  }, [deviceIds, refreshVersion, timeScale])

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await triggerRefresh()
      await loadData()
    } catch (refreshError) {
      setError(`Failed to refresh: ${refreshError instanceof Error ? refreshError.message : 'Unknown error'}`)
    } finally {
      setRefreshing(false)
    }
  }

  return (
    <div className="app-shell">
      <nav className="navbar">
        <a className="brand" href="/">Temp Master Dashboard</a>
        <div className="nav-actions">
          <span className={`connection-status ${error ? 'is-disconnected' : 'is-connected'}`}>
            <span className="status-dot" aria-hidden="true" />
            {error ? 'Disconnected' : 'Connected'}
          </span>
          <label className="theme-control">
            <span>Theme</span>
            <select value={theme} onChange={(event) => setTheme(event.target.value as Theme)}>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="high-contrast">High contrast</option>
              <option value="ocean">Ocean</option>
            </select>
          </label>
        </div>
      </nav>

      <main className="page-content">
        <section className="hero">
          <div>
            <p className="eyebrow">Operations telemetry</p>
            <h1>Temperature at a glance</h1>
            <p className="hero-copy">Monitor every SwitchBot meter and its recent history.</p>
          </div>
          <div className="controls">
            <TimeScaleSelector value={timeScale} onChange={setTimeScale} />
            <button className="button button-primary" type="button" onClick={() => void handleRefresh()} disabled={refreshing}>
              {refreshing ? 'Refreshing…' : 'Refresh Data'}
            </button>
            <button className="button button-secondary" type="button" onClick={() => window.open(`${API_URL}/api/backup`, '_blank')}>
              Download Backup
            </button>
          </div>
        </section>

        <StatusBar status={status} lastRefresh={lastRefresh} />
        {status?.is_rate_limited && <RateLimitWarning remaining={status.backoff_remaining} />}
        {error && <ErrorBanner message={error} />}

        {loading ? (
          <div className="loading-state">Loading temperature data…</div>
        ) : meters.length === 0 ? (
          <div className="empty-state">No meters are available yet.</div>
        ) : (
          <section className="meter-grid" aria-label="SwitchBot meters">
            {meters.map((meter) => (
              <MeterCard
                key={meter.device_id}
                meter={meter}
                readings={histories[meter.device_id] ?? []}
                timeScale={timeScale}
                historyLoading={historyLoading[meter.device_id] ?? false}
              />
            ))}
          </section>
        )}
      </main>

      <footer>Temp Master Dashboard v1.0 · Built with React + Vite + Recharts</footer>
    </div>
  )
}
