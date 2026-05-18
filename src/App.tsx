import { useEffect } from 'react'
import { useNotes } from './contexts/NotesContext'
import { useUI } from './contexts/UIContext'
import { useReminderChecker } from './hooks/useReminderChecker'
import { Sidebar } from './components/Sidebar/Sidebar'
import { NoteEditor } from './components/Editor/NoteEditor'
import { TodoEditor } from './components/Todo/TodoEditor'
import { DayPlanEditor } from './components/DayPlan/DayPlanEditor'
import { DiagramEditor } from './components/Diagram/DiagramEditor'
import { PropertiesPanel } from './components/Properties/PropertiesPanel'
import { QuickOpen } from './components/Search/QuickOpen'
import { SchemaMismatchDialog } from './components/SchemaMismatch/SchemaMismatchDialog'
import type { Note, Todo, DayPlan, Diagram, AnyNote } from './types'
import './App.css'

function MainContent() {
  const { activeNote, loading } = useNotes()
  const { showProperties, sidebarOpen, setSidebarOpen } = useUI()

  const collapseTab = !sidebarOpen && (
    <button className="sidebar-tab" onClick={() => setSidebarOpen(true)} title="Open sidebar (⌘\\)">›</button>
  )

  if (loading) {
    return (
      <div className="main-content main-content--loading">
        {collapseTab}
        <div className="loading-spinner" />
      </div>
    )
  }

  if (!activeNote) {
    return (
      <div className="main-content main-content--empty">
        {collapseTab}
        <div className="empty-state">
          <div className="empty-state__icon">📝</div>
          <h2>Select or create a note</h2>
          <p>Choose from the sidebar or click <strong>+ New</strong> to get started.</p>
          <p className="empty-state__hint">Press <kbd>⌘K</kbd> to quickly jump to any note.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="main-content">
      {collapseTab}
      <div className="main-content__editor">
        {activeNote.type === 'note'    && <NoteEditor    note={activeNote as Note}    key={activeNote.id} />}
        {activeNote.type === 'todo'    && <TodoEditor    note={activeNote as Todo}    key={activeNote.id} />}
        {activeNote.type === 'dayplan' && <DayPlanEditor note={activeNote as DayPlan} key={activeNote.id} />}
        {activeNote.type === 'diagram' && <DiagramEditor note={activeNote as Diagram} key={activeNote.id} />}
      </div>
      {showProperties && (
        <PropertiesPanel note={activeNote as AnyNote} />
      )}
    </div>
  )
}

export default function App() {
  const { showQuickOpen, setShowQuickOpen } = useUI()
  const { setActiveId, schemaMismatch, replaceMismatchedData, systemInfo, loading } = useNotes()

  useReminderChecker()

  useEffect(() => {
    if (!window.electronAPI?.onNoteFocus) return
    const cleanup = window.electronAPI.onNoteFocus((noteId) => setActiveId(noteId))
    return cleanup
  }, [setActiveId])

  function handleQuit() {
    if (window.electronAPI?.system.quit) {
      window.electronAPI.system.quit()
    } else {
      window.close()
    }
  }

  const mismatchLocation = systemInfo?.notesFilePath ?? systemInfo?.storagePath ?? ''

  return (
    <div className="app">
      <Sidebar />
      <MainContent />
      {showQuickOpen && <QuickOpen onClose={() => setShowQuickOpen(false)} />}
      {!loading && schemaMismatch && (
        <SchemaMismatchDialog
          mismatch={schemaMismatch}
          location={mismatchLocation}
          onReplace={replaceMismatchedData}
          onQuit={handleQuit}
        />
      )}
    </div>
  )
}
