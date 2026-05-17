import { useState, useRef, useEffect } from 'react'
import { useNotes } from '../../contexts/NotesContext'
import { createFolder } from '../../utils/noteFactory'
import type { Folder } from '../../types'

interface FolderNodeProps {
  folder: Folder
  depth: number
  selectedId: string | null
  onSelect: (id: string | null) => void
}

function FolderNode({ folder, depth, selectedId, onSelect }: FolderNodeProps) {
  const { folders, addFolder, updateFolder, deleteFolder } = useNotes()
  const [expanded, setExpanded] = useState(true)
  const [renaming, setRenaming] = useState(false)
  const [renameName, setRenameName] = useState(folder.name)
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const renameRef = useRef<HTMLInputElement>(null)
  const createRef = useRef<HTMLInputElement>(null)

  const children = folders.filter(f => f.parentId === folder.id)
  const isSelected = selectedId === folder.id

  useEffect(() => { if (renaming) renameRef.current?.focus() }, [renaming])
  useEffect(() => { if (creating) createRef.current?.focus() }, [creating])

  function commitRename() {
    const name = renameName.trim()
    if (name && name !== folder.name) updateFolder(folder.id, { name })
    setRenaming(false)
  }

  function commitCreate() {
    const name = newName.trim()
    if (name) addFolder(createFolder(name, folder.id))
    setNewName('')
    setCreating(false)
    setExpanded(true)
  }

  function handleRowClick(e: React.MouseEvent) {
    if (renaming) return
    e.stopPropagation()
    onSelect(isSelected ? null : folder.id)
  }

  return (
    <div className="folder-node">
      <div
        className={`folder-row ${isSelected ? 'folder-row--active' : ''}`}
        style={{ paddingLeft: `${depth * 14 + 4}px` }}
      >
        <button
          className="folder-row__toggle"
          onClick={e => { e.stopPropagation(); setExpanded(v => !v) }}
          tabIndex={-1}
        >
          {children.length > 0 ? (expanded ? '▾' : '▸') : ''}
        </button>
        <span className="folder-row__icon">{isSelected ? '📂' : '📁'}</span>

        {renaming ? (
          <input
            ref={renameRef}
            className="folder-row__name-input"
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
          <button className="folder-row__name" onClick={handleRowClick} onDoubleClick={e => { e.stopPropagation(); setRenameName(folder.name); setRenaming(true) }}>
            {folder.name}
          </button>
        )}

        <div className="folder-row__actions">
          <button
            className="folder-row__btn"
            title="Add subfolder"
            onClick={e => { e.stopPropagation(); setCreating(v => !v); setExpanded(true) }}
          >+</button>
          <button
            className="folder-row__btn"
            title="Rename"
            onClick={e => { e.stopPropagation(); setRenameName(folder.name); setRenaming(true) }}
          >✎</button>
          <button
            className="folder-row__btn folder-row__btn--del"
            title="Delete folder"
            onClick={e => {
              e.stopPropagation()
              deleteFolder(folder.id)
              if (isSelected) onSelect(null)
            }}
          >×</button>
        </div>
      </div>

      {creating && (
        <div className="folder-inline-form" style={{ paddingLeft: `${(depth + 1) * 14 + 20}px` }}>
          <input
            ref={createRef}
            className="folder-inline-input"
            placeholder="Subfolder name…"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') commitCreate()
              if (e.key === 'Escape') { setNewName(''); setCreating(false) }
            }}
            onBlur={() => { if (!newName.trim()) setCreating(false) }}
          />
        </div>
      )}

      {expanded && children.length > 0 && (
        <div className="folder-children">
          {children.map(child => (
            <FolderNode
              key={child.id}
              folder={child}
              depth={depth + 1}
              selectedId={selectedId}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  )
}

interface FolderTreeProps {
  selectedId: string | null
  onSelect: (id: string | null) => void
}

export function FolderTree({ selectedId, onSelect }: FolderTreeProps) {
  const { folders, addFolder } = useNotes()
  const [expanded, setExpanded] = useState(true)
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { if (creating) inputRef.current?.focus() }, [creating])

  const rootFolders = folders.filter(f => f.parentId === null)

  function commitCreate() {
    const name = newName.trim()
    if (name) addFolder(createFolder(name, null))
    setNewName('')
    setCreating(false)
  }

  return (
    <div className="folder-section">
      <button className="folder-section__header" onClick={() => setExpanded(v => !v)}>
        <span style={{ marginRight: 'auto' }}>Folders</span>
        <span className="folder-section__arrow">{expanded ? '▾' : '▸'}</span>
        <button
          className="folder-section__add"
          title="New root folder"
          onClick={e => { e.stopPropagation(); setCreating(v => !v); setExpanded(true) }}
        >+</button>
      </button>

      {expanded && (
        <div className="folder-tree">
          <button
            className={`folder-all-btn ${!selectedId ? 'folder-all-btn--active' : ''}`}
            onClick={() => onSelect(null)}
          >
            <span>🗂</span>
            <span>All Notes</span>
          </button>

          {creating && (
            <div className="folder-inline-form">
              <input
                ref={inputRef}
                className="folder-inline-input"
                placeholder="Folder name…"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') commitCreate()
                  if (e.key === 'Escape') { setNewName(''); setCreating(false) }
                }}
                onBlur={() => { if (!newName.trim()) setCreating(false) }}
              />
            </div>
          )}

          {rootFolders.map(f => (
            <FolderNode
              key={f.id}
              folder={f}
              depth={0}
              selectedId={selectedId}
              onSelect={onSelect}
            />
          ))}

          {rootFolders.length === 0 && !creating && (
            <div className="folder-empty">No folders yet</div>
          )}
        </div>
      )}
    </div>
  )
}
