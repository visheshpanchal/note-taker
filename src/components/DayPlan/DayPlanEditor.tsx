import { useNotes } from '../../contexts/NotesContext'
import { getCategoryById } from '../../utils/categories'
import { formatLocation } from '../../utils/location'
import { ReminderPicker } from '../shared/ReminderPicker'
import { AttachmentList } from '../shared/AttachmentList'
import { TextSection } from './sections/TextSection'
import { PrioritiesSection } from './sections/PrioritiesSection'
import { ChecklistSection } from './sections/ChecklistSection'
import { TimeBlockSection } from './sections/TimeBlockSection'
import type { DayPlan, AnySection } from '../../types'
import './DayPlanEditor.css'

interface DayPlanEditorProps {
  note: DayPlan
}

interface Progress {
  done: number
  total: number
  pct: number
}

function calcProgress(sections: AnySection[]): Progress | null {
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

function renderSectionBody(section: AnySection, onUpdate: (patch: Partial<AnySection>) => void, isToday: boolean) {
  switch (section.type) {
    case 'text':       return <TextSection section={section} onUpdate={onUpdate as (p: Parameters<typeof TextSection>[0]['onUpdate'] extends (p: infer P) => void ? P : never) => void} />
    case 'priorities': return <PrioritiesSection section={section} onUpdate={onUpdate as Parameters<typeof PrioritiesSection>[0]['onUpdate']} />
    case 'checklist':  return <ChecklistSection section={section} onUpdate={onUpdate as Parameters<typeof ChecklistSection>[0]['onUpdate']} />
    case 'timeblocks': return <TimeBlockSection section={section} onUpdate={onUpdate as Parameters<typeof TimeBlockSection>[0]['onUpdate']} isToday={isToday} />
    default:           return null
  }
}

interface SectionProps {
  section: AnySection
  onUpdate: (patch: Partial<AnySection>) => void
  onToggle: () => void
  isToday: boolean
}

function Section({ section, onUpdate, onToggle, isToday }: SectionProps) {
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

export function DayPlanEditor({ note }: DayPlanEditorProps) {
  const { updateNote, categories } = useNotes()
  const sections = note.sections ?? []
  const category = getCategoryById(note.category, categories)
  const progress = calcProgress(sections)
  const isToday = note.date === new Date().toISOString().split('T')[0]

  const d = new Date(note.date + 'T12:00:00')
  const dateDisplay = d.toLocaleDateString(undefined, {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
  })

  function updateSection(key: string, patch: Partial<AnySection>) {
    updateNote(note.id, {
      sections: sections.map(s => s.key === key ? { ...s, ...patch } as AnySection : s)
    })
  }

  function toggleSection(key: string) {
    updateNote(note.id, {
      sections: sections.map(s => s.key === key ? { ...s, collapsed: !s.collapsed } as AnySection : s)
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
              style={category ? { '--cat': category.color } as React.CSSProperties : undefined}
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
