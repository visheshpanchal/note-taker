import { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { loadData, saveData } from '../utils/storage.js'
import { createDefaultData, createDefaultTemplate, createFocusTemplate } from '../utils/noteFactory.js'
import { BUILT_IN_CATEGORIES } from '../utils/categories.js'

const NotesContext = createContext(null)

// Fallback for non-Electron environments
const FALLBACK_TEMPLATES = [createDefaultTemplate(), createFocusTemplate()]

export function NotesProvider({ children }) {
  const [data, setData] = useState(null)
  const [activeId, setActiveId] = useState(null)
  const [systemInfo, setSystemInfo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [fileTemplates, setFileTemplates] = useState(null)
  const [saveStatus, setSaveStatus] = useState('idle') // 'idle'|'pending'|'saving'|'saved'|'error'
  const [lastSavedAt, setLastSavedAt] = useState(null)
  const saveTimerRef = useRef(null)
  const savedFadeRef = useRef(null)
  const dataRef = useRef(null)
  dataRef.current = data

  const effectiveStoragePath = data?.settings?.storageLocation || systemInfo?.storagePath

  useEffect(() => {
    async function init() {
      const [loaded, info] = await Promise.all([
        loadData(),
        window.electronAPI?.system.getInfo().catch(() => null)
      ])
      setData(loaded || createDefaultData())
      setSystemInfo(info)
      setLoading(false)
    }
    init()
  }, [])

  // Load templates from disk once we have a storage path
  useEffect(() => {
    if (!effectiveStoragePath) return
    async function loadTemplates() {
      if (window.electronAPI?.templates) {
        try {
          const loaded = await window.electronAPI.templates.load(effectiveStoragePath)
          if (loaded && loaded.length > 0) {
            setFileTemplates(loaded)
            return
          }
        } catch (e) {
          console.warn('Failed to load templates from disk:', e)
        }
      }
      setFileTemplates(FALLBACK_TEMPLATES)
    }
    loadTemplates()
  }, [effectiveStoragePath])

  // Autosave with status tracking (800ms debounce)
  useEffect(() => {
    if (!data) return
    setSaveStatus('pending')
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(async () => {
      setSaveStatus('saving')
      try {
        await saveData(dataRef.current)
        const now = new Date()
        setSaveStatus('saved')
        setLastSavedAt(now)
        if (savedFadeRef.current) clearTimeout(savedFadeRef.current)
        savedFadeRef.current = setTimeout(() => setSaveStatus('idle'), 2500)
      } catch {
        setSaveStatus('error')
      }
    }, 800)
    return () => clearTimeout(saveTimerRef.current)
  }, [data])

  // ─── Derived ────────────────────────────────────────────────────────────
  const notes     = data?.notes     ?? []
  const tags      = data?.tags      ?? []
  const notebooks = data?.notebooks ?? []

  const templates = fileTemplates ?? FALLBACK_TEMPLATES

  const categories = useMemo(() => [
    ...BUILT_IN_CATEGORIES,
    ...(data?.categories ?? []).filter(c => !c.isBuiltIn)
  ], [data?.categories])

  const activeNote = notes.find(n => n.id === activeId) ?? null

  // ─── Notes CRUD ──────────────────────────────────────────────────────────
  const addNote = useCallback((n) => {
    setData(prev => ({ ...prev, notes: [n, ...(prev?.notes ?? [])] }))
    setActiveId(n.id)
  }, [])

  const updateNote = useCallback((id, patch) => {
    setData(prev => ({
      ...prev,
      notes: (prev?.notes ?? []).map(n => {
        if (n.id !== id) return n
        const updated = { ...n, ...patch, updatedAt: new Date().toISOString() }
        // Reset notified flag whenever the reminder time changes
        if ('reminderAt' in patch && patch.reminderAt !== n.reminderAt) {
          updated.reminderNotified = false
        }
        return updated
      })
    }))
  }, [])

  const deleteNote = useCallback((id) => {
    setData(prev => ({ ...prev, notes: (prev?.notes ?? []).filter(n => n.id !== id) }))
    setActiveId(prev => prev === id ? null : prev)
  }, [])

  const duplicateNote = useCallback((id) => {
    const src = notes.find(n => n.id === id)
    if (!src) return
    const now = new Date().toISOString()
    const copy = { ...src, id: uuidv4(), title: `${src.title} (copy)`, createdAt: now, updatedAt: now }
    setData(prev => ({ ...prev, notes: [copy, ...(prev?.notes ?? [])] }))
    setActiveId(copy.id)
  }, [notes])

  // ─── Tags CRUD ───────────────────────────────────────────────────────────
  const addTag = useCallback((tag) => {
    setData(prev => ({ ...prev, tags: [...(prev?.tags ?? []), tag] }))
  }, [])

  const updateTag = useCallback((id, patch) => {
    setData(prev => ({
      ...prev, tags: (prev?.tags ?? []).map(t => t.id === id ? { ...t, ...patch } : t)
    }))
  }, [])

  const deleteTag = useCallback((id) => {
    setData(prev => ({
      ...prev,
      tags: (prev?.tags ?? []).filter(t => t.id !== id),
      notes: (prev?.notes ?? []).map(n => ({ ...n, tagIds: (n.tagIds ?? []).filter(tid => tid !== id) }))
    }))
  }, [])

  // ─── Notebooks CRUD ──────────────────────────────────────────────────────
  const addNotebook = useCallback((nb) => {
    setData(prev => ({ ...prev, notebooks: [...(prev?.notebooks ?? []), nb] }))
  }, [])

  const updateNotebook = useCallback((id, patch) => {
    setData(prev => ({
      ...prev, notebooks: (prev?.notebooks ?? []).map(n => n.id === id ? { ...n, ...patch } : n)
    }))
  }, [])

  const deleteNotebook = useCallback((id) => {
    setData(prev => ({
      ...prev,
      notebooks: (prev?.notebooks ?? []).filter(n => n.id !== id),
      notes: (prev?.notes ?? []).map(n => n.notebookId === id ? { ...n, notebookId: null } : n)
    }))
  }, [])

  // ─── Categories CRUD ─────────────────────────────────────────────────────
  const addCategory = useCallback((cat) => {
    setData(prev => ({ ...prev, categories: [...(prev?.categories ?? []), cat] }))
  }, [])

  const updateCategory = useCallback((id, patch) => {
    setData(prev => ({
      ...prev, categories: (prev?.categories ?? []).map(c => c.id === id ? { ...c, ...patch } : c)
    }))
  }, [])

  const deleteCategory = useCallback((id) => {
    setData(prev => ({
      ...prev,
      categories: (prev?.categories ?? []).filter(c => c.id !== id),
      notes: (prev?.notes ?? []).map(n => n.category === id ? { ...n, category: null } : n)
    }))
  }, [])

  // ─── Templates CRUD (file-based) ──────────────────────────────────────────
  const addTemplate = useCallback(async (t) => {
    setFileTemplates(prev => [...(prev ?? []), t])
    if (window.electronAPI?.templates && effectiveStoragePath) {
      await window.electronAPI.templates.save(effectiveStoragePath, t)
    }
  }, [effectiveStoragePath])

  const updateTemplate = useCallback(async (id, patch) => {
    setFileTemplates(prev => (prev ?? []).map(t => t.id === id ? { ...t, ...patch } : t))
    if (window.electronAPI?.templates && effectiveStoragePath) {
      const updated = (fileTemplates ?? []).find(t => t.id === id)
      if (updated) await window.electronAPI.templates.save(effectiveStoragePath, { ...updated, ...patch })
    }
  }, [effectiveStoragePath, fileTemplates])

  const deleteTemplate = useCallback(async (id) => {
    setFileTemplates(prev => (prev ?? []).filter(t => t.id !== id))
    if (window.electronAPI?.templates && effectiveStoragePath) {
      await window.electronAPI.templates.delete(effectiveStoragePath, id)
    }
  }, [effectiveStoragePath])

  // ─── Settings ────────────────────────────────────────────────────────────
  const updateSettings = useCallback((patch) => {
    setData(prev => ({ ...prev, settings: { ...(prev?.settings ?? {}), ...patch } }))
  }, [])

  const moveStoragePath = useCallback(async (newPath) => {
    const oldPath = data?.settings?.storageLocation
    if (!oldPath || oldPath === newPath) return { success: false, error: 'Same path' }
    const api = window.electronAPI?.system
    if (!api?.moveData) return { success: false, error: 'Not in Electron' }
    try {
      const result = await api.moveData(oldPath, newPath)
      if (result.success) {
        setData(result.data)
        // Reload templates from new location
        if (window.electronAPI?.templates) {
          const loaded = await window.electronAPI.templates.load(newPath)
          if (loaded && loaded.length > 0) setFileTemplates(loaded)
        }
      }
      return result
    } catch (e) { return { success: false, error: e.message } }
  }, [data?.settings?.storageLocation])

  return (
    <NotesContext.Provider value={{
      notes, activeNote, activeId, setActiveId,
      addNote, updateNote, deleteNote, duplicateNote,
      tags, addTag, updateTag, deleteTag,
      notebooks, addNotebook, updateNotebook, deleteNotebook,
      categories, addCategory, updateCategory, deleteCategory,
      templates, addTemplate, updateTemplate, deleteTemplate,
      settings: data?.settings ?? {},
      updateSettings, moveStoragePath,
      systemInfo, loading,
      saveStatus, lastSavedAt
    }}>
      {children}
    </NotesContext.Provider>
  )
}

export function useNotes() { return useContext(NotesContext) }
