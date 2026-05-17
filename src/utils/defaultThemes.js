export const BUILT_IN_THEMES = [
  {
    id: 'default-light', name: 'Default Light', mode: 'light', isBuiltIn: true,
    description: 'Clean white interface with indigo-blue accents',
    tokens: {
      '--bg-primary':'#ffffff','--bg-secondary':'#f4f4f8','--bg-tertiary':'#eaeaef',
      '--bg-hover':'#e0e0e8','--bg-sidebar':'#f0f0f5',
      '--text-primary':'#111118','--text-secondary':'#56565f','--text-muted':'#9898a8',
      '--border':'#e2e2ea','--border-strong':'#c8c8d4',
      '--accent':'#5b6af8','--accent-hover':'#4656e8','--accent-fg':'#ffffff',
      '--accent-soft':'rgba(91,106,248,0.10)',
      '--danger':'#ef4444','--danger-hover':'#dc2626','--success':'#22c55e','--warning':'#f59e0b',
      '--shadow-xs':'0 1px 2px rgba(0,0,0,0.04)',
      '--shadow-sm':'0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
      '--shadow-md':'0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04)',
      '--shadow-lg':'0 8px 28px rgba(0,0,0,0.12), 0 4px 8px rgba(0,0,0,0.06)'
    }
  },
  {
    id: 'default-dark', name: 'Default Dark', mode: 'dark', isBuiltIn: true,
    description: 'Sleek dark interface with purple-blue accents',
    tokens: {
      '--bg-primary':'#111113','--bg-secondary':'#18181c','--bg-tertiary':'#222228',
      '--bg-hover':'#2c2c35','--bg-sidebar':'#141418',
      '--text-primary':'#f0f0f8','--text-secondary':'#9090a0','--text-muted':'#55555f',
      '--border':'#2c2c38','--border-strong':'#404050',
      '--accent':'#7080ff','--accent-hover':'#8090ff','--accent-fg':'#ffffff',
      '--accent-soft':'rgba(112,128,255,0.14)',
      '--danger':'#f87171','--danger-hover':'#fc8181','--success':'#4ade80','--warning':'#fbbf24',
      '--shadow-xs':'0 1px 2px rgba(0,0,0,0.20)',
      '--shadow-sm':'0 1px 3px rgba(0,0,0,0.30)',
      '--shadow-md':'0 4px 12px rgba(0,0,0,0.40)',
      '--shadow-lg':'0 8px 28px rgba(0,0,0,0.50)'
    }
  },
  {
    id: 'midnight', name: 'Midnight', mode: 'dark', isBuiltIn: true,
    description: 'Deep blue-black with violet accents',
    tokens: {
      '--bg-primary':'#0a0a14','--bg-secondary':'#0f0f1e','--bg-tertiary':'#151528',
      '--bg-hover':'#1e1e38','--bg-sidebar':'#0d0d1a',
      '--text-primary':'#e8e8ff','--text-secondary':'#9090c0','--text-muted':'#505080',
      '--border':'#1e1e38','--border-strong':'#2a2a50',
      '--accent':'#a78bfa','--accent-hover':'#b99ffd','--accent-fg':'#ffffff',
      '--accent-soft':'rgba(167,139,250,0.14)',
      '--danger':'#f87171','--danger-hover':'#fc8181','--success':'#4ade80','--warning':'#fbbf24',
      '--shadow-xs':'0 1px 2px rgba(0,0,0,0.35)',
      '--shadow-sm':'0 1px 3px rgba(0,0,0,0.45)',
      '--shadow-md':'0 4px 12px rgba(0,0,0,0.55)',
      '--shadow-lg':'0 8px 28px rgba(0,0,0,0.65)'
    }
  },
  {
    id: 'sepia', name: 'Sepia', mode: 'light', isBuiltIn: true,
    description: 'Warm paper tones, easy on the eyes',
    tokens: {
      '--bg-primary':'#faf6f0','--bg-secondary':'#f5ede0','--bg-tertiary':'#ede2ce',
      '--bg-hover':'#e5d5ba','--bg-sidebar':'#f2e8d6',
      '--text-primary':'#2c1a0e','--text-secondary':'#6b4c2e','--text-muted':'#a0816a',
      '--border':'#e0d0b8','--border-strong':'#c8b090',
      '--accent':'#a0522d','--accent-hover':'#8b3d1a','--accent-fg':'#ffffff',
      '--accent-soft':'rgba(160,82,45,0.12)',
      '--danger':'#c0392b','--danger-hover':'#a93226','--success':'#27ae60','--warning':'#d68910',
      '--shadow-xs':'0 1px 2px rgba(80,40,0,0.06)',
      '--shadow-sm':'0 1px 3px rgba(80,40,0,0.10), 0 1px 2px rgba(80,40,0,0.06)',
      '--shadow-md':'0 4px 12px rgba(80,40,0,0.12), 0 2px 4px rgba(80,40,0,0.07)',
      '--shadow-lg':'0 8px 28px rgba(80,40,0,0.16), 0 4px 8px rgba(80,40,0,0.10)'
    }
  },
  {
    id: 'nord', name: 'Nord', mode: 'dark', isBuiltIn: true,
    description: 'Arctic north-bluish color palette',
    tokens: {
      '--bg-primary':'#2e3440','--bg-secondary':'#3b4252','--bg-tertiary':'#434c5e',
      '--bg-hover':'#4c566a','--bg-sidebar':'#252a33',
      '--text-primary':'#eceff4','--text-secondary':'#d8dee9','--text-muted':'#81a1c1',
      '--border':'#3b4252','--border-strong':'#4c566a',
      '--accent':'#88c0d0','--accent-hover':'#9ecfdf','--accent-fg':'#2e3440',
      '--accent-soft':'rgba(136,192,208,0.14)',
      '--danger':'#bf616a','--danger-hover':'#d0727b','--success':'#a3be8c','--warning':'#ebcb8b',
      '--shadow-xs':'0 1px 2px rgba(0,0,0,0.25)',
      '--shadow-sm':'0 1px 3px rgba(0,0,0,0.35)',
      '--shadow-md':'0 4px 12px rgba(0,0,0,0.45)',
      '--shadow-lg':'0 8px 28px rgba(0,0,0,0.55)'
    }
  },
  {
    id: 'forest', name: 'Forest', mode: 'dark', isBuiltIn: true,
    description: 'Deep green woodland tones',
    tokens: {
      '--bg-primary':'#0d1a0f','--bg-secondary':'#122015','--bg-tertiary':'#18291b',
      '--bg-hover':'#1f3323','--bg-sidebar':'#0f1c12',
      '--text-primary':'#d8f0d0','--text-secondary':'#88b880','--text-muted':'#4a7050',
      '--border':'#1f3323','--border-strong':'#2a4030',
      '--accent':'#4ade80','--accent-hover':'#65e895','--accent-fg':'#0d1a0f',
      '--accent-soft':'rgba(74,222,128,0.12)',
      '--danger':'#f87171','--danger-hover':'#fc8181','--success':'#4ade80','--warning':'#fbbf24',
      '--shadow-xs':'0 1px 2px rgba(0,0,0,0.30)',
      '--shadow-sm':'0 1px 3px rgba(0,0,0,0.40)',
      '--shadow-md':'0 4px 12px rgba(0,0,0,0.50)',
      '--shadow-lg':'0 8px 28px rgba(0,0,0,0.60)'
    }
  }
]
