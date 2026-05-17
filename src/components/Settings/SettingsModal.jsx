import { useState, useEffect, useCallback } from 'react'
import { useNotes } from '../../contexts/NotesContext.jsx'
import { useTheme } from '../../contexts/ThemeContext.jsx'
import { TemplateManager } from '../DayPlan/TemplateManager.jsx'
import { ThemePicker } from './ThemePicker.jsx'
import './SettingsModal.css'

const TABS = ['Storage', 'Autosave', 'Templates', 'Themes']

function FolderRow({ label, filePath, onOpen, highlight }) {
  return (
    <div className={`storage-path ${highlight ? 'storage-path--highlight' : ''}`} style={{ marginBottom: 10 }}>
      <div className="storage-path__label">{label}</div>
      <div className="storage-path__value" title={filePath}>
        <span className="storage-path__text">{filePath || '—'}</span>
        {filePath && (
          <button
            className="btn btn--secondary"
            style={{ padding: '3px 10px', fontSize: 12, flexShrink: 0 }}
            onClick={onOpen}
          >
            Open
          </button>
        )}
      </div>
    </div>
  )
}

export function SettingsModal({ onClose }) {
  const { settings, systemInfo, saveStatus, lastSavedAt } = useNotes()
  const { storagePath: themeStoragePath } = useTheme()
  const { moveStoragePath } = useNotes()
  const [tab, setTab] = useState('Storage')
  const [moveStatus, setMoveStatus] = useState(null) // null | 'moving' | 'success' | 'error'
  const [errorMsg, setErrorMsg] = useState('')

  // The effective path comes from system:info (which reads config)
  const currentPath   = systemInfo?.storagePath || settings.storageLocation || ''
  const notesFilePath = systemInfo?.notesFilePath || (currentPath ? `${currentPath}/notes.json` : '')
  const defaultPath   = systemInfo?.storagePath || ''
  const isDefault     = !settings.storageLocation || settings.storageLocation === defaultPath
  const templatesPath = systemInfo?.templatesPath || (currentPath ? `${currentPath}/templates` : '')
  const themesPath    = systemInfo?.themesPath    || (currentPath ? `${currentPath}/themes`    : '')

  const savedTime = lastSavedAt
    ? lastSavedAt.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : null

  async function handlePickAndMove() {
    const newPath = await window.electronAPI?.system.pickFolder()
    if (!newPath) return
    setMoveStatus('moving'); setErrorMsg('')
    const result = await moveStoragePath(newPath)
    setMoveStatus(result.success ? 'success' : 'error')
    if (!result.success) setErrorMsg(result.error || 'Failed to move data')
  }

  async function handleResetDefault() {
    if (!defaultPath || currentPath === defaultPath) return
    setMoveStatus('moving'); setErrorMsg('')
    const result = await moveStoragePath(defaultPath)
    setMoveStatus(result.success ? 'success' : 'error')
    if (!result.success) setErrorMsg(result.error || 'Failed to reset')
  }

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') onClose()
  }, [onClose])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal modal--wide" role="dialog" aria-modal="true" aria-label="Settings">

        <div className="modal__header">
          <h2 className="modal__title">⚙️ Settings</h2>
          <button className="modal__close" onClick={onClose}>✕</button>
        </div>

        <div className="modal__tabs">
          {TABS.map(t => (
            <button
              key={t}
              className={`modal__tab ${tab === t ? 'modal__tab--active' : ''}`}
              onClick={() => setTab(t)}
            >{t}</button>
          ))}
        </div>

        <div className="modal__body">

          {/* ── Storage ── */}
          {tab === 'Storage' && (
            <section className="settings-section">
              <h3 className="settings-section__title">Active Storage Location</h3>
              <p className="settings-section__desc">
                This is where your data is being written right now. Moving transfers all existing notes to the new location and persists it across relaunches.
              </p>

              {/* notes.json highlighted prominently */}
              <FolderRow
                label="notes.json (active file)"
                filePath={notesFilePath}
                onOpen={() => window.electronAPI?.system.openPath(currentPath)}
                highlight
              />

              <FolderRow
                label="Storage folder"
                filePath={currentPath}
                onOpen={() => window.electronAPI?.system.openPath(currentPath)}
              />

              {isDefault && (
                <div className="settings-badge-row">
                  <span className="storage-path__badge" style={{ marginLeft: 0 }}>Default location</span>
                </div>
              )}

              <div className="storage-actions" style={{ marginTop: 14 }}>
                <button className="btn btn--primary" onClick={handlePickAndMove} disabled={moveStatus === 'moving'}>
                  {moveStatus === 'moving' ? '⏳ Moving…' : '📂 Change Location'}
                </button>
                {!isDefault && (
                  <button className="btn btn--ghost" onClick={handleResetDefault} disabled={moveStatus === 'moving'}>
                    Reset to Default
                  </button>
                )}
              </div>

              {moveStatus === 'success' && <div className="storage-status storage-status--success">✅ Data moved and path saved.</div>}
              {moveStatus === 'error'   && <div className="storage-status storage-status--error">❌ {errorMsg}</div>}

              <div style={{ marginTop: 20 }}>
                <h3 className="settings-section__title" style={{ marginBottom: 10 }}>Subfolders</h3>
                <FolderRow
                  label="templates/"
                  filePath={templatesPath}
                  onOpen={() => window.electronAPI?.system.openPath(templatesPath)}
                />
                <FolderRow
                  label="themes/"
                  filePath={themesPath}
                  onOpen={() => window.electronAPI?.system.openPath(themesPath)}
                />
                <p className="settings-section__desc" style={{ marginTop: 8, marginBottom: 0 }}>
                  Drop <code>.json</code> files into these folders to add custom templates or themes.
                </p>
              </div>
            </section>
          )}

          {/* ── Autosave ── */}
          {tab === 'Autosave' && (
            <section className="settings-section">
              <h3 className="settings-section__title">Autosave</h3>
              <p className="settings-section__desc">
                Changes are saved automatically 800 ms after you stop typing. You never need to press save manually.
              </p>

              <div className="autosave-status-card">
                <div className="autosave-status-card__row">
                  <span className="autosave-status-card__label">Current status</span>
                  <span className={`autosave-badge autosave-badge--${saveStatus}`}>
                    {saveStatus === 'idle'    && '● Idle'}
                    {saveStatus === 'pending' && '● Unsaved changes'}
                    {saveStatus === 'saving'  && '⟳ Saving…'}
                    {saveStatus === 'saved'   && '✓ Saved'}
                    {saveStatus === 'error'   && '✕ Save failed'}
                  </span>
                </div>
                {lastSavedAt && (
                  <div className="autosave-status-card__row">
                    <span className="autosave-status-card__label">Last saved</span>
                    <span className="autosave-status-card__value">
                      {lastSavedAt.toLocaleString(undefined, {
                        month: 'short', day: 'numeric',
                        hour: '2-digit', minute: '2-digit', second: '2-digit'
                      })}
                    </span>
                  </div>
                )}
                <div className="autosave-status-card__row">
                  <span className="autosave-status-card__label">Saving to</span>
                  <span className="autosave-status-card__value autosave-status-card__value--mono">
                    {notesFilePath || '—'}
                  </span>
                </div>
                <div className="autosave-status-card__row">
                  <span className="autosave-status-card__label">Debounce</span>
                  <span className="autosave-status-card__value">800 ms after last change</span>
                </div>
              </div>
            </section>
          )}

          {/* ── Templates ── */}
          {tab === 'Templates' && (
            <section className="settings-section">
              <h3 className="settings-section__title">Day Plan Templates</h3>
              <p className="settings-section__desc">
                Templates are stored as JSON files in <code>templates/</code>. Built-in templates cannot be deleted. Duplicate one to create a custom version.
              </p>
              {templatesPath && (
                <FolderRow
                  label="templates/"
                  filePath={templatesPath}
                  onOpen={() => window.electronAPI?.system.openPath(templatesPath)}
                />
              )}
              <TemplateManager />
            </section>
          )}

          {/* ── Themes ── */}
          {tab === 'Themes' && (
            <section className="settings-section">
              <h3 className="settings-section__title">Appearance Themes</h3>
              <p className="settings-section__desc">
                Themes are stored as JSON files in <code>themes/</code>. Select a theme to apply it instantly.
              </p>
              {themesPath && (
                <FolderRow
                  label="themes/"
                  filePath={themesPath}
                  onOpen={() => window.electronAPI?.system.openPath(themesPath)}
                />
              )}
              <ThemePicker />
            </section>
          )}

        </div>
      </div>
    </div>
  )
}
