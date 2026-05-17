import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useReminderChecker } from '../hooks/useReminderChecker'
import { useNotes } from '../contexts/NotesContext'

vi.mock('../contexts/NotesContext')

const mockUpdateNote = vi.fn()

function makeNote(overrides: Record<string, unknown>) {
  return {
    id: 'note-1',
    type: 'todo',
    title: 'Test Todo',
    items: [],
    reminderAt: null,
    reminderNotified: false,
    folderId: null,
    ...overrides,
  }
}

function setup(notes: ReturnType<typeof makeNote>[]) {
  vi.mocked(useNotes).mockReturnValue({
    notes,
    updateNote: mockUpdateNote,
  } as ReturnType<typeof useNotes>)
}

beforeEach(() => {
  vi.useFakeTimers()
  mockUpdateNote.mockClear()
  vi.stubGlobal('electronAPI', {
    notifications: { show: vi.fn() },
  })
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('useReminderChecker', () => {
  it('fires a notification for a past reminder on mount', () => {
    const note = makeNote({ reminderAt: '2020-01-01T00:00:00Z', reminderNotified: false })
    setup([note])
    renderHook(() => useReminderChecker())
    expect(window.electronAPI?.notifications?.show).toHaveBeenCalledWith(
      expect.objectContaining({ noteId: 'note-1' })
    )
    expect(mockUpdateNote).toHaveBeenCalledWith('note-1', { reminderNotified: true })
  })

  it('does not fire if reminderNotified is already true', () => {
    const note = makeNote({ reminderAt: '2020-01-01T00:00:00Z', reminderNotified: true })
    setup([note])
    renderHook(() => useReminderChecker())
    expect(window.electronAPI?.notifications?.show).not.toHaveBeenCalled()
    expect(mockUpdateNote).not.toHaveBeenCalled()
  })

  it('does not fire if reminderAt is in the future', () => {
    const future = new Date(Date.now() + 60_000).toISOString()
    const note = makeNote({ reminderAt: future, reminderNotified: false })
    setup([note])
    renderHook(() => useReminderChecker())
    expect(window.electronAPI?.notifications?.show).not.toHaveBeenCalled()
  })

  it('does not fire for note or diagram types', () => {
    const noteType = makeNote({ type: 'note', reminderAt: '2020-01-01T00:00:00Z', reminderAt_set: true })
    const diagramType = makeNote({ id: 'note-2', type: 'diagram', reminderAt: '2020-01-01T00:00:00Z' })
    setup([noteType, diagramType])
    renderHook(() => useReminderChecker())
    expect(window.electronAPI?.notifications?.show).not.toHaveBeenCalled()
  })

  it('fires for dayplan type', () => {
    const plan = makeNote({
      id: 'plan-1',
      type: 'dayplan',
      title: 'Day Plan',
      date: '2026-01-01',
      reminderAt: '2020-01-01T00:00:00Z',
      reminderNotified: false,
    })
    setup([plan])
    renderHook(() => useReminderChecker())
    expect(window.electronAPI?.notifications?.show).toHaveBeenCalledWith(
      expect.objectContaining({ noteId: 'plan-1' })
    )
  })

  it('includes pending item count in todo notification body', () => {
    const note = makeNote({
      reminderAt: '2020-01-01T00:00:00Z',
      reminderNotified: false,
      items: [
        { id: '1', text: 'a', checked: false },
        { id: '2', text: 'b', checked: true },
      ],
    })
    setup([note])
    renderHook(() => useReminderChecker())
    expect(window.electronAPI?.notifications?.show).toHaveBeenCalledWith(
      expect.objectContaining({ body: expect.stringContaining('1') })
    )
  })

  it('sets up a 60-second interval', () => {
    setup([])
    renderHook(() => useReminderChecker())
    const spy = vi.spyOn(window.electronAPI!.notifications!, 'show')
    vi.advanceTimersByTime(60_000)
    expect(spy).not.toHaveBeenCalled()
  })

  it('clears the interval on unmount', () => {
    setup([])
    const clearSpy = vi.spyOn(global, 'clearInterval')
    const { unmount } = renderHook(() => useReminderChecker())
    unmount()
    expect(clearSpy).toHaveBeenCalled()
  })
})
