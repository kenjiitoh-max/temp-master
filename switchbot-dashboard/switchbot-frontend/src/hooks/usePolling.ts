import { useEffect, useRef } from 'react'

// Invokes `callback` every `intervalMs` milliseconds using a stable interval,
// without resetting the timer when the callback identity changes.
export function usePolling(callback: () => void, intervalMs: number): void {
  const savedCallback = useRef(callback)

  useEffect(() => {
    savedCallback.current = callback
  }, [callback])

  useEffect(() => {
    const id = window.setInterval(() => savedCallback.current(), intervalMs)
    return () => window.clearInterval(id)
  }, [intervalMs])
}
