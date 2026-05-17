import { useMemo } from 'react'
import './Sections.css'

const CATEGORIES = [null, 'work', 'personal', 'health', 'learning', 'break']
const CAT_LABELS  = { null: 'None', work: 'Work', personal: 'Personal', health: 'Health', learning: 'Learning', break: 'Break' }

function currentTimeBlock(items) {
  const now = new Date()
  const nowMin = now.getHours() * 60 + now.getMinutes()
  for (let i = items.length - 1; i >= 0; i--) {
    const [h, m] = items[i].time.split(':').map(Number)
    if (h * 60 + m <= nowMin) return items[i].id
  }
  return null
}

export function TimeBlockSection({ section, onUpdate, isToday }) {
  const items = section.items ?? []
  const currentId = useMemo(() => isToday ? currentTimeBlock(items) : null, [isToday, items])

  function updateItem(id, patch) {
    onUpdate({ items: items.map(i => i.id === id ? { ...i, ...patch } : i) })
  }

  function cycleCategory(item) {
    const idx = CATEGORIES.indexOf(item.category)
    const next = CATEGORIES[(idx + 1) % CATEGORIES.length]
    updateItem(item.id, { category: next })
  }

  return (
    <div className="timeblock-section">
      {section.description && <p className="section-desc">{section.description}</p>}
      <div className="timeblock-grid">
        {items.map(item => (
          <div
            key={item.id}
            className={[
              'timeblock-row',
              item.id === currentId ? 'timeblock-row--current' : '',
              item.done ? 'timeblock-row--done' : ''
            ].join(' ')}
          >
            <span className="timeblock-time">{item.time}</span>

            <button
              className={`timeblock-dot timeblock-dot--${item.category ?? ''}`}
              onClick={() => cycleCategory(item)}
              title={`Category: ${CAT_LABELS[item.category]}`}
            />

            <input
              className="timeblock-task"
              value={item.task}
              onChange={e => updateItem(item.id, { task: e.target.value })}
              placeholder="What's planned…"
            />

            <button
              className="timeblock-check"
              onClick={() => updateItem(item.id, { done: !item.done })}
              title={item.done ? 'Mark incomplete' : 'Mark done'}
            >
              {item.done ? '✓' : ''}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
