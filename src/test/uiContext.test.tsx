import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { ReactNode } from 'react'
import { UIProvider, useUI } from '../contexts/UIContext'
import { fireEvent } from '@testing-library/react'

function wrapper({ children }: { children: ReactNode }) {
  return <UIProvider>{children}</UIProvider>
}

beforeEach(() => {
  localStorage.clear()
})

describe('UIContext initial state', () => {
  it('showProperties is false by default', () => {
    const { result } = renderHook(() => useUI(), { wrapper })
    expect(result.current.showProperties).toBe(false)
  })

  it('showQuickOpen is false by default', () => {
    const { result } = renderHook(() => useUI(), { wrapper })
    expect(result.current.showQuickOpen).toBe(false)
  })

  it('sidebarOpen defaults to true when localStorage is empty', () => {
    const { result } = renderHook(() => useUI(), { wrapper })
    expect(result.current.sidebarOpen).toBe(true)
  })

  it('sidebarOpen reads initial value from localStorage', () => {
    localStorage.setItem('sidebarOpen', 'false')
    const { result } = renderHook(() => useUI(), { wrapper })
    expect(result.current.sidebarOpen).toBe(false)
  })
})

describe('setSidebarOpen', () => {
  it('updates state and persists to localStorage', () => {
    const { result } = renderHook(() => useUI(), { wrapper })
    act(() => { result.current.setSidebarOpen(false) })
    expect(result.current.sidebarOpen).toBe(false)
    expect(localStorage.getItem('sidebarOpen')).toBe('false')
  })

  it('supports functional updater', () => {
    const { result } = renderHook(() => useUI(), { wrapper })
    act(() => { result.current.setSidebarOpen(v => !v) })
    expect(result.current.sidebarOpen).toBe(false)
  })
})

describe('keyboard shortcuts', () => {
  it('Cmd+K toggles showQuickOpen', () => {
    const { result } = renderHook(() => useUI(), { wrapper })
    act(() => {
      fireEvent.keyDown(document, { key: 'k', metaKey: true })
    })
    expect(result.current.showQuickOpen).toBe(true)
    act(() => {
      fireEvent.keyDown(document, { key: 'k', metaKey: true })
    })
    expect(result.current.showQuickOpen).toBe(false)
  })

  it('Ctrl+K also toggles showQuickOpen', () => {
    const { result } = renderHook(() => useUI(), { wrapper })
    act(() => {
      fireEvent.keyDown(document, { key: 'k', ctrlKey: true })
    })
    expect(result.current.showQuickOpen).toBe(true)
  })

  it('Escape closes showQuickOpen', () => {
    const { result } = renderHook(() => useUI(), { wrapper })
    act(() => {
      fireEvent.keyDown(document, { key: 'k', metaKey: true })
    })
    expect(result.current.showQuickOpen).toBe(true)
    act(() => {
      fireEvent.keyDown(document, { key: 'Escape' })
    })
    expect(result.current.showQuickOpen).toBe(false)
  })

  it('Cmd+\\ toggles sidebarOpen', () => {
    const { result } = renderHook(() => useUI(), { wrapper })
    act(() => {
      fireEvent.keyDown(document, { key: '\\', metaKey: true })
    })
    expect(result.current.sidebarOpen).toBe(false)
    expect(localStorage.getItem('sidebarOpen')).toBe('false')
    act(() => {
      fireEvent.keyDown(document, { key: '\\', metaKey: true })
    })
    expect(result.current.sidebarOpen).toBe(true)
  })
})
