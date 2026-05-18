import { describe, it, expect } from 'vitest'
import { BUILT_IN_THEMES, MODE_DEFAULTS, ALL_TOKEN_KEYS, CURRENT_SCHEMA_VERSION } from '../utils/defaultThemes'
import { migrateTheme } from '../contexts/ThemeContext'
import type { Theme } from '../types'

// Every token that must be present in a fully-migrated theme.
// Derived from MODE_DEFAULTS so the test stays in sync automatically.
const REQUIRED_TOKENS = ALL_TOKEN_KEYS

describe('CURRENT_SCHEMA_VERSION', () => {
  it('is an integer >= 2', () => {
    expect(typeof CURRENT_SCHEMA_VERSION).toBe('number')
    expect(CURRENT_SCHEMA_VERSION).toBeGreaterThanOrEqual(2)
  })
})

describe('MODE_DEFAULTS', () => {
  it('defines the same token set for light and dark', () => {
    const lightKeys = Object.keys(MODE_DEFAULTS.light).sort()
    const darkKeys  = Object.keys(MODE_DEFAULTS.dark).sort()
    expect(lightKeys).toEqual(darkKeys)
  })

  it('includes --transition-slow', () => {
    expect(MODE_DEFAULTS.light).toHaveProperty('--transition-slow')
    expect(MODE_DEFAULTS.dark).toHaveProperty('--transition-slow')
  })

  it('includes all radius tokens', () => {
    const radiusTokens = ['--radius-xs','--radius-sm','--radius-md','--radius-lg','--radius-xl']
    for (const t of radiusTokens) {
      expect(MODE_DEFAULTS.light).toHaveProperty(t)
      expect(MODE_DEFAULTS.dark).toHaveProperty(t)
    }
  })

  it('includes font and layout tokens', () => {
    const extras = ['--font','--font-mono','--sidebar-width','--transition']
    for (const t of extras) {
      expect(MODE_DEFAULTS.light).toHaveProperty(t)
      expect(MODE_DEFAULTS.dark).toHaveProperty(t)
    }
  })

  it('all values are non-empty strings', () => {
    for (const mode of ['light', 'dark'] as const) {
      for (const [key, val] of Object.entries(MODE_DEFAULTS[mode])) {
        expect(typeof val, `${mode} ${key}`).toBe('string')
        expect(val.trim().length, `${mode} ${key} should not be empty`).toBeGreaterThan(0)
      }
    }
  })
})

describe('ALL_TOKEN_KEYS', () => {
  it('is a non-empty array of strings', () => {
    expect(Array.isArray(ALL_TOKEN_KEYS)).toBe(true)
    expect(ALL_TOKEN_KEYS.length).toBeGreaterThan(0)
  })

  it('contains every key from both mode defaults', () => {
    const allKeys = new Set([
      ...Object.keys(MODE_DEFAULTS.light),
      ...Object.keys(MODE_DEFAULTS.dark),
    ])
    for (const k of allKeys) {
      expect(ALL_TOKEN_KEYS).toContain(k)
    }
  })
})

describe('BUILT_IN_THEMES', () => {
  it('exports exactly 6 themes', () => {
    expect(BUILT_IN_THEMES).toHaveLength(6)
  })

  it('all themes are marked isBuiltIn', () => {
    BUILT_IN_THEMES.forEach(t => {
      expect(t.isBuiltIn).toBe(true)
    })
  })

  it('all theme ids are unique', () => {
    const ids = BUILT_IN_THEMES.map(t => t.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('every theme has required fields', () => {
    BUILT_IN_THEMES.forEach(t => {
      expect(t.id).toBeTruthy()
      expect(t.name).toBeTruthy()
      expect(t.mode === 'light' || t.mode === 'dark').toBe(true)
      expect(t.description).toBeTruthy()
      expect(typeof t.tokens).toBe('object')
    })
  })

  it('every built-in theme has schemaVersion equal to CURRENT_SCHEMA_VERSION', () => {
    BUILT_IN_THEMES.forEach(t => {
      expect(t.schemaVersion).toBe(CURRENT_SCHEMA_VERSION)
    })
  })

  it('includes at least one light and one dark theme', () => {
    const modes = BUILT_IN_THEMES.map(t => t.mode)
    expect(modes).toContain('light')
    expect(modes).toContain('dark')
  })

  it('every theme defines all required token keys', () => {
    BUILT_IN_THEMES.forEach(t => {
      REQUIRED_TOKENS.forEach(token => {
        expect(t.tokens, `${t.id} is missing ${token}`).toHaveProperty(token)
        expect(typeof (t.tokens as Record<string, string>)[token], `${t.id}.${token} must be string`).toBe('string')
      })
    })
  })

  it('theme ids follow kebab-case pattern', () => {
    BUILT_IN_THEMES.forEach(t => {
      expect(t.id).toMatch(/^[a-z0-9-]+$/)
    })
  })
})

describe('migrateTheme', () => {
  const baseV1Light: Theme = {
    id: 'test-light', name: 'Test Light', mode: 'light',
    isBuiltIn: false, description: 'test',
    tokens: {
      '--bg-primary': '#ffffff',
      '--accent':     '#ff0000',
    },
    // schemaVersion intentionally omitted → treated as v1
  }

  const baseV1Dark: Theme = {
    id: 'test-dark', name: 'Test Dark', mode: 'dark',
    isBuiltIn: false, description: 'test',
    tokens: {
      '--bg-primary': '#111111',
    },
    schemaVersion: 1,
  }

  it('stamps CURRENT_SCHEMA_VERSION after migration', () => {
    const result = migrateTheme(baseV1Light)
    expect(result.schemaVersion).toBe(CURRENT_SCHEMA_VERSION)
  })

  it('fills missing tokens from the correct mode defaults', () => {
    const result = migrateTheme(baseV1Light)
    // Missing light-mode token should be backfilled
    expect(result.tokens['--bg-secondary']).toBe(MODE_DEFAULTS.light['--bg-secondary'])
    // --transition-slow added in v2
    expect(result.tokens['--transition-slow']).toBe(MODE_DEFAULTS.light['--transition-slow'])
  })

  it('preserves existing token values from the original theme', () => {
    const result = migrateTheme(baseV1Light)
    expect(result.tokens['--bg-primary']).toBe('#ffffff')
    expect(result.tokens['--accent']).toBe('#ff0000')
  })

  it('fills dark-mode defaults for dark themes', () => {
    const result = migrateTheme(baseV1Dark)
    expect(result.tokens['--bg-secondary']).toBe(MODE_DEFAULTS.dark['--bg-secondary'])
    expect(result.tokens['--accent']).toBe(MODE_DEFAULTS.dark['--accent'])
  })

  it('does not re-migrate a theme already at CURRENT_SCHEMA_VERSION', () => {
    const alreadyCurrent: Theme = {
      id: 'current', name: 'Current', mode: 'light',
      isBuiltIn: false, description: 'test',
      tokens: { '--bg-primary': '#aabbcc' },
      schemaVersion: CURRENT_SCHEMA_VERSION,
    }
    const result = migrateTheme(alreadyCurrent)
    // Should return the same object reference (no-op)
    expect(result).toBe(alreadyCurrent)
  })

  it('migrated theme has every required token', () => {
    const result = migrateTheme(baseV1Dark)
    REQUIRED_TOKENS.forEach(token => {
      expect(result.tokens, `migrated theme missing ${token}`).toHaveProperty(token)
    })
  })
})
