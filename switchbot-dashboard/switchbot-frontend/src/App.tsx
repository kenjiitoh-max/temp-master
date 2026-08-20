import { useState } from 'react'
import { Controls } from './components/Controls'
import { Header } from './components/Header'
import { MeterCard } from './components/MeterCard'
import { StatusBar } from './components/StatusBar'
import { useDashboardData } from './hooks/useDashboardData'
import type { TimeScale } from './types'

export default function App() {
  const [timeScale, setTimeScale] = useState<TimeScale>('day')
  const { meters, status, error, loading, connected, lastRefresh, refreshing, requestCollection } =
    useDashboardData()

  return (
    <div className="app">
      <Header connected={connected} />
      <main className="container">
        <Controls
          timeScale={timeScale}
          onTimeScaleChange={setTimeScale}
          onRefresh={() => void requestCollection()}
          refreshing={refreshing}
        />

        <StatusBar status={status} lastRefresh={lastRefresh} />

        {error && (
          <div className="alert alert--danger">
            <span>
              <strong>Error.</strong> {error}
            </span>
          </div>
        )}

        {loading ? (
          <p className="loading">Loading temperature data...</p>
        ) : (
          <div className="meter-grid">
            {meters.map((meter) => (
              <MeterCard
                key={meter.device_id}
                meter={meter}
                timeScale={timeScale}
                revision={lastRefresh ? lastRefresh.getTime() : 0}
              />
            ))}
          </div>
        )}

        <footer className="app-footer">
          Temp Master Dashboard v1.0 - Built with React + TypeScript + Vite + Recharts
        </footer>
      </main>
    </div>
  )
}
