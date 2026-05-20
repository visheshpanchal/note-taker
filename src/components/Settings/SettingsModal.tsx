import { useState, useEffect, useCallback } from 'react'
import { useNotes } from '../../contexts/NotesContext'
import { TemplateManager } from '../DayPlan/TemplateManager'
import { ThemePicker } from './ThemePicker'
import './SettingsModal.css'

const TABS = ['Storage', 'Autosave', 'Templates', 'Themes'] as const
type Tab = typeof TABS[number]

interface FolderRowProps {
  label: string
  filePath: string
  onOpen: () => void
  highlight?: boolean
}

function FolderRow({ label, filePath, onOpen, highlight }: FolderRowProps) {
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

interface SettingsModalProps {
  onClose: () => void
}

export function SettingsModal({ onClose }: SettingsModalProps) {
  const { settings, systemInfo, saveStatus, lastSavedAt, moveStoragePath } = useNotes()
  const [tab, setTab] = useState<Tab>('Storage')
  const [moveStatus, setMoveStatus] = useState<'moving' | 'success' | 'error' | null>(null)
  const [errorMsg, setErrorMsg] = useState('')

  const currentPath   = settings.storageLocation || systemInfo?.storagePath || ''
  const notesFilePath = systemInfo?.notesFilePath || (currentPath ? `${currentPath}/notes.json` : '')
  const defaultPath   = systemInfo?.storagePath || ''
  const isDefault     = !settings.storageLocation || settings.storageLocation === defaultPath

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

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
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

          {tab === 'Storage' && (
            <section className="settings-section">
              <FolderRow
                label="Storage Location"
                filePath={currentPath}
                onOpen={() => window.electronAPI?.system.openPath(currentPath)}
                highlight
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
            </section>
          )}

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

          {tab === 'Templates' && (
            <section className="settings-section">
              <h3 className="settings-section__title">Day Plan Templates</h3>
              <p className="settings-section__desc">
                Built-in templates cannot be deleted. Duplicate one to create a custom version.
              </p>
              <TemplateManager />
            </section>
          )}

          {tab === 'Themes' && (
            <section className="settings-section">
              <h3 className="settings-section__title">Appearance Themes</h3>
              <ThemePicker />
            </section>
          )}

        </div>
      </div>
    </div>
  )
}
