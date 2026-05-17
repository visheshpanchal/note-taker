import { useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { useNotes } from '../../contexts/NotesContext.jsx'
import './TemplateManager.css'

const TYPE_ICONS = { text: '📝', priorities: '🎯', checklist: '✅', timeblocks: '📅' }

export function TemplateManager() {
  const { templates, addTemplate, updateTemplate, deleteTemplate } = useNotes()
  const [editing, setEditing] = useState(null)   // id being renamed
  const [editName, setEditName] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(null)

  function startRename(t) {
    setEditing(t.id)
    setEditName(t.name)
  }

  function commitRename(id) {
    if (editName.trim()) updateTemplate(id, { name: editName.trim() })
    setEditing(null)
  }

  function duplicate(t) {
    addTemplate({
      ...t,
      id: uuidv4(),
      name: `${t.name} (copy)`,
      isBuiltIn: false,
      sections: t.sections.map(s => ({ ...s }))
    })
  }

  function handleDelete(id) {
    if (confirmDelete === id) {
      deleteTemplate(id)
      setConfirmDelete(null)
    } else {
      setConfirmDelete(id)
      setTimeout(() => setConfirmDelete(null), 2500)
    }
  }

  return (
    <div className="template-manager">
      {templates.map(t => (
        <div key={t.id} className="tm-card">
          <div className="tm-card__left" style={{ background: t.color || 'var(--accent)' }} />
          <div className="tm-card__body">
            <div className="tm-card__header">
              {editing === t.id ? (
                <input
                  className="tm-name-input"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  onBlur={() => commitRename(t.id)}
                  onKeyDown={e => { if (e.key === 'Enter') commitRename(t.id); if (e.key === 'Escape') setEditing(null) }}
                  autoFocus
                />
              ) : (
                <span className="tm-card__name">{t.name}</span>
              )}
              {t.isBuiltIn && <span className="tm-badge">Built-in</span>}
            </div>

            <p className="tm-card__desc">{t.description}</p>

            <div className="tm-card__sections">
              {t.sections.map(s => (
                <span key={s.key} className="tm-pill" title={s.type}>
                  {TYPE_ICONS[s.type]} {s.label.replace(/^[\p{Emoji}\s]+/u, '').trim()}
                </span>
              ))}
            </div>
          </div>

          <div className="tm-card__actions">
            {!t.isBuiltIn && editing !== t.id && (
              <button className="tm-btn" onClick={() => startRename(t)} title="Rename">✏️</button>
            )}
            <button className="tm-btn" onClick={() => duplicate(t)} title="Duplicate">⎘</button>
            {!t.isBuiltIn && (
              <button
                className={`tm-btn tm-btn--delete ${confirmDelete === t.id ? 'tm-btn--confirm' : ''}`}
                onClick={() => handleDelete(t.id)}
                title={confirmDelete === t.id ? 'Click again to confirm' : 'Delete'}
              >
                {confirmDelete === t.id ? '!' : '🗑'}
              </button>
            )}
          </div>
        </div>
      ))}
      {templates.length === 0 && (
        <p className="tm-empty">No templates. Duplicating a built-in template creates a custom one.</p>
      )}
    </div>
  )
}
