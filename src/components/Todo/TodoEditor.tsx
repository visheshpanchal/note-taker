import { useState, useRef, useEffect } from 'react'
import { useNotes } from '../../contexts/NotesContext'
import { createTodoItem } from '../../utils/noteFactory'
import { getCategoryById } from '../../utils/categories'
import { formatLocation } from '../../utils/location'
import { ReminderPicker } from '../shared/ReminderPicker'
import { AttachmentList } from '../shared/AttachmentList'
import { TodoItem } from './TodoItem'
import { TodoDetailPanel } from './TodoDetailPanel'
import type { Todo, TodoItem as TodoItemType } from '../../types'
import './TodoEditor.css'

type View = 'all' | 'myday' | 'important' | 'planned'

const VIEWS: { id: View; label: string; icon: string }[] = [
  { id: 'all',       label: 'All tasks',  icon: '▤' },
  { id: 'myday',     label: 'My Day',     icon: '☀' },
  { id: 'important', label: 'Important',  icon: '★' },
  { id: 'planned',   label: 'Planned',    icon: '◷' },
]

interface TodoEditorProps {
  note: Todo
}

export function TodoEditor({ note }: TodoEditorProps) {
  const { updateNote, categories } = useNotes()
  const [view, setView]               = useState<View>('all')
  const [addText, setAddText]         = useState('')
  const [selectedId, setSelectedId]   = useState<string | null>(null)
  const addInputRef = useRef<HTMLInputElement>(null)

  const items    = note.items ?? []
  const category = getCategoryById(note.category, categories)

  // Close panel when switching notes
  useEffect(() => { setSelectedId(null) }, [note.id])

  const visibleItems = items.filter(item => {
    if (view === 'myday')     return item.isMyDay
    if (view === 'important') return item.isImportant
    if (view === 'planned')   return !!item.dueDate
    return true
  })

  const total = items.length
  const done  = items.filter(i => i.checked).length
  const pct   = total > 0 ? Math.round((done / total) * 100) : 0

  const selectedItem = selectedId ? items.find(i => i.id === selectedId) ?? null : null

  function commitAdd() {
    const text = addText.trim()
    if (!text) return
    const newItem = createTodoItem({
      text,
      isMyDay:     view === 'myday',
      isImportant: view === 'important',
    })
    updateNote(note.id, { items: [...items, newItem] })
    setAddText('')
    setSelectedId(newItem.id)
  }

  function updateItem(id: string, updated: TodoItemType) {
    updateNote(note.id, { items: items.map(i => i.id === id ? updated : i) })
  }

  function deleteItem(id: string) {
    updateNote(note.id, { items: items.filter(i => i.id !== id) })
    if (selectedId === id) setSelectedId(null)
  }

  const location = formatLocation(note.locationTag)
  const created  = new Date(note.createdAt).toLocaleDateString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric'
  })

  const emptyMessages: Record<View, { heading: string; sub: string }> = {
    all:       { heading: 'Nothing here yet',   sub: 'Type below to add your first task.' },
    myday:     { heading: 'Your day is clear',  sub: 'Press ☀ on any task to focus it here.' },
    important: { heading: 'No starred tasks',   sub: 'Press ★ on any task to mark it important.' },
    planned:   { heading: 'No scheduled tasks', sub: 'Click a task and set a due date.' },
  }

  const accentColor = category?.color ?? 'var(--accent)'

  return (
    <div className="todo-layout">
      {/* ── Left: editor ── */}
      <div className="todo-editor">

        {/* Header */}
        <div
          className="todo-editor__header"
          style={{ '--header-accent': accentColor } as React.CSSProperties}
        >
          <div className="todo-editor__header-inner">
            <div className="todo-editor__title-row">
              <input
                className="todo-editor__title"
                value={note.title}
                onChange={e => updateNote(note.id, { title: e.target.value })}
                placeholder="Untitled list"
              />
              <select
                className={`todo-editor__cat-select ${category ? 'todo-editor__cat-select--set' : ''}`}
                style={category ? { '--cat': category.color } as React.CSSProperties : undefined}
                value={note.category || ''}
                onChange={e => updateNote(note.id, { category: e.target.value || null })}
              >
                <option value="">No category</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.icon} {c.label}</option>
                ))}
              </select>
            </div>

            {total > 0 && (
              <div className="todo-editor__progress-wrap">
                <div className="todo-editor__progress-track">
                  <div
                    className="todo-editor__progress-fill"
                    style={{ width: `${pct}%`, background: accentColor }}
                  />
                </div>
                <span className="todo-editor__progress-label">
                  <strong>{done}</strong> of {total} done
                  {pct === 100 && <span className="todo-editor__progress-complete"> ✓ All done!</span>}
                </span>
              </div>
            )}
          </div>

          {/* View tabs */}
          <nav className="todo-editor__views" role="tablist">
            {VIEWS.map(v => {
              const count = v.id === 'myday'     ? items.filter(i => i.isMyDay).length
                          : v.id === 'important' ? items.filter(i => i.isImportant).length
                          : v.id === 'planned'   ? items.filter(i => !!i.dueDate).length
                          : null
              return (
                <button
                  key={v.id}
                  role="tab"
                  aria-selected={view === v.id}
                  className={`todo-editor__view-tab ${view === v.id ? 'todo-editor__view-tab--active' : ''}`}
                  onClick={() => setView(v.id)}
                  style={view === v.id ? { '--tab-color': accentColor } as React.CSSProperties : undefined}
                >
                  <span className="todo-editor__view-icon">{v.icon}</span>
                  <span className="todo-editor__view-label">{v.label}</span>
                  {count !== null && count > 0 && (
                    <span className="todo-editor__view-badge">{count}</span>
                  )}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Task list */}
        <div className="todo-editor__list">
          {visibleItems.length === 0 ? (
            <div className="todo-editor__empty">
              <div className="todo-editor__empty-icon">
                {view === 'all' ? '☑' : view === 'myday' ? '☀' : view === 'important' ? '★' : '◷'}
              </div>
              <div className="todo-editor__empty-heading">{emptyMessages[view].heading}</div>
              <div className="todo-editor__empty-sub">{emptyMessages[view].sub}</div>
            </div>
          ) : (
            visibleItems.map(item => (
              <TodoItem
                key={item.id}
                item={item}
                isSelected={item.id === selectedId}
                onChange={updated => updateItem(item.id, updated)}
                onDelete={() => deleteItem(item.id)}
                onSelect={() => setSelectedId(prev => prev === item.id ? null : item.id)}
              />
            ))
          )}

          {/* Inline add row */}
          <div
            className={`todo-editor__add-row ${addText ? 'todo-editor__add-row--active' : ''}`}
            onClick={() => addInputRef.current?.focus()}
          >
            <div className="todo-editor__add-icon">+</div>
            <input
              ref={addInputRef}
              className="todo-editor__add-input"
              value={addText}
              onChange={e => setAddText(e.target.value)}
              placeholder={
                view === 'myday'     ? 'Add a task to My Day…' :
                view === 'important' ? 'Add an important task…' :
                view === 'planned'   ? 'Add a planned task…' :
                'Add a task…'
              }
              onKeyDown={e => {
                if (e.key === 'Enter') { e.preventDefault(); commitAdd() }
                if (e.key === 'Escape') { setAddText(''); addInputRef.current?.blur() }
              }}
              onBlur={commitAdd}
            />
            {addText && <kbd className="todo-editor__add-hint">↵ add</kbd>}
          </div>
        </div>

        {/* Footer */}
        <div className="todo-editor__footer">
          <ReminderPicker
            reminderAt={note.reminderAt}
            reminderNotified={note.reminderNotified}
            onChange={val => updateNote(note.id, { reminderAt: val })}
          />
          {location && <span className="todo-editor__footer-meta">📍 {location}</span>}
          <span className="todo-editor__footer-meta">Created {created}</span>
        </div>

        <div className="todo-editor__attachments">
          <AttachmentList note={note} updateNote={updateNote} />
        </div>
      </div>

      {/* ── Right: detail panel ── */}
      {selectedItem && (
        <TodoDetailPanel
          item={selectedItem}
          onChange={updated => updateItem(selectedItem.id, updated)}
          onDelete={() => deleteItem(selectedItem.id)}
          onClose={() => setSelectedId(null)}
        />
      )}
    </div>
  )
}
