import { useNotes } from '../../contexts/NotesContext.jsx'
import './SaveIndicator.css'

export function SaveIndicator() {
  const { saveStatus, lastSavedAt } = useNotes()

  if (saveStatus === 'idle') return null

  const savedTime = lastSavedAt
    ? lastSavedAt.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
    : null

  return (
    <span className={`save-indicator save-indicator--${saveStatus}`}>
      {saveStatus === 'pending' && <span className="save-indicator__dot save-indicator__dot--pulse" />}
      {saveStatus === 'saving'  && <span className="save-indicator__spinner" />}
      {saveStatus === 'saved'   && <span className="save-indicator__dot save-indicator__dot--saved" />}
      {saveStatus === 'error'   && <span className="save-indicator__dot save-indicator__dot--error" />}

      <span className="save-indicator__label">
        {saveStatus === 'pending' && 'Unsaved'}
        {saveStatus === 'saving'  && 'Saving…'}
        {saveStatus === 'saved'   && (savedTime ? `Saved ${savedTime}` : 'Saved')}
        {saveStatus === 'error'   && 'Save failed'}
      </span>
    </span>
  )
}
