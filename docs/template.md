# Day Plan Templates

Templates define the section layout that is instantiated when a user creates a new Day Plan. Built-in templates ship with the app; custom templates are created in Settings → Templates and persisted to `templates.json` in the storage directory.

---

## Template Object Structure

```json
{
  "schemaVersion": 1,
  "id": "built-in-productive-day",
  "name": "Productive Day",
  "isBuiltIn": true,
  "description": "A balanced daily planning template.",
  "color": "#007aff",
  "sections": [
    {
      "key": "priorities",
      "label": "🎯 Top 3 Priorities",
      "type": "priorities",
      "description": "The three most important things to accomplish today.",
      "config": { "count": 3 }
    }
  ]
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `schemaVersion` | `integer` | no (default `1`) | Version of the template schema. Omitting it is equivalent to `1`. See [Versioning](#versioning) below. |
| `id` | `string` | yes | Unique kebab-case identifier. Built-in IDs use the prefix `built-in-`. |
| `name` | `string` | yes | Display name shown in the Template Selector. |
| `isBuiltIn` | `boolean` | yes | `true` = ships with the app, cannot be deleted by the user. |
| `description` | `string` | yes | One-sentence summary shown in the Template Selector. |
| `color` | `string` | no | Accent color for the template's card in the picker. Any valid CSS color. |
| `sections` | `TemplateSectionDef[]` | yes | Ordered list of section definitions. At least one required. |

---

## Section Types

Each section has a `type` that determines which editor component renders it and what data shape its items have at runtime.

### `text`
A freeform rich-text area.
- **Runtime shape:** `{ key, label, type: "text", content: "" }`
- **Config fields:** none
- **Use for:** intentions, reflections, free notes

```json
{
  "key": "reflection",
  "label": "🌙 Evening Review",
  "type": "text",
  "description": "What went well? What would you do differently?"
}
```

### `priorities`
A numbered priority list (P1 / P2 / P3 …).
- **Runtime shape:** `{ key, label, type: "priorities", items: [{ id, text, done, priority }] }`
- **Config fields:** `count` (number of blank items to pre-populate, default 3)
- **Use for:** top priorities, wins, goals

```json
{
  "key": "priorities",
  "label": "🎯 Top 3 Priorities",
  "type": "priorities",
  "config": { "count": 3 }
}
```

### `checklist`
A simple checked / unchecked task list.
- **Runtime shape:** `{ key, label, type: "checklist", items: [{ id, text, done }] }`
- **Config fields:**
  - `count` — number of blank items to pre-populate
  - `defaultItems` — array of label strings; overrides `count` if provided
- **Use for:** habits, blockers, carried-over tasks

```json
{
  "key": "habits",
  "label": "✅ Daily Habits",
  "type": "checklist",
  "config": {
    "defaultItems": ["Hydrate (8 glasses)", "Exercise", "Meditate"]
  }
}
```

### `timeblocks`
A time-grid schedule.
- **Runtime shape:** `{ key, label, type: "timeblocks", items: [{ id, time, task, category, done }] }`
- **Config fields:**
  - `startTime` — grid start in `HH:MM` 24-hour format (default `"08:00"`)
  - `endTime` — grid end in `HH:MM` 24-hour format (default `"20:00"`)
  - `interval` — slot duration in minutes, must be a multiple of 5 (default `60`)
- **Use for:** hourly schedule, focus blocks, deep work sessions

```json
{
  "key": "schedule",
  "label": "📅 Schedule",
  "type": "timeblocks",
  "config": { "startTime": "08:00", "endTime": "21:00", "interval": 60 }
}
```

---

## Section Definition Fields

| Field | Type | Required | Description |
|---|---|---|---|
| `key` | `string` | yes | Unique identifier within the template. Used as React key. Pattern: `^[a-z0-9_-]+$` |
| `label` | `string` | yes | Heading shown at the top of the section card. Emojis welcome. |
| `type` | `SectionType` | yes | One of `text`, `priorities`, `checklist`, `timeblocks` |
| `description` | `string` | no | Subtitle shown beneath the label to guide the user. |
| `config` | `SectionConfig` | no | Optional hints used when instantiating the section. |

---

## Built-in Templates

### Productive Day (`built-in-productive-day`)
A balanced full-day planner.

| Key | Label | Type | Config |
|---|---|---|---|
| `intentions` | 🌅 Morning Intentions | text | — |
| `priorities` | 🎯 Top 3 Priorities | priorities | count: 3 |
| `schedule` | 📅 Schedule | timeblocks | 08:00–21:00, 60 min |
| `habits` | ✅ Daily Habits | checklist | 5 default items |
| `notes` | 💡 Notes & Ideas | text | — |
| `review` | 🌙 Evening Review | text | — |

### Deep Focus (`built-in-deep-focus`)
Minimal template for single deep-work sessions.

| Key | Label | Type | Config |
|---|---|---|---|
| `main_goal` | 🏆 Main Goal | text | — |
| `schedule` | ⏱ Time Blocks | timeblocks | 09:00–18:00, 90 min |
| `blockers` | 🚧 Blockers & Distractions | checklist | empty |
| `wins` | 🎉 End-of-Day Wins | priorities | count: 3 |

---

## Creating a Custom Template

### Via the UI
1. Open Settings → Templates → New Template.
2. Give it a name and description.
3. Add sections using the section editor (choose type, label, key, and config).
4. Save — the template is written to `templates.json` in your storage directory and appears immediately in the Template Selector.

### Via JSON (manual)
1. Create or open `templates.json` in your storage directory.
2. The file must be an **array** of template objects.
3. Add your template with `"isBuiltIn": false`.
4. Restart (or reload) — it appears in the Template Selector.

**Example custom template:**

```json
[
  {
    "schemaVersion": 1,
    "id": "weekly-review",
    "name": "Weekly Review",
    "isBuiltIn": false,
    "description": "A structured Friday review to close the week and plan the next.",
    "color": "#8b5cf6",
    "sections": [
      {
        "key": "wins",
        "label": "🏆 Wins This Week",
        "type": "priorities",
        "description": "Top three things you accomplished.",
        "config": { "count": 3 }
      },
      {
        "key": "incomplete",
        "label": "🔄 Carried Over",
        "type": "checklist",
        "description": "Tasks that didn't make it — complete, delegate, or drop."
      },
      {
        "key": "learnings",
        "label": "📚 Learnings",
        "type": "text",
        "description": "What did you learn this week?"
      },
      {
        "key": "next-week",
        "label": "🗓 Next Week's Priorities",
        "type": "priorities",
        "description": "The three outcomes that matter most next week.",
        "config": { "count": 3 }
      }
    ]
  }
]
```

**Tips:**
- Always include `"schemaVersion": 1` so future migrations can identify the format.
- `key` values must be unique within a template and match `^[a-z0-9_-]+$`.
- `timeblocks` interval must be a multiple of 5 (e.g. 15, 30, 45, 60, 90).
- `defaultItems` in a checklist overrides `count` — use one or the other, not both.
- Validate your file against `schemas/template.json` (JSON Schema Draft-07) to catch errors early.

---

## Versioning

### How it works

Every template object carries an optional integer `schemaVersion` field. The current version is **1**.

- If the field is **absent**, the app treats the object as version 1 (backwards compatibility for templates written before versioning was introduced).
- If the field is **present**, the app compares it to the version it understands and runs any required migrations before using the template.

### Schema ID

The JSON Schema file itself is versioned via its `$id`:

```
notetaker/template/v1
```

When a new schema version is released a new file (e.g. `schemas/template.v2.json`) will be added alongside the existing one so older tooling keeps working.

### Version changelog

| Version | What changed | Migration needed |
|---|---|---|
| **1** | Initial shape: `id`, `name`, `isBuiltIn`, `description`, `color?`, `sections` (text \| priorities \| checklist \| timeblocks) | — (baseline) |

### How to bump the version (for contributors)

1. Decide whether the change is **breaking** (section type removed, config field renamed, required field added) or **additive** (new optional field).
   - Additive changes **do not** require a version bump.
   - Breaking changes **must** bump `schemaVersion`.
2. Increment the version number in `schemas/template.json` → `"default"` under `schemaVersion`.
3. Update the `$id` to `notetaker/template/vN`.
4. Write a migration function in the app that upgrades vN-1 objects to vN.
5. Add a row to the changelog table above.
6. Add `"schemaVersion": N` to all examples in the schema file.

---

## JSON Schema

The full schema for template objects lives at `schemas/template.json` (`$id: notetaker/template/v1`). It validates:
- Required fields and their types
- `schemaVersion` integer ≥ 1
- `key` and `id` format patterns
- `SectionType` enum values
- `SectionConfig` field types and constraints (`interval` must be `multipleOf: 5`, `startTime`/`endTime` must match `HH:MM`)
- Minimum of one section per template
