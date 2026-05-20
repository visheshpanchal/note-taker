import { Timer } from './Timer'
import type { TodoItem as TodoItemType } from '../../types'
import './TodoItem.css'

interface TodoItemProps {
  item: TodoItemType
  isSelected: boolean
  onChange: (updated: TodoItemType) => void
  onDelete: () => void
  onSelect: () => void
}

export function TodoItem({ item, isSelected, onChange, onDelete, onSelect }: TodoItemProps) {
  const steps = item.steps ?? []
  const stepsComplete = steps.filter(s => s.done).length
  const stepsProgress = steps.length > 0 ? Math.round((stepsComplete / steps.length) * 100) : 0

  function patch(fields: Partial<TodoItemType>) {
    onChange({ ...item, ...fields })
  }

  const dueDateLabel = item.dueDate
    ? new Date(item.dueDate + 'T12:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    : null
  const isPastDue = item.dueDate && !item.checked && new Date(item.dueDate + 'T23:59:59') < new Date()

  return (
    <div
      className={[
        'todo-item',
        item.checked     ? 'todo-item--done'     : '',
        isSelected       ? 'todo-item--selected'  : '',
        item.isImportant ? 'todo-item--important' : '',
      ].filter(Boolean).join(' ')}
    >
      <div className="todo-item__row">

        {/* Checkbox — stops propagation so it doesn't select */}
        <button
          className="todo-item__check"
          onClick={e => { e.stopPropagation(); patch({ checked: !item.checked }) }}
          aria-label={item.checked ? 'Mark incomplete' : 'Mark complete'}
        >
          <svg className="todo-item__check-svg" viewBox="0 0 22 22" fill="none">
            <circle className="todo-item__check-ring" cx="11" cy="11" r="9.5" strokeWidth="1.5" />
            {item.checked && (
              <polyline
                className="todo-item__check-mark"
                points="6.5,11 9.5,14 15.5,8"
                strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
              />
            )}
          </svg>
        </button>

        {/* Clickable body — the whole area opens the detail panel */}
        <div
          className="todo-item__body"
          onClick={onSelect}
          role="button"
          tabIndex={0}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect() } }}
        >
          <div className={`todo-item__text ${!item.text ? 'todo-item__text--empty' : ''}`}>
            {item.text || 'Untitled task'}
          </div>

          {(item.isMyDay || dueDateLabel || steps.length > 0 || item.itemNote) && (
            <div className="todo-item__chips">
              {item.isMyDay && (
                <span className="todo-item__chip todo-item__chip--myday">☀ My Day</span>
              )}
              {dueDateLabel && (
                <span className={`todo-item__chip ${isPastDue ? 'todo-item__chip--overdue' : 'todo-item__chip--date'}`}>
                  {isPastDue ? '⚠' : '◷'} {dueDateLabel}
                </span>
              )}
              {steps.length > 0 && (
                <span className="todo-item__chip todo-item__chip--steps">
                  {stepsComplete}/{steps.length} steps
                </span>
              )}
              {item.itemNote && (
                <span className="todo-item__chip todo-item__chip--note">✎ note</span>
              )}
            </div>
          )}
        </div>

        {/* Quick actions — stop propagation so they don't open panel */}
        <div className="todo-item__actions" onClick={e => e.stopPropagation()}>
          <button
            className={`todo-item__act todo-item__act--sun ${item.isMyDay ? 'todo-item__act--on' : ''}`}
            onClick={() => patch({ isMyDay: !item.isMyDay })}
            title={item.isMyDay ? 'Remove from My Day' : 'Add to My Day'}
          >☀</button>

          <button
            className={`todo-item__act todo-item__act--star ${item.isImportant ? 'todo-item__act--on' : ''}`}
            onClick={() => patch({ isImportant: !item.isImportant })}
            title={item.isImportant ? 'Remove importance' : 'Mark as important'}
          >★</button>

          <Timer
            itemId={item.id}
            timerSeconds={item.timerSeconds}
            timerRemaining={item.timerRemaining}
            timerRunning={item.timerRunning}
            onChange={p => patch(p)}
          />

          <button
            className="todo-item__act todo-item__act--delete"
            onClick={() => onDelete()}
            title="Delete"
          >
            <svg viewBox="0 0 16 16" fill="none">
              <line x1="4" y1="4" x2="12" y2="12" strokeWidth="1.8" strokeLinecap="round"/>
              <line x1="12" y1="4" x2="4" y2="12" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Steps mini-progress bar */}
      {steps.length > 0 && (
        <div className="todo-item__steps-bar">
          <div className="todo-item__steps-bar-fill" style={{ width: `${stepsProgress}%` }} />
        </div>
      )}
    </div>
  )
}
