import { useState } from 'react'
import type { Editor } from '@tiptap/react'
import './EditorToolbar.css'

const TEXT_COLORS = [
  '#000000', '#e03131', '#2f9e44', '#1971c2', '#f08c00',
  '#ae3ec9', '#0c8599', '#e8590c', '#ffffff', '#868e96'
]
const HIGHLIGHT_COLORS = [
  '#fff3bf', '#d3f9d8', '#d0ebff', '#f8d7da', '#e9ecef',
  '#f3d9fa', '#d1ecf1', '#ffd8a8', '#ffe8cc', '#fff0f6'
]

interface ToolBtnProps {
  onClick: () => void
  active?: boolean
  title?: string
  children: React.ReactNode
  disabled?: boolean
}

function ToolBtn({ onClick, active, title, children, disabled }: ToolBtnProps) {
  return (
    <button
      className={`toolbar-btn ${active ? 'toolbar-btn--active' : ''}`}
      onClick={onClick}
      title={title}
      disabled={disabled}
    >
      {children}
    </button>
  )
}

function Divider() { return <span className="toolbar-divider" /> }

interface ColorPickerProps {
  colors: string[]
  onSelect: (c: string) => void
  onClear: () => void
  clearLabel: string
}

function ColorPicker({ colors, onSelect, onClear, clearLabel }: ColorPickerProps) {
  return (
    <div className="toolbar-color-picker">
      <button className="toolbar-color-clear" onClick={onClear}>{clearLabel}</button>
      <div className="toolbar-color-swatches">
        {colors.map(c => (
          <button
            key={c}
            className="toolbar-color-swatch"
            style={{ background: c, border: c === '#ffffff' ? '1px solid var(--border)' : 'none' }}
            onClick={() => onSelect(c)}
          />
        ))}
      </div>
    </div>
  )
}

interface EditorToolbarProps {
  editor: Editor | null
}

export function EditorToolbar({ editor }: EditorToolbarProps) {
  const [showTextColor, setShowTextColor] = useState(false)
  const [showHighlight, setShowHighlight] = useState(false)
  const [showTableMenu, setShowTableMenu] = useState(false)

  if (!editor) return null

  function closeAll() { setShowTextColor(false); setShowHighlight(false); setShowTableMenu(false) }

  function promptLink() {
    const prev = editor.getAttributes('link').href ?? ''
    const url = window.prompt('Enter URL', prev)
    if (url === null) return
    if (!url) editor.chain().focus().unsetLink().run()
    else editor.chain().focus().setLink({ href: url }).run()
  }

  function promptImage() {
    const url = window.prompt('Image URL')
    if (url) editor.chain().focus().setImage({ src: url }).run()
  }

  const inTable = editor.isActive('table')
  const currentColor = editor.getAttributes('textStyle').color as string | undefined

  return (
    <div className="editor-toolbar">
      <ToolBtn onClick={() => editor.chain().focus().toggleBold().run()}
        active={editor.isActive('bold')} title="Bold (⌘B)"><b>B</b></ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().toggleItalic().run()}
        active={editor.isActive('italic')} title="Italic (⌘I)"><i>I</i></ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().toggleUnderline().run()}
        active={editor.isActive('underline')} title="Underline (⌘U)"><u>U</u></ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().toggleStrike().run()}
        active={editor.isActive('strike')} title="Strikethrough"><s>S</s></ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().toggleCode().run()}
        active={editor.isActive('code')} title="Inline code"><code>`c`</code></ToolBtn>

      <div className="toolbar-popover-wrap">
        <ToolBtn
          onClick={() => { setShowTextColor(v => !v); setShowHighlight(false); setShowTableMenu(false) }}
          active={showTextColor}
          title="Text color"
        >
          <span className="toolbar-color-indicator" style={{ borderBottomColor: currentColor ?? 'currentColor' }}>A</span>
        </ToolBtn>
        {showTextColor && (
          <ColorPicker
            colors={TEXT_COLORS}
            onSelect={c => { editor.chain().focus().setColor(c).run(); closeAll() }}
            onClear={() => { editor.chain().focus().unsetColor().run(); closeAll() }}
            clearLabel="Default"
          />
        )}
      </div>

      <div className="toolbar-popover-wrap">
        <ToolBtn
          onClick={() => { setShowHighlight(v => !v); setShowTextColor(false); setShowTableMenu(false) }}
          active={showHighlight || editor.isActive('highlight')}
          title="Highlight"
        >
          <span className="toolbar-hl-indicator">H</span>
        </ToolBtn>
        {showHighlight && (
          <ColorPicker
            colors={HIGHLIGHT_COLORS}
            onSelect={c => { editor.chain().focus().setHighlight({ color: c }).run(); closeAll() }}
            onClear={() => { editor.chain().focus().unsetHighlight().run(); closeAll() }}
            clearLabel="None"
          />
        )}
      </div>

      <Divider />

      <ToolBtn onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        active={editor.isActive('heading', { level: 1 })} title="Heading 1">H1</ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        active={editor.isActive('heading', { level: 2 })} title="Heading 2">H2</ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        active={editor.isActive('heading', { level: 3 })} title="Heading 3">H3</ToolBtn>

      <Divider />

      <ToolBtn onClick={() => editor.chain().focus().toggleBulletList().run()}
        active={editor.isActive('bulletList')} title="Bullet list">•—</ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().toggleOrderedList().run()}
        active={editor.isActive('orderedList')} title="Ordered list">1.</ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().toggleTaskList().run()}
        active={editor.isActive('taskList')} title="Task list">☑</ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().toggleBlockquote().run()}
        active={editor.isActive('blockquote')} title="Blockquote">"</ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        active={editor.isActive('codeBlock')} title="Code block">{`</>`}</ToolBtn>

      <Divider />

      <ToolBtn onClick={promptLink} active={editor.isActive('link')} title="Link">🔗</ToolBtn>
      <ToolBtn onClick={promptImage} title="Insert image">🖼</ToolBtn>

      <div className="toolbar-popover-wrap">
        <ToolBtn
          onClick={() => { setShowTableMenu(v => !v); setShowTextColor(false); setShowHighlight(false) }}
          active={showTableMenu || inTable}
          title="Table"
        >⊞</ToolBtn>
        {showTableMenu && (
          <div className="toolbar-table-menu">
            {!inTable ? (
              <button onClick={() => { editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(); closeAll() }}>
                Insert 3×3 table
              </button>
            ) : (<>
              <button onClick={() => { editor.chain().focus().addColumnAfter().run(); closeAll() }}>Add column →</button>
              <button onClick={() => { editor.chain().focus().addRowAfter().run(); closeAll() }}>Add row ↓</button>
              <button onClick={() => { editor.chain().focus().deleteColumn().run(); closeAll() }}>Delete column</button>
              <button onClick={() => { editor.chain().focus().deleteRow().run(); closeAll() }}>Delete row</button>
              <button onClick={() => { editor.chain().focus().deleteTable().run(); closeAll() }}>Delete table</button>
            </>)}
          </div>
        )}
      </div>

      <Divider />

      <ToolBtn onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()} title="Undo (⌘Z)">↩</ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()} title="Redo (⌘⇧Z)">↪</ToolBtn>
    </div>
  )
}
