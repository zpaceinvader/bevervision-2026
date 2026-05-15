import { useEffect, useRef } from 'react'
import type { Socket } from 'socket.io-client'

/**
 * Returns an emit function that coalesces emits per key with a delay.
 * Last-write-wins per key (e.g. score for country 4 → only the most recent value goes out).
 */
export function useDebouncedEmit(socket: Socket, delayMs = 300) {
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>())
  const latest = useRef(new Map<string, { event: string; payload: unknown }>())

  useEffect(() => {
    const timersSnapshot = timers.current
    return () => {
      for (const t of timersSnapshot.values()) clearTimeout(t)
      timersSnapshot.clear()
    }
  }, [])

  return function emit(key: string, event: string, payload: unknown) {
    const existing = timers.current.get(key)
    if (existing) clearTimeout(existing)
    latest.current.set(key, { event, payload })
    const timeout = setTimeout(() => {
      const queued = latest.current.get(key)
      if (queued) socket.emit(queued.event, queued.payload)
      timers.current.delete(key)
      latest.current.delete(key)
    }, delayMs)
    timers.current.set(key, timeout)
  }
}
