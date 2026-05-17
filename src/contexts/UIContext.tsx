import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

interface UIContextValue {
  showProperties: boolean
  setShowProperties: (val: boolean | ((prev: boolean) => boolean)) => void
  showQuickOpen: boolean
  setShowQuickOpen: (val: boolean | ((prev: boolean) => boolean)) => void
  sidebarOpen: boolean
  setSidebarOpen: (val: boolean | ((prev: boolean) => boolean)) => void
}

const UIContext = createContext<UIContextValue | null>(null)

function readBool(key: string, defaultVal: boolean): boolean {
  try {
    const v = localStorage.getItem(key)
    return v === null ? defaultVal : v === 'true'
  } catch {
    return defaultVal
  }
}

export function UIProvider({ children }: { children: ReactNode }) {
  const [showProperties, setShowProperties] = useState(false)
  const [showQuickOpen, setShowQuickOpen] = useState(false)
  const [sidebarOpen, setSidebarOpenRaw] = useState(() => readBool('sidebarOpen', true))

  function setSidebarOpen(val: boolean | ((prev: boolean) => boolean)) {
    const next = typeof val === 'function' ? val(sidebarOpen) : val
    setSidebarOpenRaw(next)
    try { localStorage.setItem('sidebarOpen', String(next)) } catch {}
  }

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setShowQuickOpen(v => !v) }
      if (e.key === 'Escape') setShowQuickOpen(false)
      if ((e.metaKey || e.ctrlKey) && e.key === '\\') { e.preventDefault(); setSidebarOpen(v => !v) }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  return (
    <UIContext.Provider value={{
      showProperties, setShowProperties,
      showQuickOpen, setShowQuickOpen,
      sidebarOpen, setSidebarOpen
    }}>
      {children}
    </UIContext.Provider>
  )
}

export function useUI(): UIContextValue {
  const ctx = useContext(UIContext)
  if (!ctx) throw new Error('useUI must be used within UIProvider')
  return ctx
}
