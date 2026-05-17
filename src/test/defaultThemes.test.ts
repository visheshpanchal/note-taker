import { describe, it, expect } from 'vitest'
import { BUILT_IN_THEMES } from '../utils/defaultThemes'

const REQUIRED_TOKENS = [
  '--bg-primary', '--bg-secondary', '--bg-tertiary', '--bg-hover', '--bg-sidebar',
  '--text-primary', '--text-secondary', '--text-muted',
  '--border', '--border-strong',
  '--accent', '--accent-hover', '--accent-fg', '--accent-soft',
  '--danger', '--danger-hover', '--success', '--warning',
  '--shadow-xs', '--shadow-sm', '--shadow-md', '--shadow-lg',
]

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

  it('includes at least one light and one dark theme', () => {
    const modes = BUILT_IN_THEMES.map(t => t.mode)
    expect(modes).toContain('light')
    expect(modes).toContain('dark')
  })

  it('every theme defines all required token keys', () => {
    BUILT_IN_THEMES.forEach(t => {
      REQUIRED_TOKENS.forEach(token => {
        expect(t.tokens).toHaveProperty(token)
        expect(typeof (t.tokens as Record<string, string>)[token]).toBe('string')
      })
    })
  })

  it('theme ids follow kebab-case pattern', () => {
    BUILT_IN_THEMES.forEach(t => {
      expect(t.id).toMatch(/^[a-z0-9-]+$/)
    })
  })
})
