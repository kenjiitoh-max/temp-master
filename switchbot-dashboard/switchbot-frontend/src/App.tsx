import { useState } from 'react'
import { Controls } from './components/Controls'
import { DeviceList } from './components/DeviceList'
import { Header } from './components/Header'
import { StatusBar } from './components/StatusBar'
import { useDashboardData } from './hooks/useDashboardData'
import type { TimeScale } from './types'

export default function App() {
  const [timeScale, setTimeScale] = useState<TimeScale>('day')
  const { meters, status, loading, error, connected, lastRefresh, reloadToken, refreshing, refresh } =
    useDashboardData()

  return (
    <div className="min-h-screen bg-bg text-fg">
      <Header connected={connected} />
      <main className="mx-auto flex max-w-screen-2xl flex-col gap-4 px-4 pt-20 pb-6">
        <Controls
          timeScale={timeScale}
          onTimeScaleChange={setTimeScale}
          onRefresh={() => void refresh()}
          refreshing={refreshing}
        />
        <StatusBar status={status} lastRefresh={lastRefresh} />
        {loading && <p className="py-10 text-center text-fg-muted">Loading temperature data...</p>}
        {error && (
          <div
            id="error"
            role="alert"
            className="rounded-lg border border-border bg-danger-bg px-4 py-3 text-sm text-danger-fg"
          >
            <strong>Error.</strong> {error}
          </div>
        )}
        {!loading && !(error && meters.length === 0) && (
          <DeviceList meters={meters} timeScale={timeScale} reloadToken={reloadToken} />
        )}
        <footer className="mt-6 text-center text-xs text-fg-muted">
          Temp Master Dashboard v2.0 - Built with React + TypeScript + Vite + Tailwind CSS
        </footer>
      </main>
    </div>
  )
}
