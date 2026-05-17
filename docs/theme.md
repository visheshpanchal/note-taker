# Themes

Themes control the visual appearance of NoteTaker by overriding a set of CSS custom properties. Built-in themes ship with the app; custom themes are loaded from `themes.json` in the user's storage directory.

---

## Theme Object Structure

```json
{
  "schemaVersion": 1,
  "id": "ocean-dark",
  "name": "Ocean Dark",
  "mode": "dark",
  "isBuiltIn": false,
  "description": "Deep ocean blues with a teal accent.",
  "tokens": {
    "--bg-primary": "#0d1117",
    "--accent":     "#2ea0a0"
  }
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `schemaVersion` | `integer` | no (default `1`) | Version of the theme schema. Omitting it is equivalent to `1`. See [Versioning](#versioning) below. |
| `id` | `string` | yes | Unique kebab-case identifier. |
| `name` | `string` | yes | Display name shown in the Theme Picker. |
| `mode` | `"light"` \| `"dark"` | yes | Base mode. The app loads light or dark CSS defaults before applying `tokens`. |
| `isBuiltIn` | `boolean` | yes | `true` = ships with the app, cannot be deleted. |
| `description` | `string` | yes | One-sentence summary shown in the Theme Picker. |
| `tokens` | `object` | yes | Map of CSS custom property names → values. Only overrides need to be listed. |

---

## Built-in Themes

| ID | Name | Mode |
|---|---|---|
| `default-light` | Default Light | light |
| `default-dark` | Default Dark | dark |
| `midnight` | Midnight | dark |
| `sepia` | Sepia | light |
| `nord` | Nord | dark |
| `forest` | Forest | dark |

---

## CSS Token Reference

All tokens are optional — omit any token to inherit the mode default from `index.css`.

### Backgrounds

| Token | Default role |
|---|---|
| `--bg-primary` | Main canvas / editor background |
| `--bg-secondary` | Toolbar, footer, inner panels |
| `--bg-tertiary` | Code blocks, chip backgrounds, deeply nested items |
| `--bg-hover` | Background applied to interactive elements on hover |
| `--bg-sidebar` | Sidebar / file-explorer background |

### Text

| Token | Default role |
|---|---|
| `--text-primary` | Default body text |
| `--text-secondary` | Subdued text — note titles in list, metadata labels |
| `--text-muted` | Faint text — placeholders, timestamps, keyboard hints |

### Borders

| Token | Default role |
|---|---|
| `--border` | Default 1 px hairline border |
| `--border-strong` | Heavier border for emphasis or focus rings |

### Accent (brand / action color)

| Token | Default role |
|---|---|
| `--accent` | Buttons, links, active states |
| `--accent-hover` | Accent color on pointer hover |
| `--accent-fg` | Foreground painted on accent surfaces (usually white) |
| `--accent-soft` | Low-opacity tint for selection backgrounds and focus rings |

### Status colors

| Token | Default role |
|---|---|
| `--danger` | Destructive actions, error states |
| `--danger-hover` | Danger color on hover |
| `--success` | Positive / completed state |
| `--warning` | Warning / in-progress state |

### Shadows

| Token | Default role |
|---|---|
| `--shadow-xs` | Subtle lift — note cards at rest |
| `--shadow-sm` | Note cards on hover, dropdowns |
| `--shadow-md` | Modals, popovers |
| `--shadow-lg` | Full-screen overlays |

### Shape & Typography (optional overrides)

| Token | Default |
|---|---|
| `--radius-xs` | 4 px |
| `--radius-sm` | 7 px |
| `--radius-md` | 11 px |
| `--radius-lg` | 16 px |
| `--radius-xl` | 22 px |
| `--sidebar-width` | 272 px |
| `--transition` | `.15s ease` |
| `--font` | System sans-serif stack |
| `--font-mono` | System monospace stack |

---

## Creating a Custom Theme

1. Create or open `themes.json` in your storage directory (Settings → Storage Location).
2. The file must be an **array** of theme objects.
3. Add your theme object with `"isBuiltIn": false`.
4. Restart the app (or reload) — the theme will appear in Settings → Themes.

**Minimal example:**

```json
[
  {
    "schemaVersion": 1,
    "id": "rose-light",
    "name": "Rose Light",
    "mode": "light",
    "isBuiltIn": false,
    "description": "Warm rose tones with a clean white canvas.",
    "tokens": {
      "--bg-primary":   "#ffffff",
      "--bg-secondary": "#fff5f5",
      "--bg-sidebar":   "#fff1f2",
      "--text-primary": "#1c1917",
      "--accent":       "#e11d48",
      "--accent-hover": "#be123c",
      "--accent-fg":    "#ffffff",
      "--accent-soft":  "#e11d4815"
    }
  }
]
```

**Tips:**
- Always include `"schemaVersion": 1` so future migrations can identify the format.
- You only need to list the tokens you want to change — all others fall back to the mode defaults.
- Use `rgba()` or `color-mix()` values for `--accent-soft` to get the right transparency.
- Set `mode` correctly — the app pre-loads matching defaults (light vs dark backgrounds) before applying your tokens.
- Validate your file against `schemas/theme.json` (JSON Schema Draft-07) to catch errors early.

---

## Versioning

### How it works

Every theme object carries an optional integer `schemaVersion` field. The current version is **1**.

- If the field is **absent**, the app treats the object as version 1 (backwards compatibility for themes written before versioning was introduced).
- If the field is **present**, the app compares it to the version it understands and runs any required migrations before applying the theme.

### Schema ID

The JSON Schema file itself is versioned via its `$id`:

```
notetaker/theme/v1
```

When a new schema version is released a new file (e.g. `schemas/theme.v2.json`) will be added alongside the existing one so older tooling keeps working.

### Version changelog

| Version | What changed | Migration needed |
|---|---|---|
| **1** | Initial shape: `id`, `name`, `mode`, `isBuiltIn`, `description`, `tokens` | — (baseline) |

### How to bump the version (for contributors)

1. Decide whether the change is **breaking** (field removed, renamed, type changed) or **additive** (new optional field).
   - Additive changes **do not** require a version bump.
   - Breaking changes **must** bump `schemaVersion`.
2. Increment the version number in `schemas/theme.json` → `"default"` under `schemaVersion`.
3. Update the `$id` to `notetaker/theme/vN`.
4. Write a migration function in the app that upgrades vN-1 objects to vN.
5. Add a row to the changelog table above.
6. Add `"schemaVersion": N` to all examples in the schema file.

---

## JSON Schema

The full schema for theme objects lives at `schemas/theme.json` (`$id: notetaker/theme/v1`). It validates:
- Required fields and types
- `schemaVersion` integer ≥ 1
- `mode` enum (`"light"` | `"dark"`)
- All documented token property names with descriptions
- `id` format (`^[a-z0-9-]+$`)
