import { useEffect, useRef } from 'react'
import { useNotes } from '../contexts/NotesContext'
import type { AnyNote } from '../types'

export function useReminderChecker(): void {
  const { notes, updateNote } = useNotes()
  const notesRef = useRef<AnyNote[]>(notes)
  const updateRef = useRef(updateNote)
  notesRef.current = notes
  updateRef.current = updateNote

  useEffect(() => {
    function check() {
      const now = new Date()
      for (const note of notesRef.current) {
        if (!('reminderAt' in note) || !note.reminderAt || note.reminderNotified) continue
        if (!['todo', 'dayplan'].includes(note.type)) continue
        if (new Date(note.reminderAt) > now) continue

        const title = `🔔 ${note.title}`
        const body = note.type === 'todo'
          ? `${note.items?.filter(i => !i.checked).length ?? 0} item(s) still pending`
          : `Day plan — ${new Date(note.date + 'T12:00:00').toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}`

        window.electronAPI?.notifications?.show({ title, body, noteId: note.id })
        updateRef.current(note.id, { reminderNotified: true })
      }
    }

    check()
    const id = setInterval(check, 60_000)
    return () => clearInterval(id)
  }, [])
}
