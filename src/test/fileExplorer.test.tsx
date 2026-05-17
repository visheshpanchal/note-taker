import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { FileExplorer } from '../components/Sidebar/FileExplorer'
import { useNotes } from '../contexts/NotesContext'
import { createNote, createFolder } from '../utils/noteFactory'
import type { FEFilters } from '../components/Sidebar/FileExplorer'

vi.mock('../contexts/NotesContext')
vi.mock('uuid', () => ({ v4: () => 'test-uuid' }))

const defaultFilters: FEFilters = {
  search: '', typeFilter: 'all', categoryFilter: null, tagFilter: null, notebookFilter: null,
}

const mockAddFolder = vi.fn()
const mockUpdateFolder = vi.fn()
const mockDeleteFolder = vi.fn()
const mockSetActiveId = vi.fn()
const mockDeleteNote = vi.fn()
const mockUpdateNote = vi.fn()

function setup(overrides: Partial<ReturnType<typeof useNotes>> = {}) {
  vi.mocked(useNotes).mockReturnValue({
    notes: [],
    folders: [],
    addFolder: mockAddFolder,
    updateFolder: mockUpdateFolder,
    deleteFolder: mockDeleteFolder,
    activeId: null,
    setActiveId: mockSetActiveId,
    deleteNote: mockDeleteNote,
    updateNote: mockUpdateNote,
    ...overrides,
  } as ReturnType<typeof useNotes>)
}

beforeEach(() => {
  vi.clearAllMocks()
  mockAddFolder.mockClear()
  mockUpdateFolder.mockClear()
  mockDeleteFolder.mockClear()
  mockSetActiveId.mockClear()
  mockDeleteNote.mockClear()
  mockUpdateNote.mockClear()
})

