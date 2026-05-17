import { useState, useRef, useEffect } from 'react'
import { useNotes } from '../../contexts/NotesContext'
import { createFolder } from '../../utils/noteFactory'
import type { AnyNote, Folder } from '../../types'

export interface FEFilters {
  search: string
  typeFilter: string
  categoryFilter: string | null
  tagFilter: string | null
  notebookFilter: string | null
}

const NOTE_ICONS: Record<string, string> = {
  note: '📄', todo: '✅', dayplan: '📅', diagram: '🎨',
}

// Sentinel used when the root (no-folder) area is the drop target
const ROOT_DROP_ID = '__root__'

function passesFilter(note: AnyNote, f: FEFilters): boolean {
  if (f.search && !note.title.toLowerCase().includes(f.search.toLowerCase())) return false
  if (f.typeFilter === 'favorites') return note.isFavorite
  if (f.typeFilter !== 'all' && note.type !== f.typeFilter) return false
  if (f.categoryFilter && note.category !== f.categoryFilter) return false
  if (f.tagFilter && !(note.tagIds ?? []).includes(f.tagFilter)) return false
  if (f.notebookFilter && note.notebookId !== f.notebookFilter) return false
  return true
}

// ─── Note row ──────────────────────────────────────────────────────────────────

interface NoteRowProps {
  note: AnyNote
  depth: number
  active: boolean
  isDragging: boolean
  onClick: () => void
  onDelete: () => void
  onDragStart: (noteId: string) => void
  onDragEnd: () => void
}

function NoteRow({ note, depth, active, isDragging, onClick, onDelete, onDragStart, onDragEnd }: NoteRowProps) {
  return (
    <div
      className={`fe-note ${active ? 'fe-note--active' : ''} ${isDragging ? 'fe-note--dragging' : ''}`}
      style={{ '--fe-depth': depth } as React.CSSProperties}
      draggable
      onDragStart={e => {
        e.dataTransfer.setData('text/plain', note.id)
        e.dataTransfer.effectAllowed = 'move'
        // Delay so the drag image shows the element before React re-renders it dimmed
        setTimeout(() => onDragStart(note.id), 0)
      }}
      onDragEnd={onDragEnd}
    >
      <span className="fe-note__drag" aria-hidden>⠿</span>
      <span className="fe-note__icon">{NOTE_ICONS[note.type] ?? '📄'}</span>
      <button className="fe-note__name" onClick={onClick}>
        {note.title || 'Untitled'}
      </button>
      <button
        className="fe-note__del"
        title="Delete"
        onClick={e => { e.stopPropagation(); onDelete() }}
      >×</button>
    </div>
  )
}

// ─── Folder node ──────────────────────────────────────────────────────────────

interface FolderNodeProps {
  folder: Folder
  depth: number
  allFolders: Folder[]
  allNotes: AnyNote[]
  filters: FEFilters
  activeId: string | null
  selectedFolderId: string | null
  draggingNoteId: string | null
  dropTargetId: string | null
  onFolderSelect: (id: string | null) => void
  onNoteClick: (id: string) => void
  onDeleteNote: (id: string) => void
  onNewItem: (type: string, folderId: string) => void
  onNoteDragStart: (noteId: string) => void
  onNoteDragEnd: () => void
  onSetDropTarget: (targetId: string) => void
  onDrop: (noteId: string, folderId: string | null) => void
}

