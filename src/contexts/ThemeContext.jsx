import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { BUILT_IN_THEMES } from '../utils/defaultThemes.js'

const ThemeContext = createContext(null)

// All CSS variable keys we manage
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

function applyThemeTokens(tokens) {
  const el = document.documentElement
  for (const [k, v] of Object.entries(tokens)) el.style.setProperty(k, v)
}

// Map a legacy theme value ('light'|'dark'|'system') to a themeId
function legacyToThemeId(legacyValue) {
  if (legacyValue === 'light')  return 'default-light'
  if (legacyValue === 'dark')   return 'default-dark'
  return 'system'
}

// Map a themeId back to a legacy value for ThemeToggle compatibility
function themeIdToLegacy(id, themes) {
  if (id === 'system') return 'system'
  const t = themes.find(t => t.id === id)
  if (!t) return 'system'
  return t.mode === 'light' ? 'light' : 'dark'
}

export function ThemeProvider({ children }) {
  // 'system' | theme id (e.g. 'default-light', 'midnight', etc.)
  // Migration: if stored value is 'light'/'dark'/'system' (legacy), convert it
  const [themeId, setThemeId] = useState(() => {
    const stored = localStorage.getItem('themeId') || localStorage.getItem('theme') || 'system'
    // If it's a legacy short value, convert it
    if (stored === 'light' || stored === 'dark') return legacyToThemeId(stored)
    return stored
  })
  const [systemTheme, setSystemTheme] = useState(
    window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  )
  const [themes, setThemes] = useState(BUILT_IN_THEMES)
  const [storagePath, setStoragePath] = useState(null)
  const prevThemeRef = useRef(null)

  // Load themes from disk on mount
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

  // Resolve active theme object
  const activeTheme = themeId === 'system' ? null : themes.find(t => t.id === themeId) ?? null

  // The light/dark mode for Excalidraw + data-theme attribute
  const resolved = activeTheme ? activeTheme.mode : systemTheme

  // Apply theme whenever it changes
  useEffect(() => {
    const el = document.documentElement

    if (activeTheme) {
      el.setAttribute('data-theme', activeTheme.mode)
      applyThemeTokens(activeTheme.tokens)
    } else {
      // system mode: clear any custom vars, let index.css handle it
      clearCustomVars()
      el.setAttribute('data-theme', systemTheme)
    }

    prevThemeRef.current = activeTheme
  }, [themeId, systemTheme, activeTheme])

  // OS theme change listener
  useEffect(() => {
    if (window.electronAPI?.onSystemThemeChange) {
      const cleanup = window.electronAPI.onSystemThemeChange(setSystemTheme)
      return cleanup
    }
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e) => setSystemTheme(e.matches ? 'dark' : 'light')
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  function setActiveTheme(id) {
    setThemeId(id)
    localStorage.setItem('themeId', id)
  }

  // ─── Backward-compat shim for ThemeToggle ───────────────────────────────
  // ThemeToggle uses: theme ('light'|'dark'|'system'), setTheme, resolved
  const theme = themeIdToLegacy(themeId, themes)

  function setTheme(legacyValue) {
    const newId = legacyToThemeId(legacyValue)
    setActiveTheme(newId)
  }
  // ────────────────────────────────────────────────────────────────────────

  const addTheme = useCallback(async (theme) => {
    setThemes(prev => [...prev.filter(t => t.id !== theme.id), theme])
    if (window.electronAPI && storagePath) {
      await window.electronAPI.themes.save(storagePath, theme)
    }
  }, [storagePath])

  const deleteTheme = useCallback(async (id) => {
    setThemes(prev => prev.filter(t => t.id !== id))
    if (themeId === id) setActiveTheme('system')
    if (window.electronAPI && storagePath) {
      await window.electronAPI.themes.delete(storagePath, id)
    }
  }, [storagePath, themeId])

  // Reload themes when storage path changes (after move)
  const reloadThemes = useCallback(async (newStoragePath) => {
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
      // Backward-compat aliases for ThemeToggle
      theme, setTheme,
      themes, addTheme, deleteTheme, reloadThemes,
      resolved, systemTheme, storagePath
    }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() { return useContext(ThemeContext) }
