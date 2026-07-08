import { useState } from 'react'
import './App.css'
import { Navbar } from './components/Navbar'
import { Controls } from './components/Controls'
import { StatusBar } from './components/StatusBar'
import { RateLimitWarning } from './components/RateLimitWarning'
import { MeterCard } from './components/MeterCard'
import { downloadBackup } from './api/client'
import { useDashboardData } from './hooks/useDashboardData'
import type { TimeScale } from './types'

export default function App() {
  const [timeScale, setTimeScale] = useState<TimeScale>('day')
  const {
    meters,
    status,
    connected,
    error,
    loading,
    lastRefresh,
    refreshTick,
    refreshing,
    refresh,
  } = useDashboardData()

  return (
    <>
      <Navbar connected={connected} />
      <div className="container">
        <Controls
          timeScale={timeScale}
          onTimeScaleChange={setTimeScale}
          onRefresh={() => void refresh()}
          onDownloadBackup={downloadBackup}
          refreshing={refreshing}
        />

        <StatusBar status={status} lastRefresh={lastRefresh} />
        <RateLimitWarning status={status} />

        {loading && (
          <div className="loading">
            <p>Loading temperature data...</p>
          </div>
        )}

        {error && !loading && (
          <div className="alert alert-danger">
            <span>
              <strong>Error.</strong> {error}
            </span>
          </div>
        )}

        <div className="meters-grid">
          {meters.map((meter) => (
            <MeterCard
              key={meter.device_id}
              meter={meter}
              timeScale={timeScale}
              refreshTick={refreshTick}
            />
          ))}
        </div>

        <footer>Temp Master Dashboard v1.0 - Built with React + Vite</footer>
      </div>
    </>
  )
}
