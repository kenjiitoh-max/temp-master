import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchMeters, fetchStatus, triggerRefresh } from '../api/client'
import type { MeterDevice, StatusResponse } from '../types'
import { formatClock } from '../utils/format'

export const REFRESH_INTERVAL_MS = 30_000

interface DashboardData {
  meters: MeterDevice[]
  status: StatusResponse | null
  loading: boolean
  error: string | null
  connected: boolean
  lastRefresh: string | null
  /** 変わるたびにチャートが履歴を再取得する */
  reloadToken: number
  refreshing: boolean
  reload: () => Promise<void>
  refresh: () => Promise<void>
}

export function useDashboardData(): DashboardData {
  const [meters, setMeters] = useState<MeterDevice[]>([])
  const [status, setStatus] = useState<StatusResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [connected, setConnected] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<string | null>(null)
  const [reloadToken, setReloadToken] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const mounted = useRef(true)

  const reload = useCallback(async () => {
    try {
      // 旧実装はコールバックをネストして順番に取っていたが、並列で取得する
      const [metersRes, statusRes] = await Promise.all([fetchMeters(), fetchStatus()])
      if (!mounted.current) return
      setMeters(metersRes.meters ?? [])
      setStatus(statusRes)
      setLastRefresh(formatClock(new Date()))
      setConnected(true)
      setError(null)
      setReloadToken((n) => n + 1)
    } catch (err: unknown) {
      if (!mounted.current) return
      setConnected(false)
      setError(`Failed to fetch data: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      if (mounted.current) setLoading(false)
    }
  }, [])

  const refresh = useCallback(async () => {
    setRefreshing(true)
    try {
      await triggerRefresh()
    } catch (err: unknown) {
      if (mounted.current) {
        setError(`Failed to refresh: ${err instanceof Error ? err.message : String(err)}`)
      }
    }
    await reload()
    if (mounted.current) setRefreshing(false)
  }, [reload])

  useEffect(() => {
    mounted.current = true
    void reload()
    const id = window.setInterval(() => void reload(), REFRESH_INTERVAL_MS)
    return () => {
      mounted.current = false
      window.clearInterval(id)
    }
  }, [reload])

  return { meters, status, loading, error, connected, lastRefresh, reloadToken, refreshing, reload, refresh }
}
