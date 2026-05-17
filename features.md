# Features

## Note Types
- **Notes** — rich text documents with full formatting support
- **Todos** — task lists with per-item countdown timers
- **Day Plans** — structured daily planner with multiple section types
- **Diagrams** — freehand drawing canvas powered by Excalidraw

---

## Rich Text Editor (TipTap v3)
- Bold, italic, underline, strikethrough
- Headings (H1, H2, H3)
- Bullet lists, ordered lists, task/checklist lists (nested supported)
- Blockquotes
- Code blocks (syntax highlighted)
- Tables (inserts as 3×3; add/delete rows and columns via toolbar ⊞ menu while inside the table; columns are drag-resizable)
- Images (embed by URL or base64)
- Horizontal dividers
- Text color and highlight (multicolor)
- Hyperlinks (auto-link + manual)
- Word count, character count, estimated reading time (footer)

---

## Slash Command Menu
Type `/` anywhere in the editor to open a command picker:
- Heading 1 / 2 / 3
- Bullet List
- Ordered List
- Task List
- Blockquote
- Code Block
- Table
- Divider
- Image
- Keyboard navigable (↑ ↓ Enter Escape), filterable by keyword

---

## Editor Toolbar
- Formatting buttons: Bold, Italic, Underline, Strikethrough
- Headings, lists, blockquote, code block
- Text color picker, highlight color picker
- Link insertion
- Table insertion
- Undo / Redo

---

## Properties Panel
Right-side drawer with per-note metadata:
- **Category** — assign from 8 predefined categories
- **Notebook** — assign to a notebook
- **Tags** — add / remove colored tags via inline picker
- **Due date** — date picker; shows overdue / due-today badges in editor header
- **Favorite** — star / unstar
- **Color label** — 10 swatches (None, Red, Orange, Yellow, Green, Teal, Blue, Purple, Pink, Gray)
- **Stats** — word count and reading time
- **Timestamps** — created at and last modified
- **Export** — download as Markdown or HTML

---

## Organization

### Categories
- 8 predefined categories: Personal, Work, Study, Health, Finance, Travel, Ideas, Projects
- Each has an icon and accent color
- Shown as colored pills in sidebar filter bar and as badges on note cards and in the editor header

### Tags
- Create, rename, delete colored tags
- Assign multiple tags per note
- Filter notes by tag in the sidebar

### Notebooks
- Create, rename, delete notebooks (with icon)
- Assign notes to notebooks
- Filter notes by notebook in the sidebar

---

## Sidebar
- Note list with card-style items (rounded, shadow, left color accent bar)
- **Type tabs:** All / Notes / Todos / Plans / Diagrams / Favorites (⭐)
- **Category filter chips:** horizontal scroll, colored border on active
- Search / filter by tag or notebook
- Create new note, todo, day plan, or diagram from sidebar
- Collapsible sidebar (persisted to localStorage)
  - Collapse via `⌘\` shortcut or `‹` button
  - Re-open via tab on the left edge

---

## Quick Open (`⌘K`)
- Fuzzy-search across all notes by title
- Keyboard navigable
- Opens the selected note instantly

---

## Day Plans
- Template-based structure
- Built-in templates + custom user-created templates
- Section types:
  - **Text** — freeform text
  - **Checklist** — checkbox items
  - **Priorities** — ranked priority list
  - **Time Blocks** — scheduled time slots

### Template Manager
- Create, edit, delete custom templates
- Manage from Settings modal

---

## Todos
- Add, complete, delete individual todo items
- Per-item countdown timers (set duration, start/pause/reset)

---

## Diagrams
- Full Excalidraw canvas (shapes, arrows, freehand, text, images)
- Auto-saved with 600 ms debounce
- Theme-aware (light / dark canvas)

---

## Reminders
- Set a date-time reminder on any note
- Reminder checker hook fires desktop notifications via Electron
- Shows sent / upcoming state on the reminder pill

---

## Attachments
- Attach files to notes
- Attachment list displayed below the editor

---

## Theming
- Light, Dark, System (follows OS preference)
- Toggle via header ThemeToggle button or Settings modal
- Theme persisted to localStorage

---

## Keyboard Shortcuts
| Shortcut | Action |
|----------|--------|
| `⌘K` | Open Quick Open palette |
| `⌘\` | Toggle sidebar |
| `/` | Open slash command menu in editor |

---

## Settings Modal
- **Storage location** — migrate notes JSON to a custom folder
- **Template manager** — create / edit / delete day plan templates
- **Theme picker** — Light / Dark / System

---

## Export
- Export any note as **Markdown** (`.md`)
- Export any note as **HTML** (`.html`)
- HTML-to-Markdown converter built-in

---

## Data & Storage
- Notes stored as JSON (local file via Electron IPC)
- Storage location configurable and migratable
- Auto-save on every edit (debounced)
- Save indicator in the UI

---

## Cross-Platform Build
- Electron + electron-builder
- Targets: macOS, Windows, Linux
- GitHub Actions CI matrix build for all platforms

---

## Location Tags
- Attach an IANA timezone string as a location tag to any note
- Displayed in the editor footer as a human-readable location
