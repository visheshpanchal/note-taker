import { createContext, useContext, useEffect, useState, useCallback, useRef, ReactNode } from 'react'
import { BUILT_IN_THEMES } from '../utils/defaultThemes'
import type { Theme, ThemeMode } from '../types'

interface ThemeContextValue {
  themeId: string
  setActiveTheme: (id: string) => void
  theme: string
  setTheme: (legacyValue: string) => void
  themes: Theme[]
  addTheme: (theme: Theme) => Promise<void>
  deleteTheme: (id: string) => Promise<void>
  reloadThemes: (newStoragePath?: string) => Promise<void>
  resolved: ThemeMode
  systemTheme: ThemeMode
  storagePath: string | null
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

const ALL_TOKEN_KEYS = [
  '--bg-primary','--bg-secondary','--bg-tertiary','--bg-hover','--bg-sidebar',
  '--text-primary','--text-secondary','--text-muted',
  '--border','--border-strong',
  '--accent','--accent-hover','--accent-fg','--accent-soft',
  '--danger','--danger-hover','--success','--warning',
  '--shadow-xs','--shadow-sm','--shadow-md','--shadow-lg'
]

function clearCustomVars() {
  const el = document.documentElement
  for (const k of ALL_TOKEN_KEYS) el.style.removeProperty(k)
}

function applyThemeTokens(tokens: Record<string, string>) {
  const el = document.documentElement
  for (const [k, v] of Object.entries(tokens)) el.style.setProperty(k, v)
}

function legacyToThemeId(legacyValue: string): string {
  if (legacyValue === 'light') return 'default-light'
  if (legacyValue === 'dark')  return 'default-dark'
  return 'system'
}

function themeIdToLegacy(id: string, themes: Theme[]): string {
  if (id === 'system') return 'system'
  const t = themes.find(t => t.id === id)
  if (!t) return 'system'
  return t.mode === 'light' ? 'light' : 'dark'
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeId, setThemeId] = useState<string>(() => {
    const stored = localStorage.getItem('themeId') || localStorage.getItem('theme') || 'system'
    if (stored === 'light' || stored === 'dark') return legacyToThemeId(stored)
    return stored
  })
  const [systemTheme, setSystemTheme] = useState<ThemeMode>(
    window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  )
  const [themes, setThemes] = useState<Theme[]>(BUILT_IN_THEMES)
  const [storagePath, setStoragePath] = useState<string | null>(null)
  const prevThemeRef = useRef<Theme | null>(null)

  useEffect(() => {
    async function loadThemes() {
      if (!window.electronAPI) return
      try {
        const info = await window.electronAPI.system.getInfo()
        setStoragePath(info.storagePath)
        const loaded = await window.electronAPI.themes.load(info.storagePath)
        if (loaded && loaded.length > 0) setThemes(loaded)
      } catch (e) {
        console.warn('Failed to load themes from disk:', e)
      }
    }
    loadThemes()
  }, [])

  const activeTheme = themeId === 'system' ? null : themes.find(t => t.id === themeId) ?? null
  const resolved: ThemeMode = activeTheme ? activeTheme.mode : systemTheme

  useEffect(() => {
    const el = document.documentElement
    if (activeTheme) {
      el.setAttribute('data-theme', activeTheme.mode)
      applyThemeTokens(activeTheme.tokens)
    } else {
      clearCustomVars()
      el.setAttribute('data-theme', systemTheme)
    }
    prevThemeRef.current = activeTheme
  }, [themeId, systemTheme, activeTheme])

  useEffect(() => {
    if (window.electronAPI?.onSystemThemeChange) {
      const cleanup = window.electronAPI.onSystemThemeChange(setSystemTheme)
      return cleanup
    }
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e: MediaQueryListEvent) => setSystemTheme(e.matches ? 'dark' : 'light')
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  function setActiveTheme(id: string) {
    setThemeId(id)
    localStorage.setItem('themeId', id)
  }

  const theme = themeIdToLegacy(themeId, themes)

  function setTheme(legacyValue: string) {
    setActiveTheme(legacyToThemeId(legacyValue))
  }

  const addTheme = useCallback(async (theme: Theme) => {
    setThemes(prev => [...prev.filter(t => t.id !== theme.id), theme])
    if (window.electronAPI && storagePath) {
      await window.electronAPI.themes.save(storagePath, theme)
    }
  }, [storagePath])

  const deleteTheme = useCallback(async (id: string) => {
    setThemes(prev => prev.filter(t => t.id !== id))
    if (themeId === id) setActiveTheme('system')
    if (window.electronAPI && storagePath) {
      await window.electronAPI.themes.delete(storagePath, id)
    }
  }, [storagePath, themeId])

  const reloadThemes = useCallback(async (newStoragePath?: string) => {
    if (!window.electronAPI) return
    const sp = newStoragePath || storagePath
    if (!sp) return
    try {
      const loaded = await window.electronAPI.themes.load(sp)
      if (loaded && loaded.length > 0) setThemes(loaded)
    } catch {}
  }, [storagePath])

  return (
    <ThemeContext.Provider value={{
      themeId, setActiveTheme,
      theme, setTheme,
      themes, addTheme, deleteTheme, reloadThemes,
      resolved, systemTheme, storagePath
    }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
