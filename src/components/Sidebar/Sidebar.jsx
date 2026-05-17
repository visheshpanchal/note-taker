import { useState } from 'react'
import { useNotes } from '../../contexts/NotesContext.jsx'
import { useUI } from '../../contexts/UIContext.jsx'
import { createNote, createTodo, createDiagram, createTag, createNotebook, createCategory } from '../../utils/noteFactory.js'
import { CATEGORY_COLORS } from '../../utils/categories.js'
import { formatLocation } from '../../utils/location.js'
import { ThemeToggle } from '../shared/ThemeToggle.jsx'
import { SaveIndicator } from '../shared/SaveIndicator.jsx'
import { SettingsModal } from '../Settings/SettingsModal.jsx'
import { TemplateSelector } from '../DayPlan/TemplateSelector.jsx'
import { NoteItem } from './NoteItem.jsx'
import './Sidebar.css'

const TYPE_TABS = [
  { key: 'all',       label: 'All',     icon: '◈' },
  { key: 'note',      label: 'Notes',   icon: '📄' },
  { key: 'todo',      label: 'Todos',   icon: '✅' },
  { key: 'dayplan',   label: 'Plans',   icon: '📅' },
  { key: 'diagram',   label: 'Diagrams',icon: '🎨' },
  { key: 'favorites', label: 'Stars',   icon: '⭐' },
]

/* ── New Category Form ──────────────────────────────── */
function NewCategoryForm({ onSave, onCancel }) {
  const [icon, setIcon] = useState('')
  const [label, setLabel] = useState('')
  const [color, setColor] = useState(CATEGORY_COLORS[0])

  function handleSubmit(e) {
    e.preventDefault()
    const trimLabel = label.trim()
    if (!trimLabel) return
    onSave(createCategory(trimLabel, icon.trim() || '📌', color))
  }

  return (
    <form className="cat-form" onSubmit={handleSubmit}>
      <div className="cat-form__row">
        <input
          className="cat-form__icon"
          value={icon}
          onChange={e => setIcon(e.target.value)}
          placeholder="📌"
          maxLength={4}
          title="Type any emoji as the icon"
        />
        <input
          className="cat-form__name"
          autoFocus
          value={label}
          onChange={e => setLabel(e.target.value)}
          placeholder="Category name…"
        />
      </div>
      <div className="cat-form__colors">
        {CATEGORY_COLORS.map(c => (
          <button
            key={c}
            type="button"
            className={`cat-form__color ${color === c ? 'cat-form__color--active' : ''}`}
            style={{ background: c }}
            onClick={() => setColor(c)}
          />
        ))}
      </div>
      <div className="cat-form__actions">
        <button type="button" className="cat-form__cancel" onClick={onCancel}>Cancel</button>
        <button type="submit" className="cat-form__save" disabled={!label.trim()}>
          Create
        </button>
      </div>
    </form>
  )
}

/* ── Edit Category Form ─────────────────────────────── */
function EditCategoryForm({ category, onSave, onCancel }) {
  const [icon, setIcon] = useState(category.icon)
  const [label, setLabel] = useState(category.label)
  const [color, setColor] = useState(category.color)

  function handleSubmit(e) {
    e.preventDefault()
    const trimLabel = label.trim()
    if (!trimLabel) return
    onSave({ label: trimLabel, icon: icon.trim() || '📌', color })
  }

  return (
    <form className="cat-form" onSubmit={handleSubmit}>
      <div className="cat-form__row">
        <input
          className="cat-form__icon"
          value={icon}
          onChange={e => setIcon(e.target.value)}
          placeholder="📌"
          maxLength={4}
        />
        <input
          className="cat-form__name"
          autoFocus
          value={label}
          onChange={e => setLabel(e.target.value)}
          placeholder="Category name…"
        />
      </div>
      <div className="cat-form__colors">
        {CATEGORY_COLORS.map(c => (
          <button
            key={c}
            type="button"
            className={`cat-form__color ${color === c ? 'cat-form__color--active' : ''}`}
            style={{ background: c }}
            onClick={() => setColor(c)}
          />
        ))}
      </div>
      <div className="cat-form__actions">
        <button type="button" className="cat-form__cancel" onClick={onCancel}>Cancel</button>
        <button type="submit" className="cat-form__save" disabled={!label.trim()}>Save</button>
      </div>
    </form>
  )
}

