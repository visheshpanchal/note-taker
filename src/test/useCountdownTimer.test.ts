import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useCountdownTimer, formatTime } from '../hooks/useCountdownTimer'

describe('formatTime', () => {
  it('formats seconds into MM:SS', () => {
    expect(formatTime(0)).toBe('00:00')
    expect(formatTime(59)).toBe('00:59')
    expect(formatTime(60)).toBe('01:00')
    expect(formatTime(90)).toBe('01:30')
    expect(formatTime(3600)).toBe('60:00')
  })
})

describe('useCountdownTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('initialises with provided values', () => {
    const { result } = renderHook(() =>
      useCountdownTimer({ initialRemaining: 10, initialRunning: false })
    )
    expect(result.current.remaining).toBe(10)
    expect(result.current.isRunning).toBe(false)
  })

  it('starts counting down on start()', () => {
    const { result } = renderHook(() =>
      useCountdownTimer({ initialRemaining: 5, initialRunning: false })
    )
    act(() => result.current.start())
    expect(result.current.isRunning).toBe(true)

    act(() => vi.advanceTimersByTime(3000))
    expect(result.current.remaining).toBe(2)
  })

  it('stops at zero and sets isRunning to false', () => {
    const onTick = vi.fn()
    const { result } = renderHook(() =>
      useCountdownTimer({ initialRemaining: 2, initialRunning: false, onTick })
    )
    act(() => result.current.start())
    act(() => vi.advanceTimersByTime(2000))

    expect(result.current.remaining).toBe(0)
    expect(result.current.isRunning).toBe(false)
    expect(onTick).toHaveBeenCalledWith(0, true)
  })

  it('pause() stops the timer without resetting it', () => {
    const { result } = renderHook(() =>
      useCountdownTimer({ initialRemaining: 10, initialRunning: false })
    )
    act(() => result.current.start())
    act(() => vi.advanceTimersByTime(3000))
    act(() => result.current.pause())

    expect(result.current.isRunning).toBe(false)
    const remaining = result.current.remaining
    act(() => vi.advanceTimersByTime(3000))
    expect(result.current.remaining).toBe(remaining)
  })

  it('reset() stops the timer and restores duration', () => {
    const onTick = vi.fn()
    const { result } = renderHook(() =>
      useCountdownTimer({ initialRemaining: 10, initialRunning: false, onTick })
    )
    act(() => result.current.start())
    act(() => vi.advanceTimersByTime(5000))
    act(() => result.current.reset(10))

    expect(result.current.isRunning).toBe(false)
    expect(result.current.remaining).toBe(10)
    expect(onTick).toHaveBeenLastCalledWith(10, false)
  })

  it('start() is a no-op when remaining is 0', () => {
    const { result } = renderHook(() =>
      useCountdownTimer({ initialRemaining: 0, initialRunning: false })
    )
    act(() => result.current.start())
    expect(result.current.isRunning).toBe(false)
  })

  it('syncs remaining when initialRemaining prop changes', () => {
    let remaining = 10
    const { result, rerender } = renderHook(() =>
      useCountdownTimer({ initialRemaining: remaining, initialRunning: false })
    )
    expect(result.current.remaining).toBe(10)

    remaining = 30
    rerender()
    expect(result.current.remaining).toBe(30)
  })
})
