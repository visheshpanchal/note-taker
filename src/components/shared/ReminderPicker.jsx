import { useState } from 'react'
import './ReminderPicker.css'

function toLocalInputValue(isoUtc) {
  if (!isoUtc) return ''
  const d = new Date(isoUtc)
  const p = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
}

function formatDisplay(isoUtc) {
  return new Date(isoUtc).toLocaleString(undefined, {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

function getDefaultInput(defaultDate) {
  if (defaultDate) {
    const d = new Date(`${defaultDate}T09:00:00`)
    if (d > new Date()) return toLocalInputValue(d.toISOString())
  }
  const d = new Date()
  d.setHours(d.getHours() + 1, 0, 0, 0)
  return toLocalInputValue(d.toISOString())
}

export function ReminderPicker({ reminderAt, reminderNotified, onChange, defaultDate }) {
  const [editing, setEditing] = useState(false)
  const [inputValue, setInputValue] = useState('')

  function openEditor() {
    setInputValue(reminderAt ? toLocalInputValue(reminderAt) : getDefaultInput(defaultDate))
    setEditing(true)
  }

  function save() {
    if (inputValue) onChange(new Date(inputValue).toISOString())
    setEditing(false)
  }

  function clear() {
    onChange(null)
    setEditing(false)
  }

  function handleKey(e) {
    if (e.key === 'Enter') save()
    if (e.key === 'Escape') setEditing(false)
  }

  if (editing) {
    return (
      <div className="reminder-picker reminder-picker--editing">
        <span className="rp-icon">🔔</span>
        <input
          type="datetime-local"
          className="rp-input"
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          onKeyDown={handleKey}
          autoFocus
        />
        <button className="rp-btn rp-btn--save" onClick={save}>Set</button>
        {reminderAt && <button className="rp-btn rp-btn--danger" onClick={clear}>Clear</button>}
        <button className="rp-btn rp-btn--ghost" onClick={() => setEditing(false)}>✕</button>
      </div>
    )
  }

  if (reminderAt) {
    const isFuture = new Date(reminderAt) > new Date()
    return (
      <div className={`reminder-picker reminder-picker--active ${!isFuture ? 'reminder-picker--past' : ''}`}>
        <span className="rp-icon">{reminderNotified ? '🔕' : '🔔'}</span>
        <button className="rp-time" onClick={openEditor}>
          {reminderNotified && !isFuture ? 'Sent · ' : ''}{formatDisplay(reminderAt)}
        </button>
        <button className="rp-clear" onClick={clear} title="Remove reminder">×</button>
      </div>
    )
  }

  return (
    <button className="reminder-picker reminder-picker--empty" onClick={openEditor}>
      <span className="rp-icon">🔔</span>
      <span>Add reminder</span>
    </button>
  )
}
