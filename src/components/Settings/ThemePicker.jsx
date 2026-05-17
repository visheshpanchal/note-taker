import { useState } from 'react'
import { useTheme } from '../../contexts/ThemeContext.jsx'
import './ThemePicker.css'

const MODE_LABEL = { light: '☀ Light', dark: '● Dark' }

function ThemeCard({ theme, active, onSelect }) {
  const t = theme.tokens
  return (
    <button
      className={`theme-card ${active ? 'theme-card--active' : ''}`}
      onClick={() => onSelect(theme.id)}
      title={theme.description}
    >
      <div className="theme-card__preview" style={{
        background: t['--bg-primary'],
        border: `2px solid ${active ? t['--accent'] : t['--border']}`,
      }}>
        <div className="theme-card__preview-sidebar" style={{ background: t['--bg-sidebar'] }} />
        <div className="theme-card__preview-body">
          <div className="theme-card__preview-line theme-card__preview-line--title"
            style={{ background: t['--text-primary'] }} />
          <div className="theme-card__preview-line" style={{ background: t['--text-secondary'] }} />
          <div className="theme-card__preview-line" style={{ background: t['--text-muted'] }} />
          <div className="theme-card__preview-accent" style={{ background: t['--accent'] }} />
        </div>
        {active && (
          <div className="theme-card__check" style={{ background: t['--accent'], color: t['--accent-fg'] }}>✓</div>
        )}
      </div>
      <div className="theme-card__footer">
        <span className="theme-card__name">{theme.name}</span>
        <span className={`theme-card__mode theme-card__mode--${theme.mode}`}>
          {MODE_LABEL[theme.mode]}
        </span>
      </div>
      {theme.isBuiltIn && <span className="theme-card__builtin">built-in</span>}
    </button>
  )
}

export function ThemePicker() {
  const { themeId, setActiveTheme, themes, deleteTheme, storagePath } = useTheme()
  const [confirmDelete, setConfirmDelete] = useState(null)

  const lightThemes = themes.filter(t => t.mode === 'light')
  const darkThemes  = themes.filter(t => t.mode === 'dark')

  function handleDelete(id) {
    if (confirmDelete === id) {
      deleteTheme(id)
      setConfirmDelete(null)
    } else {
      setConfirmDelete(id)
      setTimeout(() => setConfirmDelete(null), 2500)
    }
  }

  return (
    <div className="theme-picker">
      <div className="theme-picker__system-row">
        <button
          className={`theme-picker__system-btn ${themeId === 'system' ? 'theme-picker__system-btn--active' : ''}`}
          onClick={() => setActiveTheme('system')}
        >
          <span className="theme-picker__system-icon">⚙</span>
          <div>
            <div className="theme-picker__system-label">System Default</div>
            <div className="theme-picker__system-sub">Follows your OS light/dark preference automatically</div>
          </div>
          {themeId === 'system' && <span className="theme-picker__system-check">✓</span>}
        </button>
      </div>

      {lightThemes.length > 0 && (
        <div className="theme-picker__group">
          <div className="theme-picker__group-label">Light Themes</div>
          <div className="theme-picker__grid">
            {lightThemes.map(t => (
              <div key={t.id} className="theme-picker__card-wrap">
                <ThemeCard theme={t} active={themeId === t.id} onSelect={setActiveTheme} />
                {!t.isBuiltIn && (
                  <button
                    className={`theme-picker__del ${confirmDelete === t.id ? 'theme-picker__del--confirm' : ''}`}
                    onClick={() => handleDelete(t.id)}
                    title={confirmDelete === t.id ? 'Confirm delete' : 'Delete theme'}
                  >{confirmDelete === t.id ? '!' : '×'}</button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {darkThemes.length > 0 && (
        <div className="theme-picker__group">
          <div className="theme-picker__group-label">Dark Themes</div>
          <div className="theme-picker__grid">
            {darkThemes.map(t => (
              <div key={t.id} className="theme-picker__card-wrap">
                <ThemeCard theme={t} active={themeId === t.id} onSelect={setActiveTheme} />
                {!t.isBuiltIn && (
                  <button
                    className={`theme-picker__del ${confirmDelete === t.id ? 'theme-picker__del--confirm' : ''}`}
                    onClick={() => handleDelete(t.id)}
                    title={confirmDelete === t.id ? 'Confirm delete' : 'Delete theme'}
                  >{confirmDelete === t.id ? '!' : '×'}</button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {storagePath && (
        <div className="theme-picker__folder-hint">
          <span>Add custom themes by placing JSON files in the Themes folder (see folder path above).</span>
        </div>
      )}
    </div>
  )
}
