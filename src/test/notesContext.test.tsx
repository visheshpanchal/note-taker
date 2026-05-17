import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { ReactNode } from 'react'
import { NotesProvider, useNotes } from '../contexts/NotesContext'

vi.mock('../utils/storage', () => ({
  loadData: vi.fn().mockResolvedValue(null),
  saveData: vi.fn().mockResolvedValue({ success: true }),
}))

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

function makeFolder(id: string, name: string, parentId: string | null = null) {
  return { id, name, parentId, icon: '📁', createdAt: new Date().toISOString() }
}

function makeNote(id: string, overrides: Record<string, unknown> = {}) {
  const now = new Date().toISOString()
  return {
    id, type: 'note' as const, title: 'Test Note', content: '',
    tags: [], tagIds: [], notebookId: null, folderId: null,
    isPinned: false, isFavorite: false, dueDate: null, color: null,
    category: null, attachments: [], locationTag: '',
    createdAt: now, updatedAt: now,
    metadata: {}, extensions: {},
    ...overrides,
  }
}

function wrapper({ children }: { children: ReactNode }) {
  return <NotesProvider>{children}</NotesProvider>
}

async function renderNotes() {
  const result = renderHook(() => useNotes(), { wrapper })
  // Flush the async init (loadData resolves via microtask), then drain save timers
  await act(async () => {
    await Promise.resolve()
    vi.runAllTimers()
  })
  return result
}

describe('folder CRUD', () => {
  it('addFolder adds a folder to the list', async () => {
    const { result } = await renderNotes()
    act(() => { result.current.addFolder(makeFolder('f1', 'Work')) })
    expect(result.current.folders).toHaveLength(1)
    expect(result.current.folders[0].name).toBe('Work')
    expect(result.current.folders[0].parentId).toBeNull()
  })

  it('addFolder supports nested folders via parentId', async () => {
    const { result } = await renderNotes()
    act(() => {
      result.current.addFolder(makeFolder('parent', 'Parent'))
      result.current.addFolder(makeFolder('child', 'Child', 'parent'))
    })
    expect(result.current.folders).toHaveLength(2)
    expect(result.current.folders.find(f => f.name === 'Child')?.parentId).toBe('parent')
  })

  it('updateFolder renames a folder', async () => {
    const { result } = await renderNotes()
    act(() => { result.current.addFolder(makeFolder('f1', 'Old Name')) })
    act(() => { result.current.updateFolder('f1', { name: 'New Name' }) })
    expect(result.current.folders[0].name).toBe('New Name')
  })

  it('deleteFolder removes the folder', async () => {
    const { result } = await renderNotes()
    act(() => { result.current.addFolder(makeFolder('f1', 'ToDelete')) })
    act(() => { result.current.deleteFolder('f1') })
    expect(result.current.folders).toHaveLength(0)
  })
})

describe('deleteFolder cascade', () => {
  it('deletes child folders when parent is deleted', async () => {
    const { result } = await renderNotes()
    act(() => {
      result.current.addFolder(makeFolder('parent', 'Parent'))
      result.current.addFolder(makeFolder('child', 'Child', 'parent'))
    })
    act(() => { result.current.deleteFolder('parent') })
    expect(result.current.folders).toHaveLength(0)
  })

  it('nullifies folderId on notes in deleted folder', async () => {
    const { result } = await renderNotes()
    const note = makeNote('n1', { folderId: 'f1' })
    act(() => {
      result.current.addFolder(makeFolder('f1', 'Doomed'))
      result.current.addNote(note)
    })
    expect(result.current.notes[0].folderId).toBe('f1')
    act(() => { result.current.deleteFolder('f1') })
    expect(result.current.notes[0].folderId).toBeNull()
  })

  it('nullifies folderId on notes in deeply nested deleted folders', async () => {
    const { result } = await renderNotes()
    const note = makeNote('n1', { folderId: 'child' })
    act(() => {
      result.current.addFolder(makeFolder('gp', 'Grandparent'))
      result.current.addFolder(makeFolder('parent', 'Parent', 'gp'))
      result.current.addFolder(makeFolder('child', 'Child', 'parent'))
      result.current.addNote(note)
    })
    act(() => { result.current.deleteFolder('gp') })
    expect(result.current.folders).toHaveLength(0)
    expect(result.current.notes[0].folderId).toBeNull()
  })
})

describe('note folderId', () => {
  it('addNote preserves folderId from the note object', async () => {
    const { result } = await renderNotes()
    const note = makeNote('n1', { folderId: 'inbox' })
    act(() => {
      result.current.addFolder(makeFolder('inbox', 'Inbox'))
      result.current.addNote(note)
    })
    expect(result.current.notes[0].folderId).toBe('inbox')
  })

  it('updateNote can change folderId', async () => {
    const { result } = await renderNotes()
    const note = makeNote('n1', { folderId: 'folder-a' })
    act(() => {
      result.current.addFolder(makeFolder('folder-a', 'A'))
      result.current.addFolder(makeFolder('folder-b', 'B'))
      result.current.addNote(note)
    })
    act(() => {
      result.current.updateNote('n1', { folderId: 'folder-b' } as Parameters<typeof result.current.updateNote>[1])
    })
    expect(result.current.notes[0].folderId).toBe('folder-b')
  })

  it('updateNote resets reminderNotified when reminderAt changes', async () => {
    const { result } = await renderNotes()
    const note = {
      ...makeNote('todo-1'),
      type: 'todo' as const,
      reminderAt: '2026-01-01T00:00:00Z',
      reminderNotified: true,
      items: [],
    }
    act(() => { result.current.addNote(note) })
    act(() => {
      result.current.updateNote('todo-1', { reminderAt: '2027-01-01T00:00:00Z' } as Parameters<typeof result.current.updateNote>[1])
    })
    const updated = result.current.notes.find(n => n.id === 'todo-1') as { reminderNotified: boolean }
    expect(updated.reminderNotified).toBe(false)
  })
})
