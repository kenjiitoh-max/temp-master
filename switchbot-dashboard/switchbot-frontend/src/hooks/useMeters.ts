import { useCallback, useEffect, useState } from 'react'
import { fetchMeters, fetchStatus, triggerRefresh } from '../api/client'
import type { Meter, StatusResponse } from '../api/types'

export interface MetersState {
  meters: Meter[]
  status: StatusResponse | null
  connected: boolean
  loading: boolean
  error: string | null
  lastRefresh: Date | null
  refreshing: boolean
  reload: () => Promise<void>
  refreshData: () => Promise<void>
}

export function useMeters(): MetersState {
  const [meters, setMeters] = useState<Meter[]>([])
  const [status, setStatus] = useState<StatusResponse | null>(null)
  const [connected, setConnected] = useState(true)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const reload = useCallback(async () => {
    try {
      // Fetch meters and status in parallel (replaces the legacy nested callbacks).
      const [metersResp, statusResp] = await Promise.all([
        fetchMeters(),
        fetchStatus(),
      ])
      setMeters(metersResp.meters ?? [])
      setStatus(statusResp)
      setConnected(true)
      setError(null)
      setLastRefresh(new Date())
    } catch (err) {
      setConnected(false)
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }, [])

  const refreshData = useCallback(async () => {
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
  }, [reload])

  return {
    meters,
    status,
    connected,
    loading,
    error,
    lastRefresh,
    refreshing,
    reload,
    refreshData,
  }
}
