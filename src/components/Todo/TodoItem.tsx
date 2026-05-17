import { useRef } from 'react'
import { Timer } from './Timer'
import type { TodoItem as TodoItemType } from '../../types'
import './TodoItem.css'

interface TodoItemProps {
  item: TodoItemType
  onChange: (updated: TodoItemType) => void
  onDelete: () => void
}

export function TodoItem({ item, onChange, onDelete }: TodoItemProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  function handleTimerChange(patch: Partial<{ timerSeconds: number; timerRemaining: number; timerRunning: boolean }>) {
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