/* ── Main Sidebar ───────────────────────────────────── */
export function Sidebar() {
  const {
    notes, activeId, setActiveId, addNote, deleteNote, systemInfo,
    tags, addTag, deleteTag,
    notebooks, addNotebook, deleteNotebook,
    categories, addCategory, updateCategory, deleteCategory
  } = useNotes()
  const { sidebarOpen, setSidebarOpen } = useUI()

  const [search, setSearch] = useState('')
  const [showNewMenu, setShowNewMenu] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showTemplateSelector, setShowTemplateSelector] = useState(false)
  const [typeFilter, setTypeFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState(null)
  const [sortBy, setSortBy] = useState('updated')
  const [notebookFilter, setNotebookFilter] = useState(null)
  const [tagFilter, setTagFilter] = useState(null)

  const [newTagName, setNewTagName] = useState('')
  const [showNewTag, setShowNewTag] = useState(false)
  const [newNotebookName, setNewNotebookName] = useState('')
  const [showNewNotebook, setShowNewNotebook] = useState(false)

  const [nbExpanded, setNbExpanded] = useState(true)
  const [tagsExpanded, setTagsExpanded] = useState(true)
  const [catsExpanded, setCatsExpanded] = useState(true)
  const [showNewCat, setShowNewCat] = useState(false)
  const [editingCatId, setEditingCatId] = useState(null)

  let filtered = notes.filter(n => {
    if (search && !n.title.toLowerCase().includes(search.toLowerCase())) return false
    if (typeFilter === 'favorites') return n.isFavorite
    if (typeFilter !== 'all' && n.type !== typeFilter) return false
    if (categoryFilter && n.category !== categoryFilter) return false
    if (notebookFilter && n.notebookId !== notebookFilter) return false
    if (tagFilter && !(n.tagIds ?? []).includes(tagFilter)) return false
    return true
  })

  if (sortBy === 'updated') filtered = [...filtered].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
  else if (sortBy === 'created') filtered = [...filtered].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  else if (sortBy === 'title') filtered = [...filtered].sort((a, b) => a.title.localeCompare(b.title))

  const pinned   = filtered.filter(n => n.isPinned)
  const unpinned = filtered.filter(n => !n.isPinned)

  function handleNew(type) {
    if (type === 'dayplan') { setShowNewMenu(false); setShowTemplateSelector(true); return }
    if (type === 'todo')    { addNote(createTodo());    setShowNewMenu(false); return }
    if (type === 'diagram') { addNote(createDiagram()); setShowNewMenu(false); return }
    addNote(createNote())
    setShowNewMenu(false)
  }

  function handleAddTag(e) {
    e.preventDefault()
    if (!newTagName.trim()) return
    addTag(createTag(newTagName.trim()))
    setNewTagName('')
    setShowNewTag(false)
  }

  function handleAddNotebook(e) {
    e.preventDefault()
    if (!newNotebookName.trim()) return
    addNotebook(createNotebook(newNotebookName.trim()))
    setNewNotebookName('')
    setShowNewNotebook(false)
  }

  const location = systemInfo?.timezone ? formatLocation(systemInfo.timezone) : ''

  return (
    <aside className={`sidebar ${!sidebarOpen ? 'sidebar--closed' : ''}`}>
      {/* ── Header ── */}
      <div className="sidebar__header">
        <div className="sidebar__brand">
          <span className="sidebar__logo">📝</span>
          <span className="sidebar__title">NoteTaker</span>
        </div>
        <div className="sidebar__header-actions">
          <div className="sidebar__new-wrap">
            <button className="btn-new" onClick={() => setShowNewMenu(v => !v)}>
              <span className="btn-new__plus">+</span>
              <span>New</span>
            </button>
            {showNewMenu && (
              <div className="new-menu" onMouseLeave={() => setShowNewMenu(false)}>
                <button onClick={() => handleNew('note')}><span>📄</span>Note</button>
                <button onClick={() => handleNew('todo')}><span>✅</span>Todo</button>
                <button onClick={() => handleNew('dayplan')}><span>📅</span>Day Plan</button>
                <button onClick={() => handleNew('diagram')}><span>🎨</span>Diagram</button>
              </div>
            )}
          </div>
          <button className="sidebar__collapse-btn" onClick={() => setSidebarOpen(false)} title="Close sidebar (⌘\\)">‹</button>
        </div>
      </div>

      {/* ── Search ── */}
      <div className="sidebar__search">
        <span className="sidebar__search-icon">🔍</span>
        <input
          type="text"
          placeholder="Filter notes…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {search
          ? <button className="sidebar__search-clear" onClick={() => setSearch('')}>✕</button>
          : <kbd className="sidebar__search-kbd">⌘K</kbd>
        }
      </div>

      {/* ── Type tabs ── */}
      <div className="sidebar__type-tabs">
        {TYPE_TABS.map(t => (
          <button
            key={t.key}
            className={`type-tab ${typeFilter === t.key ? 'type-tab--active' : ''}`}
            onClick={() => setTypeFilter(t.key)}
            title={t.label}
          >
            <span className="type-tab__icon">{t.icon}</span>
            <span className="type-tab__label">{t.label}</span>
          </button>
        ))}
      </div>

      {/* ── Category filter chips ── */}
      <div className="sidebar__categories">
        <button
          className={`cat-chip ${!categoryFilter ? 'cat-chip--all' : ''}`}
          onClick={() => setCategoryFilter(null)}
        >All</button>
        {categories.map(c => (
          <button
            key={c.id}
            className={`cat-chip ${categoryFilter === c.id ? 'cat-chip--active' : ''}`}
            style={{ '--cat-color': c.color }}
            onClick={() => setCategoryFilter(categoryFilter === c.id ? null : c.id)}
            title={c.label}
          >
            <span>{c.icon}</span>
            <span className="cat-chip__label">{c.label}</span>
          </button>
        ))}
      </div>

      {/* ── Sort ── */}
      <div className="sidebar__sort-row">
        <span className="sidebar__count">{filtered.length} {filtered.length === 1 ? 'item' : 'items'}</span>
        <select className="sidebar__sort" value={sortBy} onChange={e => setSortBy(e.target.value)}>
          <option value="updated">Modified</option>
          <option value="created">Created</option>
          <option value="title">Title A–Z</option>
        </select>
      </div>

      {/* ── Note list ── */}
      <div className="sidebar__list">
        {pinned.length > 0 && <div className="sidebar__group-label">📌 Pinned</div>}
        {pinned.map(n => (
          <NoteItem key={n.id} note={n} active={n.id === activeId}
            onClick={() => setActiveId(n.id)} onDelete={() => deleteNote(n.id)} />
        ))}
        {unpinned.length > 0 && pinned.length > 0 && <div className="sidebar__group-label">All</div>}
        {unpinned.map(n => (
          <NoteItem key={n.id} note={n} active={n.id === activeId}
            onClick={() => setActiveId(n.id)} onDelete={() => deleteNote(n.id)} />
        ))}
        {filtered.length === 0 && (
          <div className="sidebar__empty">
            {search || categoryFilter || typeFilter !== 'all' ? 'No matches' : 'Nothing here yet'}
          </div>
        )}
      </div>

      {/* ── Categories management ── */}
      <div className="sidebar__accordion">
        <button className="sidebar__accordion-header" onClick={() => setCatsExpanded(v => !v)}>
          <span>Categories</span>
          <span className="sidebar__accordion-arrow">{catsExpanded ? '▾' : '▸'}</span>
          <button
            className="sidebar__accordion-add"
            onClick={e => { e.stopPropagation(); setShowNewCat(v => !v); setEditingCatId(null) }}
            title="New category"
          >+</button>
        </button>
        {catsExpanded && (
          <div className="sidebar__accordion-body">
            {showNewCat && (
              <NewCategoryForm
                onSave={cat => { addCategory(cat); setShowNewCat(false) }}
                onCancel={() => setShowNewCat(false)}
              />
            )}
            {categories.map(cat => (
              <div key={cat.id}>
                {editingCatId === cat.id ? (
                  <EditCategoryForm
                    category={cat}
                    onSave={patch => { updateCategory(cat.id, patch); setEditingCatId(null) }}
                    onCancel={() => setEditingCatId(null)}
                  />
                ) : (
                  <div className="sidebar__cat-row">
                    <button
                      className={`sidebar__cat-item ${categoryFilter === cat.id ? 'sidebar__cat-item--active' : ''}`}
                      style={{ '--cat-color': cat.color }}
                      onClick={() => setCategoryFilter(cat.id === categoryFilter ? null : cat.id)}
                    >
                      <span className="sidebar__cat-dot" style={{ background: cat.color }} />
                      <span className="sidebar__cat-icon">{cat.icon}</span>
                      <span className="sidebar__cat-label">{cat.label}</span>
                      {cat.isBuiltIn && <span className="sidebar__cat-builtin">built-in</span>}
                    </button>
                    {!cat.isBuiltIn && (
                      <div className="sidebar__cat-actions">
                        <button
                          className="sidebar__cat-edit-btn"
                          onClick={() => { setEditingCatId(cat.id); setShowNewCat(false) }}
                          title="Edit"
                        >✎</button>
                        <button
                          className="sidebar__del-btn"
                          onClick={() => { deleteCategory(cat.id); if (categoryFilter === cat.id) setCategoryFilter(null) }}
                          title="Delete"
                        >×</button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Notebooks ── */}
      <div className="sidebar__accordion">
        <button className="sidebar__accordion-header" onClick={() => setNbExpanded(v => !v)}>
          <span>Notebooks</span>
          <span className="sidebar__accordion-arrow">{nbExpanded ? '▾' : '▸'}</span>
          <button
            className="sidebar__accordion-add"
            onClick={e => { e.stopPropagation(); setShowNewNotebook(v => !v) }}
            title="New notebook"
          >+</button>
        </button>
        {nbExpanded && (
          <div className="sidebar__accordion-body">
            {showNewNotebook && (
              <form className="sidebar__inline-form" onSubmit={handleAddNotebook}>
                <input autoFocus placeholder="Notebook name…" value={newNotebookName}
                  onChange={e => setNewNotebookName(e.target.value)}
                  onBlur={() => { if (!newNotebookName.trim()) setShowNewNotebook(false) }} />
              </form>
            )}
            <button
              className={`sidebar__nb-item ${!notebookFilter ? 'sidebar__nb-item--active' : ''}`}
              onClick={() => setNotebookFilter(null)}
            >📁 All notebooks</button>
            {notebooks.map(nb => (
              <div key={nb.id} className="sidebar__nb-row">
                <button
                  className={`sidebar__nb-item ${notebookFilter === nb.id ? 'sidebar__nb-item--active' : ''}`}
                  onClick={() => setNotebookFilter(nb.id === notebookFilter ? null : nb.id)}
                >{nb.icon} {nb.name}</button>
                <button className="sidebar__del-btn" onClick={() => deleteNotebook(nb.id)}>×</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Tags ── */}
      <div className="sidebar__accordion">
        <button className="sidebar__accordion-header" onClick={() => setTagsExpanded(v => !v)}>
          <span>Tags</span>
          <span className="sidebar__accordion-arrow">{tagsExpanded ? '▾' : '▸'}</span>
          <button
            className="sidebar__accordion-add"
            onClick={e => { e.stopPropagation(); setShowNewTag(v => !v) }}
            title="New tag"
          >+</button>
        </button>
        {tagsExpanded && (
          <div className="sidebar__accordion-body">
            {showNewTag && (
              <form className="sidebar__inline-form" onSubmit={handleAddTag}>
                <input autoFocus placeholder="Tag name…" value={newTagName}
                  onChange={e => setNewTagName(e.target.value)}
                  onBlur={() => { if (!newTagName.trim()) setShowNewTag(false) }} />
              </form>
            )}
            <div className="sidebar__tags-wrap">
              {tags.map(tag => (
                <div key={tag.id} className="sidebar__tag-row">
                  <button
                    className={`sidebar__tag ${tagFilter === tag.id ? 'sidebar__tag--active' : ''}`}
                    style={{ '--tag-color': tag.color }}
                    onClick={() => setTagFilter(tag.id === tagFilter ? null : tag.id)}
                  >
                    <span className="sidebar__tag-dot" />
                    {tag.name}
                  </button>
                  <button className="sidebar__del-btn" onClick={() => { deleteTag(tag.id); if (tagFilter === tag.id) setTagFilter(null) }}>×</button>
                </div>
              ))}
              {tags.length === 0 && <span className="sidebar__empty-small">No tags yet</span>}
            </div>
          </div>
        )}
      </div>

      {/* ── Footer ── */}
      <div className="sidebar__footer">
        <div className="sidebar__footer-top">
          <SaveIndicator />
          {location && <span className="sidebar__location">📍 {location}</span>}
        </div>
        <div className="sidebar__footer-actions">
          <ThemeToggle />
          <button className="sidebar__icon-btn" onClick={() => setShowSettings(true)} title="Settings">⚙️</button>
        </div>
      </div>

      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
      {showTemplateSelector && <TemplateSelector onClose={() => setShowTemplateSelector(false)} />}
    </aside>
  )
}
