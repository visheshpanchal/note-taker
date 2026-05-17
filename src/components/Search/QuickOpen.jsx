import { useState, useEffect, useRef } from 'react'
import { useNotes } from '../../contexts/NotesContext.jsx'
import { TagPill } from '../Tags/TagPill.jsx'
import './QuickOpen.css'

const TYPE_ICON = { note: '📄', todo: '✅', dayplan: '📅' }

function relDate(iso) {
  const diff = Date.now() - new Date(iso)
  const d = Math.floor(diff / 86400000)
  if (d === 0) return 'Today'
  if (d === 1) return 'Yesterday'
  return `${d}d ago`
}

export function QuickOpen({ onClose }) {
  const { notes, setActiveId, tags: allTags } = useNotes()
  const [query, setQuery] = useState('')
  const [cursor, setCursor] = useState(0)
  const inputRef = useRef(null)
  const listRef = useRef(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  const results = query.trim()
    ? notes.filter(n =>
        n.title.toLowerCase().includes(query.toLowerCase()) ||
        n.content?.toLowerCase().includes(query.toLowerCase())
      )
    : [...notes].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)).slice(0, 10)

  useEffect(() => { setCursor(0) }, [query])

  useEffect(() => {
    listRef.current?.children[cursor]?.scrollIntoView({ block: 'nearest' })
  }, [cursor])

  function open(note) {
    setActiveId(note.id)
    onClose()
  }

  function handleKey(e) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setCursor(c => Math.min(c + 1, results.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setCursor(c => Math.max(c - 1, 0)) }
    else if (e.key === 'Enter') { if (results[cursor]) open(results[cursor]) }
    else if (e.key === 'Escape') onClose()
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="quick-open" role="dialog">
        <div className="quick-open__search">
          <span className="quick-open__icon">⌘K</span>
          <input
            ref={inputRef}
            className="quick-open__input"
            placeholder="Search notes, todos, day plans…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKey}
          />
          {query && <button className="quick-open__clear" onClick={() => setQuery('')}>✕</button>}
        </div>

        {results.length > 0 ? (
          <div className="quick-open__list" ref={listRef}>
            {!query && <div className="quick-open__section-label">Recent</div>}
            {results.map((note, i) => {
              const noteTags = (note.tagIds ?? [])
                .map(id => allTags.find(t => t.id === id)).filter(Boolean)
              const isOverdue = note.dueDate && new Date(note.dueDate) < new Date() && !['completed'].includes(note.status)
              return (
                <button
                  key={note.id}
                  className={`quick-result ${i === cursor ? 'quick-result--active' : ''}`}
                  onMouseEnter={() => setCursor(i)}
                  onClick={() => open(note)}
                >
                  <span className="quick-result__icon">{TYPE_ICON[note.type]}</span>
                  <div className="quick-result__body">
                    <div className="quick-result__title">
                      {note.isFavorite && <span>⭐ </span>}
                      {note.color && <span className="quick-result__color" style={{ background: note.color }} />}
                      {note.title || 'Untitled'}
                    </div>
                    <div className="quick-result__meta">
                      <span>{relDate(note.updatedAt)}</span>
                      {isOverdue && <span className="quick-result__overdue">Overdue</span>}
                      {noteTags.slice(0, 3).map(t => <TagPill key={t.id} tag={t} small />)}
                    </div>
                  </div>
                  <span className="quick-result__shortcut">↵</span>
                </button>
              )
            })}
          </div>
        ) : (
          <div className="quick-open__empty">No results for "{query}"</div>
        )}

        <div className="quick-open__footer">
          <span>↑↓ navigate</span>
          <span>↵ open</span>
          <span>Esc close</span>
        </div>
      </div>
    </div>
  )
}
