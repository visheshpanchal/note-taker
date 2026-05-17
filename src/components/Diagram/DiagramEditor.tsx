import { useRef, useMemo, useCallback } from 'react'
import { Excalidraw, THEME } from '@excalidraw/excalidraw'
import '@excalidraw/excalidraw/index.css'
import { useNotes } from '../../contexts/NotesContext'
import { useTheme } from '../../contexts/ThemeContext'
import { getCategoryById } from '../../utils/categories'
import type { Diagram } from '../../types'
import './DiagramEditor.css'

interface DiagramEditorProps {
  note: Diagram
}

export function DiagramEditor({ note }: DiagramEditorProps) {
  const { updateNote, categories } = useNotes()
  const { resolved } = useTheme()
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const category = getCategoryById(note.category, categories)

  const initialData = useMemo(() => {
    if (!note.diagramData) return { elements: [], appState: { viewBackgroundColor: 'transparent' } }
    try {
      return typeof note.diagramData === 'string'
        ? JSON.parse(note.diagramData as unknown as string)
        : note.diagramData
    } catch {
      return { elements: [], appState: { viewBackgroundColor: 'transparent' } }
    }
  }, []) // intentionally only on mount

  const handleChange = useCallback((elements: readonly unknown[], appState: Record<string, unknown>, files: unknown) => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      const { collaborators: _c, ...cleanState } = appState as { collaborators?: unknown; [key: string]: unknown }
      const activeElements = (elements as Array<{ isDeleted?: boolean }>).filter(el => !el.isDeleted)
      updateNote(note.id, {
        diagramData: { elements: activeElements, appState: cleanState, files }
      })
    }, 600)
  }, [note.id, updateNote])

  const excalidrawTheme = resolved === 'dark' ? THEME.DARK : THEME.LIGHT

  return (
    <div className="diagram-editor">
      <div className="diagram-editor__header">
        {(note.color || category?.color) && (
          <div className="diagram-editor__color-strip" style={{ background: note.color ?? category!.color }} />
        )}
        <div className="diagram-editor__header-inner">
          <input
            className="diagram-editor__title"
            value={note.title}
            onChange={e => updateNote(note.id, { title: e.target.value })}
            placeholder="Untitled Diagram"
          />
          <div className="diagram-editor__meta">
            <select
              className={`diagram-editor__cat-select ${category ? 'diagram-editor__cat-select--set' : ''}`}
              style={category ? { '--cat': category.color } as React.CSSProperties : undefined}
              value={note.category || ''}
              onChange={e => updateNote(note.id, { category: e.target.value || null })}
            >
              <option value="">No category</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.icon} {c.label}</option>
              ))}
            </select>
            <span className="diagram-editor__hint">🎨 Draw freely · changes auto-saved</span>
          </div>
        </div>
      </div>

      <div className="diagram-editor__canvas">
        <Excalidraw
          initialData={initialData}
          onChange={handleChange as unknown as Parameters<typeof Excalidraw>[0]['onChange']}
          theme={excalidrawTheme}
          UIOptions={{
            canvasActions: {
              saveToActiveFile: false,
              loadScene: false,
              export: false,
              toggleTheme: false,
            }
          }}
        />
      </div>
    </div>
  )
}
