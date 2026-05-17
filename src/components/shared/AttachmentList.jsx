import { useState, useRef } from 'react'
import './AttachmentList.css'

const IMAGE_TYPES = new Set(['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/svg+xml'])

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function fileIcon(mimeType) {
  if (mimeType?.startsWith('image/')) return '🖼'
  if (mimeType === 'application/pdf') return '📄'
  if (mimeType?.startsWith('video/')) return '🎬'
  if (mimeType?.startsWith('audio/')) return '🎵'
  if (mimeType?.startsWith('text/')) return '📝'
  return '📎'
}

export function AttachmentList({ note, updateNote }) {
  const [dragging, setDragging] = useState(false)
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState(null)
  const dropRef = useRef(null)

  const attachments = note.attachments || []
  const hasElectronAPI = !!window.electronAPI?.attachments

  async function addFiles(filePaths) {
    if (!filePaths.length) return
    setAdding(true)
    setError(null)
    try {
      const result = await window.electronAPI.attachments.add(note.id, filePaths)
      if (result.success && result.added.length) {
        updateNote(note.id, { attachments: [...attachments, ...result.added] })
      } else if (!result.added?.length) {
        setError('Could not attach file. The file may be too large (100 MB limit) or inaccessible.')
      }
    } catch (e) {
      setError('Failed to attach file: ' + (e?.message || 'unknown error'))
    } finally {
      setAdding(false)
    }
  }

  async function handlePickFiles() {
    if (!hasElectronAPI) {
      setError('Attachments are only available in the desktop app.')
      return
    }
    try {
      const paths = await window.electronAPI.attachments.pickFiles()
      if (paths.length) addFiles(paths)
    } catch (e) {
      setError('Could not open file picker: ' + (e?.message || 'unknown error'))
    }
  }

  async function handleRemove(att) {
    await window.electronAPI.attachments.remove(note.id, att.filename)
    updateNote(note.id, { attachments: attachments.filter(a => a.id !== att.id) })
  }

  function handleOpen(att) {
    window.electronAPI.attachments.open(note.id, att.filename)
  }

  function handleDragOver(e) {
    e.preventDefault()
    setDragging(true)
  }

  function handleDragLeave(e) {
    if (!dropRef.current?.contains(e.relatedTarget)) setDragging(false)
  }

  function handleDrop(e) {
    e.preventDefault()
    setDragging(false)
    if (!hasElectronAPI) {
      setError('Attachments are only available in the desktop app.')
      return
    }
    const paths = Array.from(e.dataTransfer.files).map(f => f.path).filter(Boolean)
    if (paths.length) addFiles(paths)
  }

  return (
    <div className="attachment-list">
      <div className="attachment-list__header">
        <span className="attachment-list__label">📎 Attachments {attachments.length > 0 && `(${attachments.length})`}</span>
        <button
          className="attachment-list__add-btn"
          onClick={handlePickFiles}
          disabled={adding}
        >
          {adding ? '⏳' : '+ Add file'}
        </button>
      </div>

      {attachments.length > 0 && (
        <div className="attachment-list__items">
          {attachments.map(att => (
            <div key={att.id} className="attachment-card">
              {IMAGE_TYPES.has(att.mimeType) ? (
                <img
                  className="attachment-card__thumb"
                  src={`attachment://${note.id}/${encodeURIComponent(att.filename)}`}
                  alt={att.originalName}
                  onError={e => { e.currentTarget.style.display = 'none' }}
                />
              ) : (
                <span className="attachment-card__icon">{fileIcon(att.mimeType)}</span>
              )}
              <div className="attachment-card__info">
                <span className="attachment-card__name" title={att.originalName}>{att.originalName}</span>
                <span className="attachment-card__size">{formatSize(att.size)}</span>
              </div>
              <div className="attachment-card__actions">
                <button
                  className="attachment-card__open-btn"
                  onClick={() => handleOpen(att)}
                  title="Open"
                >↗</button>
                <button
                  className="attachment-card__del-btn"
                  onClick={() => handleRemove(att)}
                  title="Remove"
                >×</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="attachment-error" onClick={() => setError(null)}>
          ⚠ {error}
        </div>
      )}

      <div
        ref={dropRef}
        className={`attachment-dropzone ${dragging ? 'attachment-dropzone--active' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {dragging ? 'Drop to attach' : 'Drop files here'}
      </div>
    </div>
  )
}
