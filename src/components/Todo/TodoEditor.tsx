import { useNotes } from '../../contexts/NotesContext'
import { createTodoItem } from '../../utils/noteFactory'
import { getCategoryById } from '../../utils/categories'
import { formatLocation } from '../../utils/location'
import { ReminderPicker } from '../shared/ReminderPicker'
import { AttachmentList } from '../shared/AttachmentList'
import { TodoItem } from './TodoItem'
import type { Todo, TodoItem as TodoItemType } from '../../types'
import './TodoEditor.css'

interface TodoEditorProps {
  note: Todo
}

export function TodoEditor({ note }: TodoEditorProps) {
  const { updateNote, categories } = useNotes()
  const items    = note.items ?? []
  const done     = items.filter(i => i.checked).length
  const category = getCategoryById(note.category, categories)

  function addItem() {
    updateNote(note.id, { items: [...items, createTodoItem()] })
  }

  function updateItem(id: string, updated: TodoItemType) {
    updateNote(note.id, { items: items.map(i => i.id === id ? updated : i) })
  }

  function deleteItem(id: string) {
    updateNote(note.id, { items: items.filter(i => i.id !== id) })
  }

  const location = formatLocation(note.locationTag)
  const created  = new Date(note.createdAt).toLocaleDateString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric'
  })

  return (
    <div className="todo-editor">
      <div className="todo-editor__header">
        {category && <div className="todo-editor__color-strip" style={{ background: category.color }} />}
        <div className="todo-editor__header-inner">
          <input
            className="todo-editor__title"
            value={note.title}
            onChange={e => updateNote(note.id, { title: e.target.value })}
            placeholder="Title"
          />
          <div className="todo-editor__stats">
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
            {items.length > 0 && (
              <>
                <div className="todo-editor__progress-track">
                  <div
                    className="todo-editor__progress-fill"
                    style={{ width: `${(done / items.length) * 100}%` }}
                  />
                </div>
                <span>{done} / {items.length} completed</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="todo-editor__list">
        {items.length === 0 && (
          <div className="todo-editor__empty">No items yet. Add one below.</div>
        )}
        {items.map(item => (
          <TodoItem
            key={item.id}
            item={item}
            onChange={updated => updateItem(item.id, updated)}
            onDelete={() => deleteItem(item.id)}
          />
        ))}
      </div>

      <div className="todo-editor__add">
        <button className="todo-editor__add-btn" onClick={addItem}>
          <span>+</span> Add item
        </button>
      </div>

      <div className="todo-editor__footer">
        <ReminderPicker
          reminderAt={note.reminderAt}
          reminderNotified={note.reminderNotified}
          onChange={val => updateNote(note.id, { reminderAt: val })}
        />
        {location && <span>📍 {location}</span>}
        <span>Created {created}</span>
      </div>

      <div className="todo-editor__attachments">
        <AttachmentList note={note} updateNote={updateNote} />
      </div>
    </div>
  )
}
