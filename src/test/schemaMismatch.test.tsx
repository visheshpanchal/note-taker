import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { ReactNode } from 'react'
import { NotesProvider, useNotes } from '../contexts/NotesContext'
import { loadData, saveData } from '../utils/storage'
import { createDefaultData } from '../utils/noteFactory'
import { CURRENT_DATA_VERSION } from '../utils/schemaValidation'

vi.mock('../utils/storage', () => ({
  loadData: vi.fn(),
  saveData: vi.fn().mockResolvedValue({ success: true }),
}))

const mockLoadData = vi.mocked(loadData)
const mockSaveData = vi.mocked(saveData)

function wrapper({ children }: { children: ReactNode }) {
  return <NotesProvider>{children}</NotesProvider>
}

async function renderNotes() {
  const result = renderHook(() => useNotes(), { wrapper })
  await act(async () => {
    await Promise.resolve()
    vi.runAllTimers()
  })
  return result
}

beforeEach(() => {
  vi.useFakeTimers()
  mockSaveData.mockResolvedValue({ success: true })
})
afterEach(() => {
  vi.useRealTimers()
  vi.clearAllMocks()
})

// ─── No mismatch cases ────────────────────────────────────────────────────────

describe('schema mismatch detection — valid or absent data', () => {
  it('schemaMismatch is null when loadData returns null (first launch)', async () => {
    mockLoadData.mockResolvedValue(null)
    const { result } = await renderNotes()
    expect(result.current.schemaMismatch).toBeNull()
  })

  it('schemaMismatch is null when loadData returns valid AppData', async () => {
    mockLoadData.mockResolvedValue(createDefaultData())
    const { result } = await renderNotes()
    expect(result.current.schemaMismatch).toBeNull()
  })

  it('notes are loaded normally when data is valid', async () => {
    const data = { ...createDefaultData(), notes: [] }
    mockLoadData.mockResolvedValue(data)
    const { result } = await renderNotes()
    expect(result.current.notes).toEqual([])
    expect(result.current.schemaMismatch).toBeNull()
  })
})

// ─── Mismatch detection ───────────────────────────────────────────────────────

describe('schema mismatch detection — invalid data triggers mismatch', () => {
  it('sets schemaMismatch when loadData returns a non-object', async () => {
    mockLoadData.mockResolvedValue('corrupted' as never)
    const { result } = await renderNotes()
    expect(result.current.schemaMismatch).not.toBeNull()
    expect(result.current.schemaMismatch?.kind).toBe('not_object')
  })

  it('sets schemaMismatch when data version is mismatched', async () => {
    const badData = { ...createDefaultData(), version: CURRENT_DATA_VERSION + 5 }
    mockLoadData.mockResolvedValue(badData as never)
    const { result } = await renderNotes()
    expect(result.current.schemaMismatch?.kind).toBe('version_mismatch')
  })

  it('sets schemaMismatch when required field "notes" is missing', async () => {
    const { notes: _, ...noNotes } = createDefaultData()
    mockLoadData.mockResolvedValue(noNotes as never)
    const { result } = await renderNotes()
    expect(result.current.schemaMismatch?.kind).toBe('missing_field')
    expect((result.current.schemaMismatch as { kind: string; field: string } | null)?.field).toBe('notes')
  })

  it('sets schemaMismatch when "tags" is not an array', async () => {
    const badData = { ...createDefaultData(), tags: 'bad' }
    mockLoadData.mockResolvedValue(badData as never)
    const { result } = await renderNotes()
    expect(result.current.schemaMismatch?.kind).toBe('wrong_type')
  })

  it('does not populate notes when mismatch is detected', async () => {
    mockLoadData.mockResolvedValue('corrupted' as never)
    const { result } = await renderNotes()
    expect(result.current.schemaMismatch).not.toBeNull()
    expect(result.current.notes).toEqual([])
  })

  it('app is not in loading state after mismatch is detected', async () => {
    mockLoadData.mockResolvedValue(null as never)
    mockLoadData.mockResolvedValueOnce('bad' as never)
    const { result } = await renderNotes()
    expect(result.current.loading).toBe(false)
  })
})

// ─── replaceMismatchedData ────────────────────────────────────────────────────

describe('replaceMismatchedData', () => {
  it('clears schemaMismatch after replacing', async () => {
    mockLoadData.mockResolvedValue('corrupted' as never)
    const { result } = await renderNotes()
    expect(result.current.schemaMismatch).not.toBeNull()

    await act(async () => {
      await result.current.replaceMismatchedData()
      vi.runAllTimers()
    })

    expect(result.current.schemaMismatch).toBeNull()
  })

  it('calls saveData with default AppData structure', async () => {
    mockLoadData.mockResolvedValue('corrupted' as never)
    const { result } = await renderNotes()

    await act(async () => {
      await result.current.replaceMismatchedData()
      vi.runAllTimers()
    })

    expect(mockSaveData).toHaveBeenCalled()
    const savedArg = mockSaveData.mock.calls.at(-1)?.[0]
    expect(savedArg?.version).toBe(CURRENT_DATA_VERSION)
    expect(Array.isArray(savedArg?.notes)).toBe(true)
  })

  it('loads fresh default data after replacing', async () => {
    mockLoadData.mockResolvedValue('corrupted' as never)
    const { result } = await renderNotes()

    await act(async () => {
      await result.current.replaceMismatchedData()
      vi.runAllTimers()
    })

    expect(result.current.notes).toEqual([])
    expect(result.current.tags).toEqual([])
  })

  it('is a no-op on valid data (schemaMismatch stays null)', async () => {
    mockLoadData.mockResolvedValue(createDefaultData())
    const { result } = await renderNotes()
    expect(result.current.schemaMismatch).toBeNull()

    await act(async () => {
      await result.current.replaceMismatchedData()
      vi.runAllTimers()
    })

    expect(result.current.schemaMismatch).toBeNull()
  })
})
