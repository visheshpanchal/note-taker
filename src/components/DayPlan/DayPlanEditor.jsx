import { useNotes } from '../../contexts/NotesContext.jsx'
import { getCategoryById } from '../../utils/categories.js'
import { formatLocation } from '../../utils/location.js'
import { ReminderPicker } from '../shared/ReminderPicker.jsx'
import { AttachmentList } from '../shared/AttachmentList.jsx'
import { TextSection } from './sections/TextSection.jsx'
import { PrioritiesSection } from './sections/PrioritiesSection.jsx'
import { ChecklistSection } from './sections/ChecklistSection.jsx'
import { TimeBlockSection } from './sections/TimeBlockSection.jsx'
import './DayPlanEditor.css'

function calcProgress(sections) {
  let total = 0, done = 0
  for (const s of sections) {
    if (s.type === 'priorities' || s.type === 'checklist') {
      for (const item of s.items ?? []) { total++; if (item.done) done++ }
    } else if (s.type === 'timeblocks') {
      for (const item of s.items ?? []) { total++; if (item.done) done++ }
    }
  }
  return total === 0 ? null : { done, total, pct: Math.round((done / total) * 100) }
}

function renderSectionBody(section, onUpdate, isToday) {
  switch (section.type) {
    case 'text':       return <TextSection section={section} onUpdate={onUpdate} />
    case 'priorities': return <PrioritiesSection section={section} onUpdate={onUpdate} />
    case 'checklist':  return <ChecklistSection section={section} onUpdate={onUpdate} />
    case 'timeblocks': return <TimeBlockSection section={section} onUpdate={onUpdate} isToday={isToday} />
    default:           return null
  }
}

function Section({ section, onUpdate, onToggle, isToday }) {
  return (
    <div className={`day-section ${section.collapsed ? 'day-section--collapsed' : ''}`}>
      <div className="day-section__header" onClick={onToggle}>
        <span className="day-section__label">{section.label}</span>
        <span className="day-section__arrow">{section.collapsed ? '▸' : '▾'}</span>
      </div>
      {!section.collapsed && (
        <div className="day-section__body">
          {renderSectionBody(section, onUpdate, isToday)}
        </div>
      )}
    </div>
  )
}

export function DayPlanEditor({ note }) {
  const { updateNote, categories } = useNotes()
  const sections = note.sections ?? []
  const category = getCategoryById(note.category, categories)
  const progress = calcProgress(sections)
  const isToday = note.date === new Date().toISOString().split('T')[0]

  const d = new Date(note.date + 'T12:00:00')
  const dateDisplay = d.toLocaleDateString(undefined, {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
  })

  function updateSection(key, patch) {
    updateNote(note.id, {
      sections: sections.map(s => s.key === key ? { ...s, ...patch } : s)
    })
  }

  function toggleSection(key) {
    updateNote(note.id, {
      sections: sections.map(s => s.key === key ? { ...s, collapsed: !s.collapsed } : s)
    })
  }

  const location = formatLocation(note.locationTag)

  return (
    <div className="dayplan-editor">
      <div className="dayplan-editor__header">
        {category && <div className="dayplan-editor__color-strip" style={{ background: category.color }} />}
        <div className="dayplan-editor__header-inner">
        <div className="dayplan-editor__date">
          <span className="dayplan-editor__date-icon">📅</span>
          <span className={`dayplan-editor__date-label ${isToday ? 'dayplan-editor__date-label--today' : ''}`}>
            {isToday ? 'Today · ' : ''}{dateDisplay}
          </span>
        </div>
        <input
          className="dayplan-editor__title"
          value={note.title}
          onChange={e => updateNote(note.id, { title: e.target.value })}
          placeholder="Day Plan Title"
        />
        <div className="dayplan-editor__meta">
          <select
            className={`dayplan-editor__cat-select ${category ? 'dayplan-editor__cat-select--set' : ''}`}
            style={category ? { '--cat': category.color } : undefined}
            value={note.category || ''}
            onChange={e => updateNote(note.id, { category: e.target.value || null })}
          >
            <option value="">No category</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.icon} {c.label}</option>
            ))}
          </select>
          <span className="dayplan-editor__template-badge">📋 {note.templateName}</span>
          {progress && (
            <span className="dayplan-editor__progress-text">{progress.done}/{progress.total} done</span>
          )}
        </div>
        {progress && (
          <div className="dayplan-editor__progress">
            <div className="dayplan-editor__progress-fill" style={{ width: `${progress.pct}%` }} />
          </div>
        )}
        </div>
      </div>

      <div className="dayplan-editor__sections">
        {sections.map(section => (
          <Section
            key={section.key}
            section={section}
            onUpdate={patch => updateSection(section.key, patch)}
            onToggle={() => toggleSection(section.key)}
            isToday={isToday}
          />
        ))}
      </div>

      <div className="dayplan-editor__footer">
        <ReminderPicker
          reminderAt={note.reminderAt}
          reminderNotified={note.reminderNotified}
          onChange={val => updateNote(note.id, { reminderAt: val })}
          defaultDate={note.date}
        />
        {location && <span>📍 {location}</span>}
        <span>Created {new Date(note.createdAt).toLocaleDateString()}</span>
      </div>

      <div className="dayplan-editor__attachments">
        <AttachmentList note={note} updateNote={updateNote} />
      </div>
    </div>
  )
}
