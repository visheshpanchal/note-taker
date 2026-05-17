import { useState, ReactNode } from 'react'
import { useNotes } from '../../contexts/NotesContext'
import { useUI } from '../../contexts/UIContext'
import { TagPill } from '../Tags/TagPill'
import { htmlToMarkdown, downloadFile } from '../../utils/export'
import type { Note } from '../../types'
import './PropertiesPanel.css'

const COLORS = [
  null, '#ff3b30', '#ff9500', '#ffcc00', '#34c759',
  '#5ac8fa', '#007aff', '#af52de', '#ff2d55', '#8e8e93'
]

const COLOR_LABELS: Record<string, string> = {
  null: 'None', '#ff3b30': 'Red', '#ff9500': 'Orange', '#ffcc00': 'Yellow',
  '#34c759': 'Green', '#5ac8fa': 'Teal', '#007aff': 'Blue',
  '#af52de': 'Purple', '#ff2d55': 'Pink', '#8e8e93': 'Gray'
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="prop-section">
      <div className="prop-section__title">{title}</div>
      {children}
    </div>
  )
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="prop-row">
      <span className="prop-row__label">{label}</span>
      <div className="prop-row__value">{children}</div>
    </div>
  )
}

interface PropertiesPanelProps {
  note: Note
}

export function PropertiesPanel({ note }: PropertiesPanelProps) {
  const { setShowProperties } = useUI()
  const { updateNote, tags: allTags, notebooks, categories } = useNotes()
  const [showTagPicker, setShowTagPicker] = useState(false)

  const noteTags = (note.tagIds ?? [])
    .map(id => allTags.find(t => t.id === id))
    .filter((t): t is NonNullable<typeof t> => Boolean(t))

  const notebook = notebooks?.find(nb => nb.id === note.notebookId)

  const wordCount = note.content
    ? note.content.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length
    : 0
  const readingTime = Math.max(1, Math.ceil(wordCount / 200))

  function toggleTag(tagId: string) {
    const current = note.tagIds ?? []
    const next = current.includes(tagId)
      ? current.filter(id => id !== tagId)
      : [...current, tagId]
    updateNote(note.id, { tagIds: next })
  }

  function setColor(color: string | null) {
    updateNote(note.id, { color })
  }

  function setDueDate(e: React.ChangeEvent<HTMLInputElement>) {
    updateNote(note.id, { dueDate: e.target.value || null })
  }

  function setNotebook(e: React.ChangeEvent<HTMLSelectElement>) {
    updateNote(note.id, { notebookId: e.target.value || null })
  }

  function toggleFavorite() {
    updateNote(note.id, { isFavorite: !note.isFavorite })
  }

  function exportMarkdown() {
    const md = htmlToMarkdown(note.content || '')
    const filename = `${note.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.md`
    downloadFile(filename, `# ${note.title}\n\n${md}`)
  }

  function exportHTML() {
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${note.title}</title></head><body><h1>${note.title}</h1>${note.content || ''}</body></html>`
    downloadFile(`${note.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.html`, html, 'text/html')
  }

  return (
    <aside className="properties-panel">
      <div className="properties-panel__header">
        <span className="properties-panel__title">Properties</span>
        <button className="properties-panel__close" onClick={() => setShowProperties(false)}>✕</button>
      </div>

      <div className="properties-panel__body">

        <Section title="Classification">
          <Row label="Category">
            <select className="prop-select" value={note.category || ''} onChange={e => updateNote(note.id, { category: e.target.value || null })}>
              <option value="">None</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.icon} {c.label}</option>
              ))}
            </select>
          </Row>
          <Row label="Notebook">
            <select className="prop-select" value={note.notebookId || ''} onChange={setNotebook}>
              <option value="">None</option>
              {(notebooks ?? []).map(nb => (
                <option key={nb.id} value={nb.id}>{nb.icon} {nb.name}</option>
              ))}
            </select>
          </Row>

          <Row label="Tags">
            <div className="prop-tags">
              {noteTags.map(tag => (
                <TagPill key={tag.id} tag={tag} small onRemove={() => toggleTag(tag.id)} />
              ))}
              <button className="prop-add-tag" onClick={() => setShowTagPicker(v => !v)}>+ tag</button>
            </div>
          </Row>

          {showTagPicker && (
            <div className="tag-picker">
              {allTags.length === 0 && <span className="tag-picker__empty">No tags yet. Create them in the sidebar.</span>}
              {allTags.map(tag => (
                <button
                  key={tag.id}
                  className={`tag-picker__item ${(note.tagIds ?? []).includes(tag.id) ? 'tag-picker__item--active' : ''}`}
                  onClick={() => toggleTag(tag.id)}
                >
                  <span className="tag-picker__dot" style={{ background: tag.color }} />
                  {tag.name}
                  {(note.tagIds ?? []).includes(tag.id) && <span>✓</span>}
                </button>
              ))}
            </div>
          )}
        </Section>

        <Section title="Schedule">
          <Row label="Due date">
            <input
              type="date"
              className="prop-date"
              value={note.dueDate || ''}
              onChange={setDueDate}
            />
          </Row>
          <Row label="Favorite">
            <button className="prop-fav-btn" onClick={toggleFavorite}>
              {note.isFavorite ? '⭐ Starred' : '☆ Star'}
            </button>
          </Row>
        </Section>

        <Section title="Color Label">
          <div className="prop-colors">
            {COLORS.map(c => (
              <button
                key={c ?? 'none'}
                className={`prop-color-swatch ${note.color === c ? 'prop-color-swatch--active' : ''}`}
                style={{ background: c || 'var(--bg-tertiary)', borderColor: c || 'var(--border)' }}
                title={COLOR_LABELS[c ?? 'null']}
                onClick={() => setColor(c)}
              />
            ))}
          </div>
        </Section>

        {note.type === 'note' && (
          <Section title="Stats">
            <Row label="Words"><span className="prop-stat">{wordCount}</span></Row>
            <Row label="Reading"><span className="prop-stat">{readingTime} min</span></Row>
          </Section>
        )}

        <Section title="Timestamps">
          <Row label="Created">
            <span className="prop-date-text">{new Date(note.createdAt).toLocaleString()}</span>
          </Row>
          <Row label="Modified">
            <span className="prop-date-text">{new Date(note.updatedAt).toLocaleString()}</span>
          </Row>
        </Section>

        {note.type === 'note' && (
          <Section title="Export">
            <div className="prop-export-btns">
              <button className="prop-export-btn" onClick={exportMarkdown}>↓ Markdown</button>
              <button className="prop-export-btn" onClick={exportHTML}>↓ HTML</button>
            </div>
          </Section>
        )}

      </div>
    </aside>
  )
}