function FolderNode({
  folder, depth, allFolders, allNotes, filters,
  activeId, selectedFolderId, draggingNoteId, dropTargetId,
  onFolderSelect, onNoteClick, onDeleteNote, onNewItem,
  onNoteDragStart, onNoteDragEnd, onSetDropTarget, onDrop,
}: FolderNodeProps) {
  const { addFolder, updateFolder, deleteFolder } = useNotes()
  const [expanded, setExpanded] = useState(true)
  const [renaming, setRenaming] = useState(false)
  const [renameName, setRenameName] = useState(folder.name)
  const [creatingFolder, setCreatingFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [showMenu, setShowMenu] = useState(false)
  const renameRef = useRef<HTMLInputElement>(null)
  const newFolderRef = useRef<HTMLInputElement>(null)

  useEffect(() => { if (renaming) renameRef.current?.focus() }, [renaming])
  useEffect(() => { if (creatingFolder) newFolderRef.current?.focus() }, [creatingFolder])

  const childFolders = allFolders.filter(f => f.parentId === folder.id)
  const folderNotes = allNotes.filter(n => n.folderId === folder.id && passesFilter(n, filters))
  const isSelected = selectedFolderId === folder.id
  const isDropTarget = dropTargetId === folder.id && draggingNoteId !== null
  const hasChildren = childFolders.length > 0 || folderNotes.length > 0

  function commitRename() {
    const name = renameName.trim()
    if (name && name !== folder.name) updateFolder(folder.id, { name })
    setRenaming(false)
  }

  function commitNewFolder() {
    const name = newFolderName.trim()
    if (name) { addFolder(createFolder(name, folder.id)); setExpanded(true) }
    setNewFolderName('')
    setCreatingFolder(false)
  }

  function handleDragEnter(e: React.DragEvent) {
    if (!draggingNoteId) return
    e.preventDefault()
    e.stopPropagation()
    onSetDropTarget(folder.id)
    if (!expanded) setExpanded(true)  // auto-expand on hover
  }

  function handleDragOver(e: React.DragEvent) {
    if (!draggingNoteId) return
    e.preventDefault()
    e.stopPropagation()
    e.dataTransfer.dropEffect = 'move'
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    const noteId = e.dataTransfer.getData('text/plain')
    if (noteId) onDrop(noteId, folder.id)
  }

  const sharedChildProps = {
    allFolders, allNotes, filters, activeId, selectedFolderId,
    draggingNoteId, dropTargetId,
    onFolderSelect, onNoteClick, onDeleteNote, onNewItem,
    onNoteDragStart, onNoteDragEnd, onSetDropTarget, onDrop,
  }

  return (
    <div className="fe-folder" style={{ '--fe-depth': depth } as React.CSSProperties}>
      <div
        className={`fe-folder__row ${isSelected ? 'fe-folder__row--selected' : ''} ${isDropTarget ? 'fe-folder__row--drop-target' : ''}`}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <button
          className="fe-folder__toggle"
          onClick={e => { e.stopPropagation(); setExpanded(v => !v) }}
          tabIndex={-1}
        >
          {hasChildren ? (expanded ? '▾' : '▸') : ''}
        </button>

        <span
          className="fe-folder__icon"
          onClick={() => { onFolderSelect(isSelected ? null : folder.id); setExpanded(true) }}
        >
          {isDropTarget || isSelected ? '📂' : '📁'}
        </span>

        {renaming ? (
          <input
            ref={renameRef}
            className="fe-folder__input"
            value={renameName}
            onChange={e => setRenameName(e.target.value)}
            onBlur={commitRename}
            onKeyDown={e => {
              if (e.key === 'Enter') commitRename()
              if (e.key === 'Escape') { setRenameName(folder.name); setRenaming(false) }
            }}
            onClick={e => e.stopPropagation()}
          />
        ) : (
          <button
            className="fe-folder__name"
            onClick={() => { onFolderSelect(isSelected ? null : folder.id); setExpanded(true) }}
            onDoubleClick={e => { e.stopPropagation(); setRenaming(true) }}
          >
            {folder.name}
          </button>
        )}

        <div className="fe-folder__actions">
          <div className="fe-menu-wrap">
            <button
              className="fe-folder__btn"
              title="New item"
              onClick={e => { e.stopPropagation(); setShowMenu(v => !v) }}
            >+</button>
            {showMenu && (
              <div className="fe-menu" onMouseLeave={() => setShowMenu(false)}>
                <button onClick={e => { e.stopPropagation(); onNewItem('note', folder.id); setShowMenu(false) }}>📄 Note</button>
                <button onClick={e => { e.stopPropagation(); onNewItem('todo', folder.id); setShowMenu(false) }}>✅ Todo</button>
                <button onClick={e => { e.stopPropagation(); onNewItem('dayplan', folder.id); setShowMenu(false) }}>📅 Day Plan</button>
                <button onClick={e => { e.stopPropagation(); onNewItem('diagram', folder.id); setShowMenu(false) }}>🎨 Diagram</button>
                <hr className="fe-menu__hr" />
                <button onClick={e => {
                  e.stopPropagation()
                  setCreatingFolder(true)
                  setExpanded(true)
                  setShowMenu(false)
                }}>📁 Subfolder</button>
              </div>
            )}
          </div>
          <button className="fe-folder__btn" title="Rename" onClick={e => { e.stopPropagation(); setRenaming(true) }}>✎</button>
          <button
            className="fe-folder__btn fe-folder__btn--del"
            title="Delete folder"
            onClick={e => {
              e.stopPropagation()
              deleteFolder(folder.id)
              if (isSelected) onFolderSelect(null)
            }}
          >×</button>
        </div>
      </div>

      {expanded && (
        <div className="fe-folder__body">
          {creatingFolder && (
            <div className="fe-inline-form" style={{ paddingLeft: `${(depth + 1) * 16 + 28}px` }}>
              <input
                ref={newFolderRef}
                className="fe-inline-input"
                placeholder="Folder name…"
                value={newFolderName}
                onChange={e => setNewFolderName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') commitNewFolder()
                  if (e.key === 'Escape') { setNewFolderName(''); setCreatingFolder(false) }
                }}
                onBlur={() => { if (!newFolderName.trim()) setCreatingFolder(false) }}
              />
            </div>
          )}

          {childFolders.map(child => (
            <FolderNode
              key={child.id}
              folder={child}
              depth={depth + 1}
              {...sharedChildProps}
            />
          ))}

          {folderNotes.map(n => (
            <NoteRow
              key={n.id}
              note={n}
              depth={depth + 1}
              active={n.id === activeId}
              isDragging={n.id === draggingNoteId}
              onClick={() => onNoteClick(n.id)}
              onDelete={() => onDeleteNote(n.id)}
              onDragStart={onNoteDragStart}
              onDragEnd={onNoteDragEnd}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── FileExplorer root ────────────────────────────────────────────────────────

export interface FileExplorerProps {
  filters: FEFilters
  selectedFolderId: string | null
  onFolderSelect: (id: string | null) => void
  onNewItem: (type: string, folderId: string | null) => void
}

export function FileExplorer({ filters, selectedFolderId, onFolderSelect, onNewItem }: FileExplorerProps) {
  const { notes, folders, addFolder, activeId, setActiveId, deleteNote, updateNote } = useNotes()
  const [creatingRoot, setCreatingRoot] = useState(false)
  const [rootName, setRootName] = useState('')
  const [showRootMenu, setShowRootMenu] = useState(false)
  const rootRef = useRef<HTMLInputElement>(null)

  const [draggingNoteId, setDraggingNoteId] = useState<string | null>(null)
  const [dropTargetId, setDropTargetId] = useState<string | null>(null)

  useEffect(() => { if (creatingRoot) rootRef.current?.focus() }, [creatingRoot])

  const rootFolders = folders.filter(f => f.parentId === null)
  const rootNotes = notes.filter(n => n.folderId === null && passesFilter(n, filters))

  function commitRoot() {
    const name = rootName.trim()
    if (name) addFolder(createFolder(name, null))
    setRootName('')
    setCreatingRoot(false)
  }

  function handleDrop(noteId: string, targetFolderId: string | null) {
    const note = notes.find(n => n.id === noteId)
    // no-op if already in the target location
    if (!note || note.folderId === targetFolderId) {
      clearDrag()
      return
    }
    updateNote(noteId, { folderId: targetFolderId } as Parameters<typeof updateNote>[1])
    clearDrag()
  }

  function clearDrag() {
    setDraggingNoteId(null)
    setDropTargetId(null)
  }

  const isRootDropTarget = dropTargetId === ROOT_DROP_ID && draggingNoteId !== null

  const sharedFolderProps = {
    allFolders: folders,
    allNotes: notes,
    filters,
    activeId,
    selectedFolderId,
    draggingNoteId,
    dropTargetId,
    onFolderSelect,
    onNoteClick: setActiveId,
    onDeleteNote: deleteNote,
    onNewItem,
    onNoteDragStart: setDraggingNoteId,
    onNoteDragEnd: clearDrag,
    onSetDropTarget: setDropTargetId,
    onDrop: handleDrop,
  }

  return (
    <div className="file-explorer">
      <div className="file-explorer__header">
        <span className="file-explorer__title">Files</span>
        <div className="fe-menu-wrap">
          <button
            className="file-explorer__btn"
            title="New item"
            onClick={() => setShowRootMenu(v => !v)}
          >+</button>
          {showRootMenu && (
            <div className="fe-menu" onMouseLeave={() => setShowRootMenu(false)}>
              <button onClick={() => { onNewItem('note', null);    setShowRootMenu(false) }}>📄 Note</button>
              <button onClick={() => { onNewItem('todo', null);    setShowRootMenu(false) }}>✅ Todo</button>
              <button onClick={() => { onNewItem('dayplan', null); setShowRootMenu(false) }}>📅 Day Plan</button>
              <button onClick={() => { onNewItem('diagram', null); setShowRootMenu(false) }}>🎨 Diagram</button>
              <hr className="fe-menu__hr" />
              <button onClick={() => { setCreatingRoot(true); setShowRootMenu(false) }}>📁 Folder</button>
            </div>
          )}
        </div>
      </div>

      <div
        className={`file-explorer__tree ${isRootDropTarget ? 'file-explorer__tree--drop-target' : ''}`}
        onDragOver={e => {
          if (!draggingNoteId) return
          e.preventDefault()
          e.dataTransfer.dropEffect = 'move'
        }}
        onDragEnter={() => {
          if (draggingNoteId) setDropTargetId(ROOT_DROP_ID)
        }}
        onDragLeave={e => {
          // Only clear when leaving the entire tree panel
          const tree = e.currentTarget as HTMLElement
          if (!tree.contains(e.relatedTarget as Node)) clearDrag()
        }}
        onDrop={e => {
          e.preventDefault()
          const noteId = e.dataTransfer.getData('text/plain')
          if (noteId) handleDrop(noteId, null)
        }}
      >
        {creatingRoot && (
          <div className="fe-inline-form" style={{ paddingLeft: '8px' }}>
            <input
              ref={rootRef}
              className="fe-inline-input"
              placeholder="Folder name…"
              value={rootName}
              onChange={e => setRootName(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') commitRoot()
                if (e.key === 'Escape') { setRootName(''); setCreatingRoot(false) }
              }}
              onBlur={() => { if (!rootName.trim()) setCreatingRoot(false) }}
            />
          </div>
        )}

        {rootFolders.map(f => (
          <FolderNode key={f.id} folder={f} depth={0} {...sharedFolderProps} />
        ))}

        {rootNotes.map(n => (
          <NoteRow
            key={n.id}
            note={n}
            depth={0}
            active={n.id === activeId}
            isDragging={n.id === draggingNoteId}
            onClick={() => setActiveId(n.id)}
            onDelete={() => deleteNote(n.id)}
            onDragStart={setDraggingNoteId}
            onDragEnd={clearDrag}
          />
        ))}

        {rootFolders.length === 0 && rootNotes.length === 0 && !creatingRoot && (
          <div className="file-explorer__empty">No files yet</div>
        )}
      </div>
    </div>
  )
}
