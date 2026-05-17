import { v4 as uuidv4 } from 'uuid'
import './Sections.css'

export function ChecklistSection({ section, onUpdate }) {
  function toggle(id) {
    onUpdate({ items: section.items.map(i => i.id === id ? { ...i, done: !i.done } : i) })
  }

  function setText(id, text) {
    onUpdate({ items: section.items.map(i => i.id === id ? { ...i, text } : i) })
  }

  function addItem() {
    onUpdate({ items: [...(section.items ?? []), { id: uuidv4(), text: '', done: false }] })
  }

  function deleteItem(id) {
    onUpdate({ items: section.items.filter(i => i.id !== id) })
  }

  return (
    <div className="checklist-section">
      {section.description && <p className="section-desc">{section.description}</p>}
      {(section.items ?? []).map(item => (
        <div key={item.id} className={`check-item ${item.done ? 'check-item--done' : ''}`}>
          <button className="check-btn" onClick={() => toggle(item.id)}>
            {item.done ? '✓' : ''}
          </button>
          <input
            className="check-input"
            value={item.text}
            onChange={e => setText(item.id, e.target.value)}
            placeholder="Add item…"
            onKeyDown={e => e.key === 'Enter' && addItem()}
          />
          <button className="check-delete" onClick={() => deleteItem(item.id)} title="Delete">×</button>
        </div>
      ))}
      <button className="section-add-btn" onClick={addItem}>+ Add item</button>
    </div>
  )
}
