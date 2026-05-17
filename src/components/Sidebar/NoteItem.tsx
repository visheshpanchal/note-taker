import { useState } from 'react'
import { useNotes } from '../../contexts/NotesContext'
import { getCategoryById } from '../../utils/categories'
import type { AnyNote, DayPlan } from '../../types'
import './NoteItem.css'

function relativeDate(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'just now'
  if (min < 60) return `${min}m`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h`
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function dayPlanProgress(note: DayPlan): { done: number; total: number } {
  let total = 0, done = 0
  for (const s of note.sections ?? []) {
    if (['priorities', 'checklist', 'timeblocks'].includes(s.type)) {
      for (const item of (s as { items?: Array<{ done: boolean }> }).items ?? []) {
        total++
        if (item.done) done++
      }
    }
  }
  return { done, total }
}

const TYPE_ICON: Record<string, string> = { note: '📄', todo: '✅', dayplan: '📅', diagram: '🎨' }

interface NoteItemProps {
  note: AnyNote
  active: boolean
  onClick: () => void
  onDelete: () => void
}

export function NoteItem({ note, active, onClick, onDelete }: NoteItemProps) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const { categories } = useNotes()

  const icon     = TYPE_ICON[note.type] ?? '📄'
  const category = getCategoryById(note.category, categories)
  const accent   = note.color ?? category?.color ?? null

  const todoDone  = note.type === 'todo' ? (note.items?.filter(i => i.checked).length ?? 0) : null
  const todoTotal = note.type === 'todo' ? (note.items?.length ?? 0) : null

  const dpProgress = note.type === 'dayplan' ? dayPlanProgress(note) : null
  const isToday    = note.type === 'dayplan' && note.date === new Date().toISOString().split('T')[0]

  const isOverdue = note.dueDate && new Date(note.dueDate) < new Date()

  function handleDelete(e: React.MouseEvent) {
    e.stopPropagation()
    if (confirmDelete) { onDelete() }
    else { setConfirmDelete(true); setTimeout(() => setConfirmDelete(false), 2000) }
  }

  return (
    <div
      className={`note-item ${active ? 'note-item--active' : ''}`}
      style={accent ? { '--item-accent': accent } as React.CSSProperties : undefined}
      onClick={onClick}
    >
      <div className="note-item__accent-bar" />
      <div className="note-item__body">
        <div className="note-item__top">
          <span className="note-item__icon">{icon}</span>
          <span className="note-item__title">{note.title || 'Untitled'}</span>
          {note.isFavorite && <span className="note-item__star">⭐</span>}
        </div>

        {note.type === 'todo' && todoTotal !== null && todoTotal > 0 && (
          <div className="note-item__progress">
            <div className="note-item__progress-fill" style={{ width: `${((todoDone ?? 0) / todoTotal) * 100}%` }} />
          </div>
        )}
        {note.type === 'dayplan' && dpProgress !== null && dpProgress.total > 0 && (
          <div className="note-item__progress">
            <div className="note-item__progress-fill" style={{ width: `${(dpProgress.done / dpProgress.total) * 100}%` }} />
          </div>
        )}

        <div className="note-item__meta">
          {category && (
            <span className="note-item__cat" style={{ '--cat': category.color } as React.CSSProperties}>
              {category.icon} {category.label}
            </span>
          )}

          <span className="note-item__date">
            {isToday && <span className="note-item__today">Today · </span>}
            {note.type !== 'dayplan' && relativeDate(note.updatedAt)}
            {note.type === 'todo' && todoTotal !== null && todoTotal > 0 && ` · ${todoDone}/${todoTotal}`}
            {note.type === 'dayplan' && dpProgress !== null && dpProgress.total > 0 && `${dpProgress.done}/${dpProgress.total} done`}
          </span>

          {isOverdue && <span className="note-item__overdue">⚠ Overdue</span>}
        </div>
      </div>

      <button
        className={`note-item__del ${confirmDelete ? 'note-item__del--confirm' : ''}`}
        onClick={handleDelete}
        title={confirmDelete ? 'Confirm delete' : 'Delete'}
      >
        {confirmDelete ? '!' : '×'}
      </button>
    </div>
  )
}
