# NoteTaker — Feature Reference

## Note Types

### Notes
Plain rich-text notes backed by a full-featured editor.
- Bold, italic, underline, strikethrough, inline code
- Headings (H1–H3), blockquotes, horizontal rules
- Ordered and unordered lists
- Links and images
- Code blocks, tables, highlights
- Slash-command menu (`/`) to insert any block element inline
- Export to Markdown or plain text

### Todos
Task lists with per-item timers and a reminder system.
- Add, reorder, and check off items
- Per-item countdown timer (set duration, start / pause / reset)
- Reminder date-time picker — fires a native desktop notification when due
- Reminder resets automatically when the due date is changed

### Day Plans
Structured daily planners built from templates.
- Choose a template when creating a new plan (Productive Day, Deep Focus, or any custom template)
- Section types: free-text, top-3 priorities, habit checklist, time-block schedule
- Mood tracker (1–5 scale)
- Optional reminder

### Diagrams
Free-form drawing / whiteboard canvas.
- Backed by `diagramData` — stores raw canvas state
- Rendered via `DiagramEditor`

---

## Sidebar & File Explorer

### File Tree
- Unified folder + note tree — no separate flat list
- Root level shows folders and unfoldered notes side by side
- Folders can be nested arbitrarily deep (OS-style hierarchy)
- Each folder shows its children when expanded (default open)
- Empty state: "No files yet" placeholder

### Creating Items
- Root `+` button opens a dropdown: Note, Todo, Day Plan, Diagram, Folder
- Each folder has its own `+` dropdown with the same options plus "Subfolder"
- New-folder inline input appears directly in the tree; confirmed with Enter, cancelled with Escape
- Day Plan creation opens the Template Selector modal before inserting the note

### Folder Operations
- Rename: double-click folder name or click the ✎ button → inline input
- Delete: × button — cascades to all subfolders and nullifies `folderId` on contained notes
- Click folder name / icon to set it as the active folder filter

### Drag and Drop
- Every note row has a drag handle (⠿, appears on hover)
- Drag a note onto any folder to move it there
- Drag onto the root tree area to move it out of all folders
- Drop targets highlight with accent color; folders auto-expand when hovered
- No-op if dropped on the note's current location

### Filters & Search
- Search bar: real-time title filter across all visible notes
- Type tabs: All / Notes / Todos / Plans / Diagrams / Stars (favorites)
- Categories accordion: filter by color-coded category
- Notebooks accordion: filter by notebook
- Tags accordion: filter by tag

---

## Themes

- Light/dark mode toggle in the sidebar footer
- 6 built-in themes: Default Light, Default Dark, Midnight, Sepia, Nord, Forest
- Custom themes loadable from `themes.json` in the storage directory
- Theme Picker in Settings shows name, mode badge, and description
- Active theme tokens are applied as CSS custom properties on `:root`
- See [theme.md](theme.md) for the full token reference and how to create custom themes

---

## Templates (Day Plan)

- 2 built-in templates: Productive Day, Deep Focus
- Custom templates created and managed in Settings → Templates
- Template Selector modal shown when creating a new Day Plan
- Template Manager allows creating, editing (name / description / sections), and deleting custom templates
- See [template.md](template.md) for section types and JSON schema

---

## Properties Panel

Slide-out panel (toggle via toolbar or keyboard) for the active note.
- Title, type badge, created/updated timestamps
- Notebook assignment (dropdown)
- Category assignment (dropdown)
- Tag assignment (multi-select chips)
- Color picker for note accent color
- Pin / favorite toggles
- Due date picker
- Attachment list with add / remove / open actions
- Reminder picker (Todo and Day Plan only)

---

## Quick Open

- Keyboard shortcut: `Cmd/Ctrl + K`
- Fuzzy-search across all note titles
- Shows type icon and last-updated date
- Click or press Enter to open a note
- Escape to dismiss

---

## Settings

- **Storage location** — pick a custom folder; data is migrated automatically
- **Theme** — browse and apply built-in or custom themes
- **Templates** — create and manage Day Plan templates

---

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Cmd/Ctrl + K` | Open Quick Open search |
| `Escape` | Close Quick Open |
| `Cmd/Ctrl + \` | Toggle sidebar |

---

## Electron Integration

The app runs as a desktop app via Electron and also works in the browser (localStorage fallback).

- **Data persistence** — JSON file at `{userData}/notes/data.json` (Electron) or `localStorage` (browser)
- **Native notifications** — reminder alerts via `Notification` IPC channel
- **System theme detection** — follows OS light/dark preference
- **File attachments** — stored in `{storagePath}/attachments/{noteId}/`; opened with the system default app
- **Custom storage path** — user can relocate the data directory; files are moved automatically
- **Custom templates** — loaded from `{storagePath}/templates.json`
- **Custom themes** — loaded from `{storagePath}/themes.json`
- **Title bar** — `hiddenInset` style (macOS traffic lights inset into the window)

---

## Save System

- Auto-save on every data change with an 800 ms debounce
- Save indicator in the sidebar footer: idle → pending → saving → saved → idle
- "Saved" state fades out after 2.5 s

---

## Location Tag

- Each note records the user's timezone at creation time (e.g. `America/New_York`)
- Displayed as a readable city name in the sidebar footer

---

## Testing

123 tests across 12 files (Vitest + React Testing Library).

| File | What it covers |
|---|---|
| `noteFactory.test.ts` | All factory functions including `createFolder` and `folderId` params |
| `defaultThemes.test.ts` | `BUILT_IN_THEMES` — count, tokens, modes, IDs |
| `notesContext.test.tsx` | Folder CRUD, cascade delete, note folderId, reminder reset |
| `uiContext.test.tsx` | localStorage persistence, keyboard shortcuts |
| `useReminderChecker.test.tsx` | Notification firing, timer setup/cleanup |
| `fileExplorer.test.tsx` | Rendering, filters, interactions, folder creation |
| `categories.test.ts` | Built-in categories and color values |
| `storage.test.ts` | localStorage read/write fallback |
| `export.test.ts` | HTML → Markdown conversion |
| `location.test.ts` | Timezone utilities |
| `useCountdownTimer.test.ts` | Timer hook state machine |
| `useDebounce.test.ts` | Debounce hook |
