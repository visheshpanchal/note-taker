import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useDebounce } from '../hooks/useDebounce'

describe('useDebounce', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('does not call fn immediately', () => {
    const fn = vi.fn()
    renderHook(() => useDebounce(fn, 300, []))
    expect(fn).not.toHaveBeenCalled()
  })

  it('calls fn after the delay', () => {
    const fn = vi.fn()
    renderHook(() => useDebounce(fn, 300, []))
    vi.advanceTimersByTime(300)
    expect(fn).toHaveBeenCalledOnce()
  })

  it('resets the timer when deps change', () => {
    const fn = vi.fn()
    let dep = 0
    const { rerender } = renderHook(() => useDebounce(fn, 300, [dep]))

    vi.advanceTimersByTime(200)
    dep = 1
    rerender()
    vi.advanceTimersByTime(200)
    expect(fn).not.toHaveBeenCalled()

    vi.advanceTimersByTime(100)
    expect(fn).toHaveBeenCalledOnce()
  })

  it('cancels the timer on unmount', () => {
    const fn = vi.fn()
    const { unmount } = renderHook(() => useDebounce(fn, 300, []))
    unmount()
    vi.advanceTimersByTime(300)
    expect(fn).not.toHaveBeenCalled()
  })
})
