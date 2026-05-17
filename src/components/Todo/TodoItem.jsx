import { useRef } from 'react'
import { Timer } from './Timer.jsx'
import './TodoItem.css'

export function TodoItem({ item, onChange, onDelete }) {
  const inputRef = useRef(null)

  function handleTimerChange(patch) {
    onChange({ ...item, ...patch })
  }

  return (
    <div className={`todo-item ${item.checked ? 'todo-item--done' : ''}`}>
      <button
        className="todo-item__check"
        onClick={() => onChange({ ...item, checked: !item.checked })}
        title={item.checked ? 'Mark incomplete' : 'Mark complete'}
      >
        <span className="todo-item__checkbox">
          {item.checked ? '✓' : ''}
        </span>
      </button>

      <input
        ref={inputRef}
        className="todo-item__text"
        value={item.text}
        onChange={e => onChange({ ...item, text: e.target.value })}
        placeholder="Todo item..."
        onKeyDown={e => {
          if (e.key === 'Enter') {
            e.preventDefault()
            inputRef.current?.blur()
          }
        }}
      />

      <Timer
        itemId={item.id}
        timerSeconds={item.timerSeconds}
        timerRemaining={item.timerRemaining}
        timerRunning={item.timerRunning}
        onChange={handleTimerChange}
      />

      <button className="todo-item__delete" onClick={onDelete} title="Delete">×</button>
    </div>
  )
}
