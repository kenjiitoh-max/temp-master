import { useEffect, useState } from 'react'
import { fetchHistory } from '../api/client'
import type { Reading, TimeScale } from '../types'

export function useHistory(deviceId: string, timeScale: TimeScale, revision: number) {
  const [history, setHistory] = useState<Reading[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    fetchHistory(deviceId, timeScale, controller.signal)
      .then((response) => {
        setHistory(response.history ?? [])
        setError(null)
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return
        setError(err instanceof Error ? err.message : String(err))
      })
    return () => controller.abort()
  }, [deviceId, timeScale, revision])

  return { history, error }
}
