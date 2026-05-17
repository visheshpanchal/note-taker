import { describe, it, expect } from 'vitest'
import { BUILT_IN_CATEGORIES, CATEGORY_COLORS, getCategoryById } from '../utils/categories.js'

describe('BUILT_IN_CATEGORIES', () => {
  it('contains 8 built-in categories', () => {
    expect(BUILT_IN_CATEGORIES).toHaveLength(8)
  })

  it('every category has required fields', () => {
    BUILT_IN_CATEGORIES.forEach(cat => {
      expect(cat).toHaveProperty('id')
      expect(cat).toHaveProperty('label')
      expect(cat).toHaveProperty('icon')
      expect(cat).toHaveProperty('color')
      expect(cat.isBuiltIn).toBe(true)
    })
  })

  it('all color values are valid hex strings', () => {
    BUILT_IN_CATEGORIES.forEach(cat => {
      expect(cat.color).toMatch(/^#[0-9a-f]{6}$/i)
    })
  })
})

describe('CATEGORY_COLORS', () => {
  it('is a non-empty array of hex strings', () => {
    expect(CATEGORY_COLORS.length).toBeGreaterThan(0)
    CATEGORY_COLORS.forEach(c => expect(c).toMatch(/^#[0-9a-f]{6}$/i))
  })
})

describe('getCategoryById', () => {
  it('finds a built-in category by id', () => {
    const cat = getCategoryById('work')
    expect(cat).not.toBeNull()
    expect(cat.label).toBe('Work')
  })

  it('returns null for unknown id', () => {
    expect(getCategoryById('nonexistent')).toBeNull()
  })

  it('searches a custom list when provided', () => {
    const custom = [{ id: 'custom-1', label: 'Custom', icon: '🔧', color: '#000000', isBuiltIn: false }]
    expect(getCategoryById('custom-1', custom)).toEqual(custom[0])
    expect(getCategoryById('personal', custom)).toBeNull()
  })
})
