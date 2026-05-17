import { useState, useEffect, useRef } from 'react'
import type { Editor } from '@tiptap/react'
import './SlashMenu.css'

interface SlashCommand {
  id: string
  label: string
  icon: string
  desc: string
  keywords: string[]
}

export const SLASH_COMMANDS: SlashCommand[] = [
  { id: 'h1',      label: 'Heading 1',    icon: 'H1',   desc: 'Large section heading',   keywords: ['h1','heading','title'] },
  { id: 'h2',      label: 'Heading 2',    icon: 'H2',   desc: 'Medium section heading',  keywords: ['h2','heading'] },
  { id: 'h3',      label: 'Heading 3',    icon: 'H3',   desc: 'Small section heading',   keywords: ['h3','heading'] },
  { id: 'bullet',  label: 'Bullet List',  icon: '•',    desc: 'Unordered list',          keywords: ['bullet','list','ul'] },
  { id: 'ordered', label: 'Ordered List', icon: '1.',   desc: 'Numbered list',           keywords: ['ordered','number','ol'] },
  { id: 'task',    label: 'Task List',    icon: '☐',    desc: 'Checkable items',         keywords: ['task','todo','check'] },
  { id: 'quote',   label: 'Blockquote',   icon: '"',    desc: 'Block quotation',         keywords: ['quote','blockquote'] },
  { id: 'code',    label: 'Code Block',   icon: '</>',  desc: 'Syntax-highlighted code', keywords: ['code','pre'] },
  { id: 'table',   label: 'Table',        icon: '⊞',    desc: 'Insert a 3×3 table',     keywords: ['table','grid'] },
  { id: 'divider', label: 'Divider',      icon: '—',    desc: 'Horizontal rule',         keywords: ['divider','hr','rule'] },
  { id: 'image',   label: 'Image',        icon: '🖼',   desc: 'Embed image by URL',      keywords: ['image','img','photo'] },
]

export function applySlashCommand(id: string, editor: Editor, range: { from: number; to: number }) {
  const chain = editor.chain().focus().deleteRange(range)
  switch (id) {
    case 'h1':      chain.setNode('heading', { level: 1 }).run(); break
    case 'h2':      chain.setNode('heading', { level: 2 }).run(); break
    case 'h3':      chain.setNode('heading', { level: 3 }).run(); break
    case 'bullet':  chain.toggleBulletList().run(); break
    case 'ordered': chain.toggleOrderedList().run(); break
    case 'task':    chain.toggleTaskList().run(); break
    case 'quote':   chain.toggleBlockquote().run(); break
    case 'code':    chain.toggleCodeBlock().run(); break
    case 'divider': chain.setHorizontalRule().run(); break
    case 'table':   chain.insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(); break
    case 'image': {
      const url = window.prompt('Image URL:')
      if (url) chain.setImage({ src: url }).run()
      else editor.chain().focus().deleteRange(range).run()
      break
    }
    default: editor.chain().focus().deleteRange(range).run()
  }
}

interface SlashMenuProps {
  pos: { x: number; y: number }
  query: string
  onSelect: (id: string) => void
  onClose: () => void
}

export function SlashMenu({ pos, query, onSelect, onClose }: SlashMenuProps) {
  const [cursor, setCursor] = useState(0)
  const listRef = useRef<HTMLDivElement>(null)

  const filtered = SLASH_COMMANDS.filter(c => {
    const q = query.toLowerCase()
    return !q || c.label.toLowerCase().includes(q) || c.keywords.some(k => k.includes(q))
  })

  useEffect(() => { setCursor(0) }, [query])

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setCursor(c => Math.min(c + 1, filtered.length - 1)) }
      else if (e.key === 'ArrowUp') { e.preventDefault(); setCursor(c => Math.max(c - 1, 0)) }
      else if (e.key === 'Enter') { e.preventDefault(); if (filtered[cursor]) onSelect(filtered[cursor].id) }
      else if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler, true)
    return () => document.removeEventListener('keydown', handler, true)
  }, [cursor, filtered, onSelect, onClose])

  useEffect(() => {
    (listRef.current?.children[cursor] as HTMLElement)?.scrollIntoView({ block: 'nearest' })
  }, [cursor])

  if (!filtered.length) return null

  return (
    <div className="slash-menu" style={{ left: pos.x, top: pos.y }}>
      <div className="slash-menu__header">Turn into</div>
      <div className="slash-menu__list" ref={listRef}>
        {filtered.map((cmd, i) => (
          <button
            key={cmd.id}
            className={`slash-item ${i === cursor ? 'slash-item--active' : ''}`}
            onMouseEnter={() => setCursor(i)}
            onClick={() => onSelect(cmd.id)}
          >
            <span className="slash-item__icon">{cmd.icon}</span>
            <span className="slash-item__body">
              <span className="slash-item__label">{cmd.label}</span>
              <span className="slash-item__desc">{cmd.desc}</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
