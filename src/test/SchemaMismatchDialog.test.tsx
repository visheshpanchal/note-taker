import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SchemaMismatchDialog } from '../components/SchemaMismatch/SchemaMismatchDialog'
import type { SchemaMismatch } from '../utils/schemaValidation'

const LOCATION = '/Users/test/Documents/note-taker'

function renderDialog(mismatch: SchemaMismatch, overrides: Partial<{ onReplace: () => Promise<void>; onQuit: () => void }> = {}) {
  const onReplace = overrides.onReplace ?? vi.fn().mockResolvedValue(undefined)
  const onQuit = overrides.onQuit ?? vi.fn()
  render(
    <SchemaMismatchDialog
      mismatch={mismatch}
      location={LOCATION}
      onReplace={onReplace}
      onQuit={onQuit}
    />
  )
  return { onReplace, onQuit }
}

// ─── Rendering ─────────────────────────────────────────────────────────────────

describe('SchemaMismatchDialog — rendering', () => {
  it('renders the dialog title', () => {
    renderDialog({ kind: 'not_object' })
    expect(screen.getByText('Data Format Incompatible')).toBeInTheDocument()
  })

  it('renders the description text', () => {
    renderDialog({ kind: 'not_object' })
    expect(screen.getByText(/could not be loaded/i)).toBeInTheDocument()
  })

  it('renders the "What\'s wrong" section label', () => {
    renderDialog({ kind: 'not_object' })
    expect(screen.getByText(/what.s wrong/i)).toBeInTheDocument()
  })

  it('renders mismatch summary for not_object', () => {
    renderDialog({ kind: 'not_object' })
    expect(screen.getByTestId('mismatch-summary')).toHaveTextContent(/valid data object/i)
  })

  it('renders mismatch summary for missing_field', () => {
    renderDialog({ kind: 'missing_field', field: 'notes' })
    expect(screen.getByTestId('mismatch-summary')).toHaveTextContent('"notes"')
    expect(screen.getByTestId('mismatch-summary')).toHaveTextContent(/missing/i)
  })

  it('renders mismatch summary for wrong_type', () => {
    renderDialog({ kind: 'wrong_type', field: 'tags', expected: 'array', got: 'string' })
    const el = screen.getByTestId('mismatch-summary')
    expect(el).toHaveTextContent('"tags"')
    expect(el).toHaveTextContent('array')
    expect(el).toHaveTextContent('string')
  })

  it('renders mismatch summary for version_mismatch', () => {
    renderDialog({ kind: 'version_mismatch', found: 3, expected: 1 })
    const el = screen.getByTestId('mismatch-summary')
    expect(el).toHaveTextContent('3')
    expect(el).toHaveTextContent('1')
  })

  it('renders the file location section label', () => {
    renderDialog({ kind: 'not_object' })
    expect(screen.getByText(/file location/i)).toBeInTheDocument()
  })

  it('renders the provided location path', () => {
    renderDialog({ kind: 'not_object' })
    expect(screen.getByTestId('location-path')).toHaveTextContent(LOCATION)
  })

  it('renders the Open button', () => {
    renderDialog({ kind: 'not_object' })
    expect(screen.getByTestId('open-location-btn')).toBeInTheDocument()
  })

  it('renders the Replace button', () => {
    renderDialog({ kind: 'not_object' })
    expect(screen.getByTestId('replace-btn')).toBeInTheDocument()
  })

  it('renders the Quit/Close button', () => {
    renderDialog({ kind: 'not_object' })
    expect(screen.getByTestId('quit-btn')).toBeInTheDocument()
  })

  it('shows "Quit Application" when electronAPI is present', () => {
    vi.stubGlobal('window', { ...window, electronAPI: { system: { quit: vi.fn() } } })
    renderDialog({ kind: 'not_object' })
    expect(screen.getByTestId('quit-btn')).toHaveTextContent('Quit Application')
    vi.unstubAllGlobals()
  })

  it('shows "Close" when electronAPI is absent', () => {
    vi.stubGlobal('window', { ...window, electronAPI: undefined })
    renderDialog({ kind: 'not_object' })
    expect(screen.getByTestId('quit-btn')).toHaveTextContent('Close')
    vi.unstubAllGlobals()
  })

  it('renders a warning about data loss before replacing', () => {
    renderDialog({ kind: 'not_object' })
    expect(screen.getByText(/permanently erase/i)).toBeInTheDocument()
  })

  it('has the correct ARIA role', () => {
    renderDialog({ kind: 'not_object' })
    expect(screen.getByRole('alertdialog')).toBeInTheDocument()
  })
})

// ─── Interactions ──────────────────────────────────────────────────────────────

describe('SchemaMismatchDialog — interactions', () => {
  beforeEach(() => {
    vi.stubGlobal('window', { ...window, electronAPI: undefined })
  })
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('calls onReplace when Replace button is clicked', () => {
    const { onReplace } = renderDialog({ kind: 'not_object' })
    fireEvent.click(screen.getByTestId('replace-btn'))
    expect(onReplace).toHaveBeenCalledOnce()
  })

  it('calls onQuit when Quit/Close button is clicked', () => {
    const { onQuit } = renderDialog({ kind: 'not_object' })
    fireEvent.click(screen.getByTestId('quit-btn'))
    expect(onQuit).toHaveBeenCalledOnce()
  })

  it('calls openPath with the location when Open button is clicked', () => {
    const openPath = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('window', { ...window, electronAPI: { system: { openPath } } })
    renderDialog({ kind: 'not_object' })
    fireEvent.click(screen.getByTestId('open-location-btn'))
    expect(openPath).toHaveBeenCalledWith(LOCATION)
  })

  it('does not throw when Open is clicked without electronAPI', () => {
    renderDialog({ kind: 'not_object' })
    expect(() => fireEvent.click(screen.getByTestId('open-location-btn'))).not.toThrow()
  })
})
