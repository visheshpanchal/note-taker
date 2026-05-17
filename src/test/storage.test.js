import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { loadData, saveData } from '../utils/storage.js'

describe('storage (localStorage fallback)', () => {
  beforeEach(() => {
    // Ensure no electronAPI is present
    vi.stubGlobal('window', { ...window, electronAPI: undefined })
    localStorage.clear()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('loadData returns null when storage is empty', async () => {
    const result = await loadData()
    expect(result).toBeNull()
  })

  it('saveData persists data to localStorage', async () => {
    const data = { version: 1, notes: [], tags: [] }
    await saveData(data)
    const raw = localStorage.getItem('notetaker_data')
    expect(JSON.parse(raw)).toEqual(data)
  })

  it('loadData reads back what saveData wrote', async () => {
    const data = { version: 1, notes: [{ id: '1', title: 'Test' }] }
    await saveData(data)
    const result = await loadData()
    expect(result).toEqual(data)
  })

  it('saveData returns success result', async () => {
    const result = await saveData({ notes: [] })
    expect(result).toEqual({ success: true })
  })
})

// Note: the Electron API path (window.electronAPI.data) cannot be tested via
// vi.stubGlobal because storage.js captures `const api` at module-load time.
// That path is covered by integration / e2e tests in the Electron environment.
