import { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef, ReactNode } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { loadData, saveData } from '../utils/storage'
import { createDefaultData, createDefaultTemplate, createFocusTemplate } from '../utils/noteFactory'
import { BUILT_IN_CATEGORIES } from '../utils/categories'
import { validateAppData } from '../utils/schemaValidation'
import type { SchemaMismatch } from '../utils/schemaValidation'
import type {
  AnyNote, Tag, Notebook, Folder, Category, Template, AppData,
  AppSettings, SystemInfo, SaveStatus
} from '../types'

interface NotesContextValue {
  notes: AnyNote[]
  activeNote: AnyNote | null
  activeId: string | null
  setActiveId: (id: string | null) => void
  addNote: (n: AnyNote) => void
  updateNote: (id: string, patch: Partial<AnyNote>) => void
  deleteNote: (id: string) => void
  duplicateNote: (id: string) => void
  tags: Tag[]
  addTag: (tag: Tag) => void
  updateTag: (id: string, patch: Partial<Tag>) => void
  deleteTag: (id: string) => void
  notebooks: Notebook[]
  addNotebook: (nb: Notebook) => void
  updateNotebook: (id: string, patch: Partial<Notebook>) => void
  deleteNotebook: (id: string) => void
  folders: Folder[]
  addFolder: (f: Folder) => void
  updateFolder: (id: string, patch: Partial<Folder>) => void
  deleteFolder: (id: string) => void
  categories: Category[]
  addCategory: (cat: Category) => void
  updateCategory: (id: string, patch: Partial<Category>) => void
  deleteCategory: (id: string) => void
  templates: Template[]
  addTemplate: (t: Template) => Promise<void>
  updateTemplate: (id: string, patch: Partial<Template>) => Promise<void>
  deleteTemplate: (id: string) => Promise<void>
  settings: AppSettings
  updateSettings: (patch: Partial<AppSettings>) => void
  moveStoragePath: (newPath: string) => Promise<{ success: boolean; error?: string }>
  systemInfo: SystemInfo | null
  loading: boolean
  saveStatus: SaveStatus
  lastSavedAt: Date | null
  schemaMismatch: SchemaMismatch | null
  replaceMismatchedData: () => Promise<void>
}

const NotesContext = createContext<NotesContextValue | null>(null)

const FALLBACK_TEMPLATES: Template[] = [createDefaultTemplate(), createFocusTemplate()]

