# Note Taker

A feature-rich, cross-platform desktop note-taking app built with **React**, **Vite**, and **Electron**. Supports rich text notes, todos with timers, structured day plans, and freehand diagrams — all saved locally to your machine.

---

## Features

### Note Types
- **Notes** — rich text documents with full formatting via TipTap
- **Todos** — task lists with per-item countdown timers
- **Day Plans** — structured daily planner with template-based sections
- **Diagrams** — freehand drawing canvas powered by Excalidraw

### Rich Text Editor
- Bold, italic, underline, strikethrough, text color, highlight
- Headings (H1–H3), bullet/ordered/task lists, blockquotes, code blocks
- Tables (drag-resizable columns, add/remove rows and columns)
- Images (URL or base64), hyperlinks, horizontal dividers
- Word count, character count, estimated reading time
- Slash command menu (`/`) for quick insertion of any block type

### Organization
- **Categories** — 8 built-in (Personal, Work, Study, Health, Finance, Travel, Ideas, Projects)
- **Tags** — colored, multi-tag per note, filterable in sidebar
- **Notebooks** — group notes, filterable in sidebar
- **Favorites** — star any note for quick access
- **Color labels** — 10 accent colors per note
- **Due dates** — with overdue / due-today badges

### Sidebar
- Type tabs: All / Notes / Todos / Plans / Diagrams / Favorites
- Category filter chips, tag and notebook filters
- Collapsible via `⌘\` or the `‹` button

### Day Plans
- Template-based structure with four section types: Text, Checklist, Priorities, Time Blocks
- Built-in templates: **Productive Day** and **Deep Focus**
- Create, edit, and delete custom templates via the Settings modal

### Diagrams
- Full Excalidraw canvas (shapes, arrows, freehand, text, images)
- Theme-aware (light/dark canvas), auto-saved with debounce

### Reminders
- Date-time reminders on todos and day plans
- Desktop notifications via Electron when the reminder fires

### Theming
- Light, Dark, System (follows OS preference)
- Six built-in themes: Default Light, Default Dark, Midnight, Sepia, Nord, Forest
- Persisted across sessions

### Quick Open
- `⌘K` — fuzzy search across all notes by title, keyboard navigable

### Export
- Download any note as **Markdown** (`.md`) or **HTML** (`.html`)

### Data & Storage
- Notes stored as a single JSON file via Electron IPC
- Storage location configurable and migratable from Settings
- Auto-save on every edit (debounced, 800 ms)
- Save indicator in the UI

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `⌘K` | Open Quick Open palette |
| `⌘\` | Toggle sidebar |
| `/` | Open slash command menu in editor |

---


## Getting Started

### Prerequisites
- Node.js 18+
- npm 9+

### Install dependencies
```bash
npm install
```

### Run in development
```bash
npm run dev
```
This starts the Vite dev server and Electron together.

### Run tests
```bash
npm test
```

### Build for production
```bash
# Current platform
npm run dist

# Specific platforms
npm run dist:mac
npm run dist:win
npm run dist:linux

# All platforms
npm run dist:all
```


## Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](./CONTRIBUTING.md) before opening an issue or pull request.

---

## License

MIT

---

Made by [@visheshpanchal](https://github.com/visheshpanchal)
