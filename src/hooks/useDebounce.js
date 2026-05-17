import { useEffect, useRef } from 'react'

export function useDebounce(fn, delay, deps) {
  const timer = useRef(null)
  useEffect(() => {
    timer.current = setTimeout(fn, delay)
    return () => clearTimeout(timer.current)
  }, deps) // eslint-disable-line react-hooks/exhaustive-deps
}
