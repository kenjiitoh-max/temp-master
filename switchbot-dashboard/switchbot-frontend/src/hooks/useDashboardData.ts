import { useCallback, useEffect, useState } from 'react'
import { fetchMeters, fetchStatus, triggerRefresh } from '../api/client'
import type { MeterDevice, StatusResponse } from '../types'

const REFRESH_INTERVAL = 30000

export interface DashboardData {
  meters: MeterDevice[]
  status: StatusResponse | null
  connected: boolean
  error: string | null
  loading: boolean
  lastRefresh: Date | null
  refreshTick: number
  refreshing: boolean
  refresh: () => Promise<void>
  reload: () => Promise<void>
}

export function useDashboardData(): DashboardData {
  const [meters, setMeters] = useState<MeterDevice[]>([])
  const [status, setStatus] = useState<StatusResponse | null>(null)
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)
  const [refreshTick, setRefreshTick] = useState(0)
  const [refreshing, setRefreshing] = useState(false)

  const reload = useCallback(async () => {
    try {
      // Fetch meters and status in parallel instead of nested callbacks.
      const [metersResp, statusResp] = await Promise.all([fetchMeters(), fetchStatus()])
      setMeters(metersResp.meters ?? [])
      setStatus(statusResp)
      setConnected(true)
      setError(null)
      setLastRefresh(new Date())
      setRefreshTick((t) => t + 1)
    } catch (err) {
      setConnected(false)
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }, [])

  const refresh = useCallback(async () => {
    setRefreshing(true)
    try {
      await triggerRefresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      await reload()
      setRefreshing(false)
    }
  }, [reload])

  useEffect(() => {
    void reload()
    const id = window.setInterval(() => {
      void reload()
    }, REFRESH_INTERVAL)
    return () => window.clearInterval(id)
  }, [reload])

  return {
    meters,
    status,
    connected,
    error,
    loading,
    lastRefresh,
    refreshTick,
    refreshing,
    refresh,
    reload,
  }
}
