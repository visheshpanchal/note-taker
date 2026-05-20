import { useRef, useState, useEffect } from 'react'
import { v4 as uuidv4 } from 'uuid'
import type { TodoItem, TodoStep } from '../../types'
import './TodoDetailPanel.css'

interface Props {
  item: TodoItem
  onChange: (updated: TodoItem) => void
  onDelete: () => void
  onClose: () => void
}

export function TodoDetailPanel({ item, onChange, onDelete, onClose }: Props) {
  const [newStep, setNewStep] = useState('')
  const newStepRef  = useRef<HTMLInputElement>(null)
  const titleRef    = useRef<HTMLInputElement>(null)
  const dateInputRef = useRef<HTMLInputElement>(null)
  const steps: TodoStep[] = item.steps ?? []

  // Focus the title so the user can immediately edit it
  useEffect(() => {
    const t = setTimeout(() => titleRef.current?.focus(), 50)
    return () => clearTimeout(t)
  }, [item.id])
  const stepsComplete = steps.filter(s => s.done).length

  function patch(fields: Partial<TodoItem>) {
    onChange({ ...item, ...fields })
  }

  function pickDate() {
    const el = dateInputRef.current
    if (!el) return
    if (typeof (el as HTMLInputElement & { showPicker?: () => void }).showPicker === 'function') {
      try { (el as HTMLInputElement & { showPicker: () => void }).showPicker() } catch { el.focus() }
    } else {
      el.focus()
    }
  }

  function addStep() {
    const text = newStep.trim()
    if (!text) return
    patch({ steps: [...steps, { id: uuidv4(), text, done: false }] })
    setNewStep('')
    newStepRef.current?.focus()
  }

  function updateStep(id: string, fields: Partial<TodoStep>) {
    patch({ steps: steps.map(s => s.id === id ? { ...s, ...fields } : s) })
  }

  function deleteStep(id: string) {
    patch({ steps: steps.filter(s => s.id !== id) })
  }

  const dueDateFormatted = item.dueDate
    ? new Date(item.dueDate + 'T12:00:00').toLocaleDateString(undefined, {
        weekday: 'short', month: 'short', day: 'numeric'
      })
    : null
  const isPastDue = item.dueDate && !item.checked && new Date(item.dueDate + 'T23:59:59') < new Date()

  return (
    <div className="tdp">
      {/* ── Header ── */}
      <div className="tdp__header">
        <button
          className="tdp__check"
          onClick={() => patch({ checked: !item.checked })}
          aria-label={item.checked ? 'Mark incomplete' : 'Mark complete'}
        >
          <svg className="tdp__check-svg" viewBox="0 0 22 22" fill="none">
            <circle
              className={`tdp__check-ring ${item.checked ? 'tdp__check-ring--done' : ''}`}
              cx="11" cy="11" r="9.5" strokeWidth="1.5"
            />
            {item.checked && (
              <polyline
                className="tdp__check-mark"
                points="6.5,11 9.5,14 15.5,8"
                strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
              />
            )}
          </svg>
        </button>

        <input
          ref={titleRef}
          className={`tdp__title ${item.checked ? 'tdp__title--done' : ''}`}
          value={item.text}
          onChange={e => patch({ text: e.target.value })}
          placeholder="Task name…"
        />

        <button className="tdp__close" onClick={onClose} aria-label="Close panel">
          <svg viewBox="0 0 16 16" fill="none">
            <line x1="4" y1="4" x2="12" y2="12" strokeWidth="1.8" strokeLinecap="round"/>
            <line x1="12" y1="4" x2="4" y2="12" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      {/* ── Quick toggles ── */}
      <div className="tdp__toggles">
        <button
          className={`tdp__toggle ${item.isMyDay ? 'tdp__toggle--on tdp__toggle--myday' : ''}`}
          onClick={() => patch({ isMyDay: !item.isMyDay })}
        >
          <span className="tdp__toggle-icon">☀</span>
          <span>{item.isMyDay ? 'Added to My Day' : 'Add to My Day'}</span>
        </button>

        <button
          className={`tdp__toggle ${item.isImportant ? 'tdp__toggle--on tdp__toggle--important' : ''}`}
          onClick={() => patch({ isImportant: !item.isImportant })}
        >
          <span className="tdp__toggle-icon">★</span>
          <span>{item.isImportant ? 'Important' : 'Mark as important'}</span>
        </button>
      </div>

      <div className="tdp__body">

        {/* ── Due date ── */}
        <div className="tdp__section">
          <div className="tdp__section-head">Due Date</div>
          {dueDateFormatted ? (
            <div className="tdp__date-set">
              <span className={`tdp__date-label ${isPastDue ? 'tdp__date-label--overdue' : ''}`}>
                {isPastDue ? '⚠ Overdue · ' : '◷ '}{dueDateFormatted}
              </span>
              <input
                type="date"
                className="tdp__date-input"
                value={item.dueDate ?? ''}
                onChange={e => patch({ dueDate: e.target.value || null })}
              />
              <button className="tdp__date-clear" onClick={() => patch({ dueDate: null })}>Remove</button>
            </div>
          ) : (
            <div className="tdp__date-empty">
              <input
                ref={dateInputRef}
                type="date"
                className="tdp__date-input tdp__date-input--pick"
                onChange={e => { if (e.target.value) patch({ dueDate: e.target.value }) }}
              />
              <button className="tdp__date-placeholder" onClick={pickDate}>
                Pick a date
              </button>
            </div>
          )}
        </div>

        {/* ── Steps ── */}
        <div className="tdp__section">
          <div className="tdp__section-head">
            Steps
            {steps.length > 0 && (
              <span className="tdp__section-count">{stepsComplete} / {steps.length}</span>
            )}
          </div>

          {steps.length > 0 && (
            <div className="tdp__steps-progress">
              <div
                className="tdp__steps-fill"
                style={{ width: `${Math.round((stepsComplete / steps.length) * 100)}%` }}
              />
            </div>
          )}

          <div className="tdp__steps-list">
            {steps.map(step => (
              <div
                key={step.id}
                className={`tdp__step ${step.done ? 'tdp__step--done' : ''}`}
              >
                <button
                  className="tdp__step-check"
                  onClick={() => updateStep(step.id, { done: !step.done })}
                  aria-label={step.done ? 'Mark step incomplete' : 'Mark step complete'}
                >
                  {step.done && (
                    <svg viewBox="0 0 12 12" fill="none">
                      <polyline points="2,6 5,9 10,3" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </button>
                <input
                  className="tdp__step-text"
                  value={step.text}
                  onChange={e => updateStep(step.id, { text: e.target.value })}
                  placeholder="Step…"
                />
                <button
                  className="tdp__step-del"
                  onClick={() => deleteStep(step.id)}
                  aria-label="Delete step"
                >
                  <svg viewBox="0 0 12 12" fill="none">
                    <line x1="2" y1="2" x2="10" y2="10" strokeWidth="1.5" strokeLinecap="round"/>
                    <line x1="10" y1="2" x2="2" y2="10" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>
            ))}

            {/* Add step row */}
            <div className="tdp__step tdp__step--add">
              <div className="tdp__step-add-icon">+</div>
              <input
                ref={newStepRef}
                className="tdp__step-text"
                value={newStep}
                onChange={e => setNewStep(e.target.value)}
                placeholder="Add a step…"
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addStep() } }}
                onBlur={addStep}
              />
            </div>
          </div>
        </div>

        {/* ── Note ── */}
        <div className="tdp__section tdp__section--note">
          <div className="tdp__section-head">Note</div>
          <textarea
            className="tdp__note"
            value={item.itemNote ?? ''}
            onChange={e => patch({ itemNote: e.target.value })}
            placeholder="Add a note…"
            rows={4}
          />
        </div>

      </div>

      {/* ── Footer ── */}
      <div className="tdp__footer">
        <button className="tdp__delete-btn" onClick={onDelete}>
          <svg viewBox="0 0 16 16" fill="none">
            <path d="M3 4h10M6 4V3h4v1M5 4l.5 9h5L11 4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Delete task
        </button>
      </div>
    </div>
  )
}
