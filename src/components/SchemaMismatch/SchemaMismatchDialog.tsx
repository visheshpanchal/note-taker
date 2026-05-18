import type { SchemaMismatch } from '../../utils/schemaValidation'
import { mismatchSummary } from '../../utils/schemaValidation'
import './SchemaMismatchDialog.css'

interface Props {
  mismatch: SchemaMismatch
  location: string
  onReplace: () => Promise<void>
  onQuit: () => void
}

function FolderOpenIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M1.5 3.5h4l1.5 2H14.5v8H1.5V3.5z" />
      <path d="M1.5 8l1.5-2.5h11L15 10" />
    </svg>
  )
}

function WarningIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
    </svg>
  )
}

export function SchemaMismatchDialog({ mismatch, location, onReplace, onQuit }: Props) {
  function handleOpenLocation() {
    window.electronAPI?.system.openPath(location)
  }

  const isElectron = Boolean(window.electronAPI)

  return (
    <div className="smsd-overlay" role="alertdialog" aria-modal="true" aria-labelledby="smsd-title" aria-describedby="smsd-desc">
      <div className="smsd">
        <div className="smsd__stripe" />

        <div className="smsd__header">
          <div className="smsd__icon" aria-hidden="true">
            <WarningIcon />
          </div>
          <div className="smsd__titles">
            <h2 className="smsd__title" id="smsd-title">Data Format Incompatible</h2>
            <p className="smsd__subtitle" id="smsd-desc">
              The data file could not be loaded because its format is not compatible with this version of the app.
            </p>
          </div>
        </div>

        <div className="smsd__body">
          <div className="smsd__detail">
            <p className="smsd__detail-label">What&apos;s wrong</p>
            <p className="smsd__detail-value" data-testid="mismatch-summary">{mismatchSummary(mismatch)}</p>
          </div>

          <div className="smsd__location">
            <p className="smsd__location-label">File location</p>
            <div className="smsd__location-row">
              <span className="smsd__location-path" title={location} data-testid="location-path">{location}</span>
              <button
                className="smsd__open-btn"
                onClick={handleOpenLocation}
                data-testid="open-location-btn"
                title="Open folder in file manager"
              >
                <FolderOpenIcon />
                Open
              </button>
            </div>
          </div>

          <p className="smsd__warning-note">
            Replacing the data will permanently erase all notes stored at this location and start fresh.
          </p>
        </div>

        <div className="smsd__footer">
          <button
            className="smsd__btn smsd__btn--ghost"
            onClick={onQuit}
            data-testid="quit-btn"
          >
            {isElectron ? 'Quit Application' : 'Close'}
          </button>
          <button
            className="smsd__btn smsd__btn--danger"
            onClick={onReplace}
            data-testid="replace-btn"
          >
            Replace with New Data
          </button>
        </div>
      </div>
    </div>
  )
}