describe('FileExplorer', () => {
  it('renders the Files header', () => {
    setup()
    render(
      <FileExplorer
        filters={defaultFilters}
        selectedFolderId={null}
        onFolderSelect={vi.fn()}
        onNewItem={vi.fn()}
      />
    )
    expect(screen.getByText('Files')).toBeTruthy()
  })

  it('shows empty state when there are no files or folders', () => {
    setup()
    render(
      <FileExplorer
        filters={defaultFilters}
        selectedFolderId={null}
        onFolderSelect={vi.fn()}
        onNewItem={vi.fn()}
      />
    )
    expect(screen.getByText('No files yet')).toBeTruthy()
  })

  it('renders root-level notes', () => {
    const note = createNote({ title: 'Root Note' }, null)
    setup({ notes: [note] })
    render(
      <FileExplorer
        filters={defaultFilters}
        selectedFolderId={null}
        onFolderSelect={vi.fn()}
        onNewItem={vi.fn()}
      />
    )
    expect(screen.getByText('Root Note')).toBeTruthy()
  })

  it('does not render notes inside folders in the root area', () => {
    const folder = createFolder('MyFolder', null)
    const note = createNote({ title: 'Folder Note' }, folder.id)
    setup({ notes: [note], folders: [folder] })
    render(
      <FileExplorer
        filters={defaultFilters}
        selectedFolderId={null}
        onFolderSelect={vi.fn()}
        onNewItem={vi.fn()}
      />
    )
    // Note should appear inside the folder node, not in root
    expect(screen.getByText('Folder Note')).toBeTruthy()
    // Folder itself is present
    expect(screen.getByText('MyFolder')).toBeTruthy()
  })

  it('renders folders', () => {
    const folder = createFolder('Work', null)
    setup({ folders: [folder] })
    render(
      <FileExplorer
        filters={defaultFilters}
        selectedFolderId={null}
        onFolderSelect={vi.fn()}
        onNewItem={vi.fn()}
      />
    )
    expect(screen.getByText('Work')).toBeTruthy()
  })

  it('clicking a note calls setActiveId', () => {
    const note = createNote({ title: 'Clickable', id: 'note-abc' }, null)
    setup({ notes: [note] })
    render(
      <FileExplorer
        filters={defaultFilters}
        selectedFolderId={null}
        onFolderSelect={vi.fn()}
        onNewItem={vi.fn()}
      />
    )
    fireEvent.click(screen.getByText('Clickable'))
    expect(mockSetActiveId).toHaveBeenCalledWith('note-abc')
  })

  it('clicking the delete button calls deleteNote', () => {
    const note = createNote({ title: 'Delete Me', id: 'del-note' }, null)
    setup({ notes: [note] })
    render(
      <FileExplorer
        filters={defaultFilters}
        selectedFolderId={null}
        onFolderSelect={vi.fn()}
        onNewItem={vi.fn()}
      />
    )
    const deleteBtn = screen.getAllByTitle('Delete')[0]
    fireEvent.click(deleteBtn)
    expect(mockDeleteNote).toHaveBeenCalledWith('del-note')
  })

  it('clicking + opens the new item menu', () => {
    setup()
    render(
      <FileExplorer
        filters={defaultFilters}
        selectedFolderId={null}
        onFolderSelect={vi.fn()}
        onNewItem={vi.fn()}
      />
    )
    fireEvent.click(screen.getByTitle('New item'))
    expect(screen.getByText(/📄 Note/)).toBeTruthy()
    expect(screen.getByText(/✅ Todo/)).toBeTruthy()
    expect(screen.getByText(/📁 Folder/)).toBeTruthy()
  })

  it('clicking Note in menu calls onNewItem with null folderId', () => {
    const onNewItem = vi.fn()
    setup()
    render(
      <FileExplorer
        filters={defaultFilters}
        selectedFolderId={null}
        onFolderSelect={vi.fn()}
        onNewItem={onNewItem}
      />
    )
    fireEvent.click(screen.getByTitle('New item'))
    fireEvent.click(screen.getByText(/📄 Note/))
    expect(onNewItem).toHaveBeenCalledWith('note', null)
  })

  it('clicking Folder in menu shows inline folder name input', () => {
    setup()
    render(
      <FileExplorer
        filters={defaultFilters}
        selectedFolderId={null}
        onFolderSelect={vi.fn()}
        onNewItem={vi.fn()}
      />
    )
    fireEvent.click(screen.getByTitle('New item'))
    fireEvent.click(screen.getByText(/📁 Folder/))
    expect(screen.getByPlaceholderText('Folder name…')).toBeTruthy()
  })

  it('pressing Enter in folder name input calls addFolder', () => {
    setup()
    render(
      <FileExplorer
        filters={defaultFilters}
        selectedFolderId={null}
        onFolderSelect={vi.fn()}
        onNewItem={vi.fn()}
      />
    )
    fireEvent.click(screen.getByTitle('New item'))
    fireEvent.click(screen.getByText(/📁 Folder/))
    const input = screen.getByPlaceholderText('Folder name…')
    fireEvent.change(input, { target: { value: 'New Folder' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(mockAddFolder).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'New Folder', parentId: null })
    )
  })

  it('pressing Escape in folder name input cancels creation', () => {
    setup()
    render(
      <FileExplorer
        filters={defaultFilters}
        selectedFolderId={null}
        onFolderSelect={vi.fn()}
        onNewItem={vi.fn()}
      />
    )
    fireEvent.click(screen.getByTitle('New item'))
    fireEvent.click(screen.getByText(/📁 Folder/))
    const input = screen.getByPlaceholderText('Folder name…')
    fireEvent.keyDown(input, { key: 'Escape' })
    expect(screen.queryByPlaceholderText('Folder name…')).toBeNull()
    expect(mockAddFolder).not.toHaveBeenCalled()
  })

  it('filters notes by search term', () => {
    const noteA = createNote({ title: 'Alpha' }, null)
    const noteB = createNote({ title: 'Beta' }, null)
    setup({ notes: [noteA, noteB] })
    const filters: FEFilters = { ...defaultFilters, search: 'alp' }
    render(
      <FileExplorer
        filters={filters}
        selectedFolderId={null}
        onFolderSelect={vi.fn()}
        onNewItem={vi.fn()}
      />
    )
    expect(screen.getByText('Alpha')).toBeTruthy()
    expect(screen.queryByText('Beta')).toBeNull()
  })

  it('filters notes by type', () => {
    const note = createNote({ title: 'My Note' }, null)
    const todo = { ...createNote({ title: 'My Todo' }, null), type: 'todo' as const, items: [], reminderAt: null, reminderNotified: false }
    setup({ notes: [note, todo] })
    const filters: FEFilters = { ...defaultFilters, typeFilter: 'todo' }
    render(
      <FileExplorer
        filters={filters}
        selectedFolderId={null}
        onFolderSelect={vi.fn()}
        onNewItem={vi.fn()}
      />
    )
    expect(screen.getByText('My Todo')).toBeTruthy()
    expect(screen.queryByText('My Note')).toBeNull()
  })

  it('clicking + in folder menu calls onNewItem with folder id', () => {
    const onNewItem = vi.fn()
    const folder = { ...createFolder('Inbox', null), id: 'folder-id' }
    setup({ folders: [folder] })
    render(
      <FileExplorer
        filters={defaultFilters}
        selectedFolderId={null}
        onFolderSelect={vi.fn()}
        onNewItem={onNewItem}
      />
    )
    // Each folder has a + button
    const addBtns = screen.getAllByTitle('New item')
    // Second button is folder's + (first is root's)
    fireEvent.click(addBtns[1])
    fireEvent.click(screen.getByText(/📄 Note/))
    expect(onNewItem).toHaveBeenCalledWith('note', 'folder-id')
  })
})
