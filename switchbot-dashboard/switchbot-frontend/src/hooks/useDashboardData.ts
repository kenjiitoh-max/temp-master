import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchMeters, fetchStatus, triggerRefresh } from '../api/client'
import { REFRESH_INTERVAL } from '../constants/timeScales'
import type { Meter, StatusResponse } from '../types'

export interface DashboardData {
  meters: Meter[]
  status: StatusResponse | null
  error: string | null
  loading: boolean
  connected: boolean
  lastRefresh: Date | null
  refreshing: boolean
  reload: () => Promise<void>
  requestCollection: () => Promise<void>
}

export function useDashboardData(): DashboardData {
  const [meters, setMeters] = useState<Meter[]>([])
  const [status, setStatus] = useState<StatusResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  const reload = useCallback(async () => {
    try {
      const [metersResponse, statusResponse] = await Promise.all([fetchMeters(), fetchStatus()])
      if (!mounted.current) return
      setMeters(metersResponse.meters ?? [])
      setStatus(statusResponse)
      setError(null)
      setLastRefresh(new Date())
    } catch (err) {
      if (!mounted.current) return
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      if (mounted.current) setLoading(false)
    }
  }, [])

  const requestCollection = useCallback(async () => {
    setRefreshing(true)
    try {
      await triggerRefresh()
    } catch (err) {
      if (mounted.current) {
        setError(err instanceof Error ? err.message : String(err))
      }
    } finally {
      await reload()
      if (mounted.current) setRefreshing(false)
    }
  }, [reload])

  useEffect(() => {
    void reload()
    const timer = window.setInterval(() => void reload(), REFRESH_INTERVAL)
    return () => window.clearInterval(timer)
  }, [reload])

  return {
    meters,
    status,
    error,
    loading,
    connected: error === null,
    lastRefresh,
    refreshing,
    reload,
    requestCollection,
  }
}
