import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Placeholder from '@tiptap/extension-placeholder'
import { Table, TableRow, TableCell, TableHeader } from '@tiptap/extension-table'
import Image from '@tiptap/extension-image'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import Color from '@tiptap/extension-color'
import { TextStyle } from '@tiptap/extension-text-style'
import Highlight from '@tiptap/extension-highlight'
import Link from '@tiptap/extension-link'
import CharacterCount from '@tiptap/extension-character-count'
import { useEffect, useCallback, useState } from 'react'
import { useNotes } from '../../contexts/NotesContext'
import { useUI } from '../../contexts/UIContext'
import { getCategoryById } from '../../utils/categories'
import { TagPill } from '../Tags/TagPill'
import { EditorToolbar } from './EditorToolbar'
import { SlashMenu, applySlashCommand } from './SlashMenu'
import { AttachmentList } from '../shared/AttachmentList'
import { formatLocation } from '../../utils/location'
import type { Note } from '../../types'
import type { Editor } from '@tiptap/react'
import './NoteEditor.css'

interface SlashState {
  x: number
  y: number
  query: string
  deleteFrom: number
  deleteTo: number
}

interface NoteEditorProps {
  note: Note
}

export function NoteEditor({ note }: NoteEditorProps) {
  const { updateNote, tags: allTags, categories } = useNotes()
  const { showProperties, setShowProperties } = useUI()
  const [slashState, setSlashState] = useState<SlashState | null>(null)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Placeholder.configure({ placeholder: 'Start writing… or type / for commands' }),
      Table.configure({ resizable: true }),
      TableRow, TableCell, TableHeader,
      Image.configure({ inline: false, allowBase64: true }),
      TaskList,
      TaskItem.configure({ nested: true }),
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      Link.configure({ openOnClick: false, autolink: true }),
      CharacterCount
    ],
    content: note.content || '',
    onUpdate: ({ editor }) => {
      updateNote(note.id, { content: editor.getHTML() })
      detectSlash(editor)
    }
  })

  const detectSlash = useCallback((ed: Editor) => {
    const { from } = ed.state.selection
    const text = ed.state.doc.textBetween(Math.max(0, from - 60), from, '\n', '\0')
    const match = text.match(/(?:^|\n)\/([\w ]*)$/)
    if (match) {
      try {
        const coords = ed.view.coordsAtPos(from - match[1].length)
        setSlashState({
          x: coords.left, y: coords.bottom + 6,
          query: match[1].trim(),
          deleteFrom: from - match[0].length,
          deleteTo: from
        })
      } catch { setSlashState(null) }
    } else {
      setSlashState(null)
    }
  }, [])

  useEffect(() => {
    if (editor && editor.getHTML() !== note.content) {
      editor.commands.setContent(note.content || '', { emitUpdate: false })
    }
  }, [note.id]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleSlashSelect(cmdId: string) {
    if (!editor || !slashState) return
    applySlashCommand(cmdId, editor, { from: slashState.deleteFrom, to: slashState.deleteTo })
    setSlashState(null)
  }

  const noteTags    = (note.tagIds ?? []).map(id => allTags.find(t => t.id === id)).filter((t): t is NonNullable<typeof t> => Boolean(t))
  const category    = getCategoryById(note.category, categories)
  const wordCount   = (editor?.storage?.characterCount as { words?: () => number } | undefined)?.words?.() ?? 0
  const charCount   = (editor?.storage?.characterCount as { characters?: () => number } | undefined)?.characters?.() ?? 0
  const readingTime = Math.max(1, Math.ceil(wordCount / 200))
  const isOverdue   = note.dueDate && new Date(note.dueDate) < new Date()
  const isDueToday  = note.dueDate === new Date().toISOString().split('T')[0]
  const location    = formatLocation(note.locationTag)

  return (
    <div className="note-editor">
      <div className="note-editor__header">
        {(note.color || category?.color) && (
          <div className="note-editor__color-strip" style={{ background: note.color ?? category!.color }} />
        )}

        <div className="note-editor__top-row">
          <input
            className="note-editor__title"
            value={note.title}
            onChange={e => updateNote(note.id, { title: e.target.value })}
            placeholder="Untitled"
          />
          <button
            className={`note-editor__prop-btn ${showProperties ? 'note-editor__prop-btn--active' : ''}`}
            onClick={() => setShowProperties(v => !v)}
            title="Properties"
          >ℹ</button>
        </div>

        <div className="note-editor__meta-row">
          <select
            className={`note-editor__cat-select ${category ? 'note-editor__cat-select--set' : ''}`}
            style={category ? { '--cat': category.color } as React.CSSProperties : undefined}
            value={note.category || ''}
            onChange={e => updateNote(note.id, { category: e.target.value || null })}
          >
            <option value="">No category</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.icon} {c.label}</option>
            ))}
          </select>

          {note.isFavorite && <span className="note-editor__fav">⭐</span>}

          {note.dueDate && (
            <span className={`note-editor__due ${isOverdue ? 'note-editor__due--overdue' : isDueToday ? 'note-editor__due--today' : ''}`}>
              🗓 {isOverdue ? 'Overdue: ' : isDueToday ? 'Due today' : 'Due: '}
              {!isDueToday && new Date(note.dueDate).toLocaleDateString()}
            </span>
          )}

          <div className="note-editor__tags">
            {noteTags.map(tag => <TagPill key={tag.id} tag={tag} small />)}
          </div>
        </div>
      </div>

      <EditorToolbar editor={editor} />

      <div className="note-editor__content-wrap">
        <EditorContent editor={editor} className="note-editor__content" />
      </div>

      <div className="note-editor__footer">
        {location && <span>📍 {location}</span>}
        <span>{wordCount} words · {charCount} chars · {readingTime} min read</span>
        <span className="note-editor__footer-sep" />
        <span>Updated {new Date(note.updatedAt).toLocaleString()}</span>
      </div>

      <div className="note-editor__attachments">
        <AttachmentList note={note} updateNote={updateNote} />
      </div>

      {slashState && (
        <SlashMenu
          pos={{ x: slashState.x, y: slashState.y }}
          query={slashState.query}
          onSelect={handleSlashSelect}
          onClose={() => setSlashState(null)}
        />
      )}
    </div>
  )
}
