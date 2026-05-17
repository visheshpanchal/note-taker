import './Sections.css'

const LABELS = ['', 'Most Important', 'Second Priority', 'Third Priority']

export function PrioritiesSection({ section, onUpdate }) {
  function toggle(id) {
    onUpdate({
      items: section.items.map(i => i.id === id ? { ...i, done: !i.done } : i)
    })
  }

  function setText(id, text) {
    onUpdate({
      items: section.items.map(i => i.id === id ? { ...i, text } : i)
    })
  }

  return (
    <div className="priorities-section">
      {section.description && <p className="section-desc">{section.description}</p>}
      {(section.items ?? []).map(item => (
        <div key={item.id} className={`priority-item ${item.done ? 'priority-item--done' : ''}`}>
          <div className={`priority-badge priority-badge--${item.priority}`}>{item.priority}</div>
          <input
            className="priority-input"
            value={item.text}
            onChange={e => setText(item.id, e.target.value)}
            placeholder={LABELS[item.priority] || `Priority ${item.priority}`}
          />
          <button
            className="priority-check"
            onClick={() => toggle(item.id)}
            title={item.done ? 'Mark incomplete' : 'Mark done'}
          >
            {item.done ? '✓' : ''}
          </button>
        </div>
      ))}
    </div>
  )
}