export function NotesProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [fileTemplates, setFileTemplates] = useState<Template[] | null>(null)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)
  const [schemaMismatch, setSchemaMismatch] = useState<SchemaMismatch | null>(null)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const savedFadeRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const dataRef = useRef<AppData | null>(null)
  dataRef.current = data

  const effectiveStoragePath = data?.settings?.storageLocation || systemInfo?.storagePath

  useEffect(() => {
    async function init() {
      const [loaded, info] = await Promise.all([
        loadData(),
        window.electronAPI?.system.getInfo().catch(() => null)
      ])
      setSystemInfo(info ?? null)
      if (loaded !== null) {
        const mismatch = validateAppData(loaded)
        if (mismatch) {
          setSchemaMismatch(mismatch)
        } else {
          setData(loaded)
        }
      } else {
        setData(createDefaultData())
      }
      setLoading(false)
    }
    init()
  }, [])

  useEffect(() => {
    if (!effectiveStoragePath) return
    async function loadTemplates() {
      if (window.electronAPI?.templates) {
        try {
          const loaded = await window.electronAPI.templates.load(effectiveStoragePath!)
          if (loaded && loaded.length > 0) { setFileTemplates(loaded); return }
        } catch (e) {
          console.warn('Failed to load templates from disk:', e)
        }
      }
      setFileTemplates(FALLBACK_TEMPLATES)
    }
    loadTemplates()
  }, [effectiveStoragePath])

  useEffect(() => {
    if (!data) return
    setSaveStatus('pending')
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(async () => {
      setSaveStatus('saving')
      try {
        await saveData(dataRef.current!)
        const now = new Date()
        setSaveStatus('saved')
        setLastSavedAt(now)
        if (savedFadeRef.current) clearTimeout(savedFadeRef.current)
        savedFadeRef.current = setTimeout(() => setSaveStatus('idle'), 2500)
      } catch {
        setSaveStatus('error')
      }
    }, 800)
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current) }
  }, [data])

  const notes     = data?.notes     ?? []
  const tags      = data?.tags      ?? []
  const notebooks = data?.notebooks ?? []
  const folders   = data?.folders   ?? []
  const templates = fileTemplates ?? FALLBACK_TEMPLATES

  const categories = useMemo(() => [
    ...BUILT_IN_CATEGORIES,
    ...(data?.categories ?? []).filter(c => !c.isBuiltIn)
  ], [data?.categories])

  const activeNote = notes.find(n => n.id === activeId) ?? null

  const addNote = useCallback((n: AnyNote) => {
    setData(prev => prev ? { ...prev, notes: [n, ...(prev.notes ?? [])] } : prev)
    setActiveId(n.id)
  }, [])

  const updateNote = useCallback((id: string, patch: Partial<AnyNote>) => {
    setData(prev => {
      if (!prev) return prev
      return {
        ...prev,
        notes: (prev.notes ?? []).map(n => {
          if (n.id !== id) return n
          const updated = { ...n, ...patch, updatedAt: new Date().toISOString() } as AnyNote
          if ('reminderAt' in patch && 'reminderAt' in n && patch.reminderAt !== n.reminderAt) {
            (updated as unknown as Record<string, unknown>).reminderNotified = false
          }
          return updated
        })
      }
    })
  }, [])

  const deleteNote = useCallback((id: string) => {
    setData(prev => prev ? { ...prev, notes: (prev.notes ?? []).filter(n => n.id !== id) } : prev)
    setActiveId(prev => prev === id ? null : prev)
  }, [])

  const duplicateNote = useCallback((id: string) => {
    const src = notes.find(n => n.id === id)
    if (!src) return
    const now = new Date().toISOString()
    const copy: AnyNote = { ...src, id: uuidv4(), title: `${src.title} (copy)`, createdAt: now, updatedAt: now }
    setData(prev => prev ? { ...prev, notes: [copy, ...(prev.notes ?? [])] } : prev)
    setActiveId(copy.id)
  }, [notes])

  const addTag = useCallback((tag: Tag) => {
    setData(prev => prev ? { ...prev, tags: [...(prev.tags ?? []), tag] } : prev)
  }, [])

  const updateTag = useCallback((id: string, patch: Partial<Tag>) => {
    setData(prev => prev ? {
      ...prev, tags: (prev.tags ?? []).map(t => t.id === id ? { ...t, ...patch } : t)
    } : prev)
  }, [])

  const deleteTag = useCallback((id: string) => {
    setData(prev => prev ? {
      ...prev,
      tags: (prev.tags ?? []).filter(t => t.id !== id),
      notes: (prev.notes ?? []).map(n => ({ ...n, tagIds: (n.tagIds ?? []).filter(tid => tid !== id) }))
    } : prev)
  }, [])

  const addNotebook = useCallback((nb: Notebook) => {
    setData(prev => prev ? { ...prev, notebooks: [...(prev.notebooks ?? []), nb] } : prev)
  }, [])

  const updateNotebook = useCallback((id: string, patch: Partial<Notebook>) => {
    setData(prev => prev ? {
      ...prev, notebooks: (prev.notebooks ?? []).map(n => n.id === id ? { ...n, ...patch } : n)
    } : prev)
  }, [])

  const deleteNotebook = useCallback((id: string) => {
    setData(prev => prev ? {
      ...prev,
      notebooks: (prev.notebooks ?? []).filter(n => n.id !== id),
      notes: (prev.notes ?? []).map(n => n.notebookId === id ? { ...n, notebookId: null } : n)
    } : prev)
  }, [])

  const addFolder = useCallback((f: Folder) => {
    setData(prev => prev ? { ...prev, folders: [...(prev.folders ?? []), f] } : prev)
  }, [])

  const updateFolder = useCallback((id: string, patch: Partial<Folder>) => {
    setData(prev => prev ? {
      ...prev, folders: (prev.folders ?? []).map(f => f.id === id ? { ...f, ...patch } : f)
    } : prev)
  }, [])

  const deleteFolder = useCallback((id: string) => {
    setData(prev => {
      if (!prev) return prev
      const allFolders = prev.folders ?? []
      const toDelete = new Set<string>()
      const queue = [id]
      while (queue.length > 0) {
        const fid = queue.shift()!
        toDelete.add(fid)
        allFolders.filter(f => f.parentId === fid).forEach(c => queue.push(c.id))
      }
      return {
        ...prev,
        folders: allFolders.filter(f => !toDelete.has(f.id)),
        notes: (prev.notes ?? []).map(n =>
          n.folderId && toDelete.has(n.folderId) ? { ...n, folderId: null } : n
        )
      }
    })
  }, [])

  const addCategory = useCallback((cat: Category) => {
    setData(prev => prev ? { ...prev, categories: [...(prev.categories ?? []), cat] } : prev)
  }, [])

  const updateCategory = useCallback((id: string, patch: Partial<Category>) => {
    setData(prev => prev ? {
      ...prev, categories: (prev.categories ?? []).map(c => c.id === id ? { ...c, ...patch } : c)
    } : prev)
  }, [])

  const deleteCategory = useCallback((id: string) => {
    setData(prev => prev ? {
      ...prev,
      categories: (prev.categories ?? []).filter(c => c.id !== id),
      notes: (prev.notes ?? []).map(n => n.category === id ? { ...n, category: null } : n)
    } : prev)
  }, [])

  const addTemplate = useCallback(async (t: Template) => {
    setFileTemplates(prev => [...(prev ?? []), t])
    if (window.electronAPI?.templates && effectiveStoragePath) {
      await window.electronAPI.templates.save(effectiveStoragePath, t)
    }
  }, [effectiveStoragePath])

  const updateTemplate = useCallback(async (id: string, patch: Partial<Template>) => {
    setFileTemplates(prev => (prev ?? []).map(t => t.id === id ? { ...t, ...patch } : t))
    if (window.electronAPI?.templates && effectiveStoragePath) {
      const updated = (fileTemplates ?? []).find(t => t.id === id)
      if (updated) await window.electronAPI.templates.save(effectiveStoragePath, { ...updated, ...patch })
    }
  }, [effectiveStoragePath, fileTemplates])

  const deleteTemplate = useCallback(async (id: string) => {
    setFileTemplates(prev => (prev ?? []).filter(t => t.id !== id))
    if (window.electronAPI?.templates && effectiveStoragePath) {
      await window.electronAPI.templates.delete(effectiveStoragePath, id)
    }
  }, [effectiveStoragePath])

  const updateSettings = useCallback((patch: Partial<AppSettings>) => {
    setData(prev => prev ? { ...prev, settings: { ...(prev.settings ?? {}), ...patch } } : prev)
  }, [])

  const replaceMismatchedData = useCallback(async () => {
    const fresh = createDefaultData()
    await saveData(fresh)
    setData(fresh)
    setSchemaMismatch(null)
  }, [])

  const moveStoragePath = useCallback(async (newPath: string) => {
    const oldPath = data?.settings?.storageLocation
    if (!oldPath || oldPath === newPath) return { success: false, error: 'Same path' }
    const api = window.electronAPI?.system
    if (!api?.moveData) return { success: false, error: 'Not in Electron' }
    try {
      const result = await api.moveData(oldPath, newPath)
      if (result.success && result.data) {
        setData(result.data)
        if (window.electronAPI?.templates) {
          const loaded = await window.electronAPI.templates.load(newPath)
          if (loaded && loaded.length > 0) setFileTemplates(loaded)
        }
      }
      return result
    } catch (e) {
      return { success: false, error: (e as Error).message }
    }
  }, [data?.settings?.storageLocation])

  return (
    <NotesContext.Provider value={{
      notes, activeNote, activeId, setActiveId,
      addNote, updateNote, deleteNote, duplicateNote,
      tags, addTag, updateTag, deleteTag,
      notebooks, addNotebook, updateNotebook, deleteNotebook,
      folders, addFolder, updateFolder, deleteFolder,
      categories, addCategory, updateCategory, deleteCategory,
      templates, addTemplate, updateTemplate, deleteTemplate,
      settings: data?.settings ?? {},
      updateSettings, moveStoragePath,
      systemInfo, loading,
      saveStatus, lastSavedAt,
      schemaMismatch, replaceMismatchedData
    }}>
      {children}
    </NotesContext.Provider>
  )
}

export function useNotes(): NotesContextValue {
  const ctx = useContext(NotesContext)
  if (!ctx) throw new Error('useNotes must be used within NotesProvider')
  return ctx
}
