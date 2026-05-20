# Release Notes

---

## v1.1.0 — Folder Structure, Drag & Drop, Electron, Tests
`da61d44` · 17 May 2026

### New Features

**Obsidian-style File Explorer**
- Replaced the flat note list with a unified folder + note tree in the sidebar
- Folders can be nested arbitrarily deep — same as an OS file system
- Create notes, todos, day plans, and diagrams directly inside any folder or at root level via a `+` dropdown
- Folders support rename (double-click or ✎), delete (cascades to all subfolders and unfolders contained notes), and expand/collapse

**Drag and Drop**
- Every note row now has a drag handle (⠿) that appears on hover
- Drag a note onto any folder to move it there; drag onto the root area to remove it from all folders
- Drop targets highlight with the accent colour; folders auto-expand when a note is held over them

**Electron Desktop App**
- Added `electron/main.cjs` — BrowserWindow, all IPC handlers (data, system, templates, themes, notifications, attachments)
- Added `electron/preload.cjs` — exposes `window.electronAPI` via `contextBridge`
- Added `scripts/build.js` — electron-builder config targeting macOS (dmg arm64+x64), Windows (NSIS), Linux (AppImage)
- Native desktop notifications for reminders; clicking a notification focuses the relevant note
- Default storage at `{userData}/notes/`; user can relocate via Settings with automatic file migration

**JSON Schemas**
- `schemas/theme.json` — JSON Schema Draft-07 for custom theme objects (28 CSS token definitions)
- `schemas/template.json` — JSON Schema Draft-07 for Day Plan templates (section types, config constraints)

### Improvements
- `createDayPlan`, `createNote`, `createTodo`, `createDiagram` all accept a `folderId` parameter
- `UIContext` keyboard handler for `Cmd/Ctrl+\` fixed — was using a stale closure, sidebar toggle now works on every press

### Tests Added
- `noteFactory.test.ts` — `createFolder` and `folderId` parameter coverage
- `defaultThemes.test.ts` — validates all 6 built-in themes and their token sets
- `notesContext.test.tsx` — folder CRUD, cascade delete, note folderId, reminder reset
- `uiContext.test.tsx` — localStorage persistence, all keyboard shortcuts
- `useReminderChecker.test.tsx` — notification firing, interval setup, unmount cleanup
- `fileExplorer.test.tsx` — rendering, filters, click interactions, folder creation

**Total: 123 tests across 12 files**

---

## v1.0.1 — Docs & Schema Versioning
`afe9783` · 17 May 2026

### Documentation
- `docs/features.md` — full feature catalogue (note types, file explorer, themes, templates, properties, shortcuts, Electron integration, save system, test suite)
- `docs/theme.md` — complete theme authoring guide with all 28 CSS token definitions and custom theme JSON example
- `docs/template.md` — complete template authoring guide with all 4 section types, built-in template layouts, and custom template JSON example
- `docs/build.md` — platform-specific build guide for macOS, Windows, and Linux including prerequisites, signing, cross-compilation, and troubleshooting

### Schema Versioning
- Added `schemaVersion` field (integer, optional, default `1`) to both `schemas/theme.json` and `schemas/template.json`
- Updated schema `$id` values to include the version: `notetaker/theme/v1`, `notetaker/template/v1`
- All schema examples updated to include `"schemaVersion": 1`
- Versioning section added to `docs/theme.md` and `docs/template.md` — explains the upgrade contract, the changelog table, and contributor steps for bumping versions
