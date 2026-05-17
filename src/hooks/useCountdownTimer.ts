import { useState, useEffect, useRef, useCallback } from 'react'

interface UseCountdownTimerOptions {
  initialRemaining: number
  initialRunning: boolean
  onTick?: (remaining: number, done: boolean) => void
}

interface UseCountdownTimerResult {
  remaining: number
  isRunning: boolean
  start: () => void
  pause: () => void
  reset: (newDuration: number) => void
}

export function useCountdownTimer({
  initialRemaining,
  initialRunning,
  onTick
}: UseCountdownTimerOptions): UseCountdownTimerResult {
  const [remaining, setRemaining] = useState(initialRemaining)
  const [isRunning, setIsRunning] = useState(initialRunning)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    setRemaining(initialRemaining)
  }, [initialRemaining])

  useEffect(() => {
    if (isRunning && remaining > 0) {
      intervalRef.current = setInterval(() => {
        setRemaining(prev => {
          const next = prev - 1
          onTick?.(next, next === 0)
          if (next <= 0) {
            if (intervalRef.current) clearInterval(intervalRef.current)
            setIsRunning(false)
          }
          return next
        })
      }, 1000)
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isRunning]) // eslint-disable-line react-hooks/exhaustive-deps

  const start = useCallback(() => {
    if (remaining > 0) setIsRunning(true)
  }, [remaining])

  const pause = useCallback(() => setIsRunning(false), [])

  const reset = useCallback((newDuration: number) => {
    setIsRunning(false)
    setRemaining(newDuration)
    onTick?.(newDuration, false)
  }, [onTick])

  return { remaining, isRunning, start, pause, reset }
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0')
  const s = (seconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}
