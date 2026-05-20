# Claude Code Rules

## ⚠️ Protected: Storage & Location System

> **Do not modify, reorganize, or reformat the folder/file structure below without explicit user approval.**

---

### Folder Layout

```
storage/
    notes.json
templates/
    built-in-productive-day.json
    built-in-deep-focus.json
    my-custom-template.json
themes/
    default-light.json
    default-dark.json
    my-custom-theme.json
attachments/
    <note-id>/
        file.png
```

---

### What Is Protected

| Area | Details |
|---|---|
| **Folder names** | `storage/`, `templates/`, `themes/`, `attachments/` |
| **File naming conventions** | `built-in-*.json`, `default-*.json` |
| **Path references in code** | Any hardcoded or constructed paths pointing to the above |
| **Attachment pattern** | The `<note-id>/` subfolder structure inside `attachments/` |

---

### Triggers — Stop Before You Act

If you are about to do **any** of the following, you must warn the user first:

- Rename a folder or file in this layout
- Move files to a different path
- Change how paths are constructed in code
- Restructure where notes, templates, themes, or attachments are stored
- Edit a path string such as `./storage/notes.json` anywhere in the codebase

---

### Required Warning Message

When a trigger is detected, pause and say:

> ⚠️ **WARNING: Storage Location System — Protected Area**
>
> I'm about to modify the storage folder layout or file path format.
> You've asked not to change the location system without approval.
>
> **Do you want me to proceed? If yes, please describe the change you want.**

**Do not make any edits until the user explicitly confirms.**