import { useState, useEffect, useCallback } from 'react'
import { useNotes } from '../../contexts/NotesContext'
import { createDayPlan } from '../../utils/noteFactory'
import './TemplateSelector.css'

const TYPE_ICONS: Record<string, string> = { text: '📝', priorities: '🎯', checklist: '✅', timeblocks: '📅' }

interface TemplateSelectorProps {
  onClose: () => void
}

export function TemplateSelector({ onClose }: TemplateSelectorProps) {
  const { templates, addNote } = useNotes()
  const [selected, setSelected] = useState<string | null>(templates[0]?.id ?? null)
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])

  const handleCreate = useCallback(() => {
    const template = templates.find(t => t.id === selected)
    if (!template) return
    addNote(createDayPlan(template, date))
    onClose()
  }, [selected, date, templates, addNote, onClose])

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose()
    if (e.key === 'Enter') handleCreate()
  }, [onClose, handleCreate])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="ts-modal" role="dialog" aria-modal="true">
        <div className="ts-modal__header">
          <div>
            <h2 className="ts-modal__title">📅 New Day Plan</h2>
            <p className="ts-modal__subtitle">Choose a template to structure your day</p>
          </div>
          <button className="modal__close" onClick={onClose}>✕</button>
        </div>

        <div className="ts-modal__date-row">
          <label className="ts-date-label">Date</label>
          <input
            type="date"
            className="ts-date-input"
            value={date}
            onChange={e => setDate(e.target.value)}
          />
        </div>

        <div className="ts-modal__body">
          <div className="ts-grid">
            {templates.map(t => (
              <button
                key={t.id}
                className={`ts-card ${selected === t.id ? 'ts-card--selected' : ''}`}
                onClick={() => setSelected(t.id)}
                style={{ '--card-accent': t.color || 'var(--accent)' } as React.CSSProperties}
              >
                <div className="ts-card__accent" />
                <div className="ts-card__body">
                  <div className="ts-card__name">
                    {t.name}
                    {t.isBuiltIn && <span className="ts-card__builtin">Built-in</span>}
                  </div>
                  <p className="ts-card__desc">{t.description}</p>
                  <div className="ts-card__sections">
                    {t.sections.map(s => (
                      <span key={s.key} className="ts-card__section-pill" title={s.label}>
                        {TYPE_ICONS[s.type] ?? '📄'} {s.label.replace(/^[\p{Emoji}\s]+/u, '').trim()}
                      </span>
                    ))}
                  </div>
                </div>
                {selected === t.id && <span className="ts-card__check">✓</span>}
              </button>
            ))}
          </div>
        </div>

        <div className="ts-modal__footer">
          <button className="btn btn--ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn--primary" onClick={handleCreate} disabled={!selected}>
            Create Day Plan
          </button>
        </div>
      </div>
    </div>
  )
}
