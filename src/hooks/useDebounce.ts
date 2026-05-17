import { useEffect, useRef, DependencyList } from 'react'

export function useDebounce(fn: () => void, delay: number, deps: DependencyList): void {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    timer.current = setTimeout(fn, delay)
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, deps) // eslint-disable-line react-hooks/exhaustive-deps
}
