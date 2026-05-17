import { useState, useEffect, useRef, useCallback } from 'react'

export function useCountdownTimer({ initialRemaining, initialRunning, onTick }) {
  const [remaining, setRemaining] = useState(initialRemaining)
  const [isRunning, setIsRunning] = useState(initialRunning)
  const intervalRef = useRef(null)

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
            clearInterval(intervalRef.current)
            setIsRunning(false)
          }
          return next
        })
      }, 1000)
    }
    return () => clearInterval(intervalRef.current)
  }, [isRunning]) // eslint-disable-line react-hooks/exhaustive-deps

  const start = useCallback(() => {
    if (remaining > 0) setIsRunning(true)
  }, [remaining])

  const pause = useCallback(() => setIsRunning(false), [])

  const reset = useCallback((newDuration) => {
    setIsRunning(false)
    setRemaining(newDuration)
    onTick?.(newDuration, false)
  }, [onTick])

  return { remaining, isRunning, start, pause, reset }
}

export function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0')
  const s = (seconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}
