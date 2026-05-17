import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { loadData, saveData } from '../utils/storage'

describe('storage (localStorage fallback)', () => {
  beforeEach(() => {
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
    const data = { version: 1, notes: [], tags: [] } as unknown as Parameters<typeof saveData>[0]
    await saveData(data)
    const raw = localStorage.getItem('notetaker_data')
    expect(JSON.parse(raw!)).toEqual(data)
  })

  it('loadData reads back what saveData wrote', async () => {
    const data = { version: 1, notes: [{ id: '1', title: 'Test' }] } as unknown as Parameters<typeof saveData>[0]
    await saveData(data)
    const result = await loadData()
    expect(result).toEqual(data)
  })

  it('saveData returns success result', async () => {
    const result = await saveData({ notes: [] } as unknown as Parameters<typeof saveData>[0])
    expect(result).toEqual({ success: true })
  })
})
