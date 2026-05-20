import { createContext, useContext, useEffect, useState, useCallback, useRef, ReactNode } from 'react'
import { BUILT_IN_THEMES, MODE_DEFAULTS, ALL_TOKEN_KEYS, CURRENT_SCHEMA_VERSION } from '../utils/defaultThemes'
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

// ─── Migration ────────────────────────────────────────────────────────────────
//
// When a theme is loaded from disk its schemaVersion may be lower than
// CURRENT_SCHEMA_VERSION (or absent, which means version 1). We fill in any
// missing tokens from the mode defaults so new CSS variables always have a
// sensible value, then stamp the current version on the migrated object.
//
export function migrateTheme(theme: Theme): Theme {
  const version = theme.schemaVersion ?? 1
  if (version >= CURRENT_SCHEMA_VERSION) return theme

  const defaults = MODE_DEFAULTS[theme.mode]

  // Fill gaps: existing explicit token values win; defaults backfill the rest.
  const migratedTokens: Record<string, string> = { ...defaults, ...theme.tokens }

  return { ...theme, tokens: migratedTokens, schemaVersion: CURRENT_SCHEMA_VERSION }
}

// ─── DOM helpers ──────────────────────────────────────────────────────────────

function clearCustomVars() {
  const el = document.documentElement
  // Remove every token key we know about so none leak across theme switches.
  for (const k of ALL_TOKEN_KEYS) el.style.removeProperty(k)
}

function applyThemeTokens(tokens: Record<string, string>) {
  const el = document.documentElement
  for (const [k, v] of Object.entries(tokens)) el.style.setProperty(k, v)
}

// ─── Legacy compat ────────────────────────────────────────────────────────────

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

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeId, setThemeId] = useState<string>(() => {
    const stored = localStorage.getItem('themeId') || localStorage.getItem('theme') || 'system'
    if (stored === 'light' || stored === 'dark') return legacyToThemeId(stored)
    return stored
  })
  const [systemTheme, setSystemTheme] = useState<ThemeMode>(
    window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  )
  // Built-in themes are already at CURRENT_SCHEMA_VERSION — no migration needed.
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
        if (loaded && loaded.length > 0) {
          // Migrate any themes that were saved under an older schema version.
          setThemes(loaded.map(migrateTheme))
        } else {
          for (const t of BUILT_IN_THEMES) {
            await window.electronAPI.themes.save(info.storagePath, t).catch(() => {})
          }
        }
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
      // Clear first so tokens removed in a newer theme version don't persist.
      clearCustomVars()
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
    // Always migrate before storing so saved themes are at current version.
    const migrated = migrateTheme(theme)
    setThemes(prev => [...prev.filter(t => t.id !== migrated.id), migrated])
    if (window.electronAPI && storagePath) {
      await window.electronAPI.themes.save(storagePath, migrated)
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
      if (loaded && loaded.length > 0) setThemes(loaded.map(migrateTheme))
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
