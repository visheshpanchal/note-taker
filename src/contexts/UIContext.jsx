import { createContext, useContext, useEffect, useState } from 'react'

const UIContext = createContext(null)

function readBool(key, defaultVal) {
  try { const v = localStorage.getItem(key); return v === null ? defaultVal : v === 'true' } catch { return defaultVal }
}

export function UIProvider({ children }) {
  const [showProperties, setShowProperties] = useState(false)
  const [showQuickOpen, setShowQuickOpen] = useState(false)
  const [sidebarOpen, setSidebarOpenRaw] = useState(() => readBool('sidebarOpen', true))

  function setSidebarOpen(val) {
    const next = typeof val === 'function' ? val(sidebarOpen) : val
    setSidebarOpenRaw(next)
    try { localStorage.setItem('sidebarOpen', String(next)) } catch {}
  }

  useEffect(() => {
    function handler(e) {
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

export function useUI() { return useContext(UIContext) }
