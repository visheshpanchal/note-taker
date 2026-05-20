import { describe, it, expect } from 'vitest'
import { validateAppData, mismatchSummary, CURRENT_DATA_VERSION } from '../utils/schemaValidation'
import { createDefaultData } from '../utils/noteFactory'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function validPayload() {
  return {
    $schema: 'https://json-schema.org/draft-07/schema',
    version: CURRENT_DATA_VERSION,
    settings: { theme: 'system' },
    notes: [],
    templates: [],
    tags: [],
    notebooks: [],
    folders: [],
    categories: [],
    customFields: {},
    metadata: { createdAt: new Date().toISOString(), lastModified: new Date().toISOString() },
  }
}

// ─── validateAppData ──────────────────────────────────────────────────────────

describe('validateAppData — structural guards', () => {
  it('returns not_object for null', () => {
    expect(validateAppData(null)).toEqual({ kind: 'not_object' })
  })

  it('returns not_object for undefined', () => {
    expect(validateAppData(undefined)).toEqual({ kind: 'not_object' })
  })

  it('returns not_object for a string', () => {
    expect(validateAppData('{"version":1}')).toEqual({ kind: 'not_object' })
  })

  it('returns not_object for a number', () => {
    expect(validateAppData(42)).toEqual({ kind: 'not_object' })
  })

  it('returns not_object for an array', () => {
    expect(validateAppData([])).toEqual({ kind: 'not_object' })
  })
})

describe('validateAppData — version field', () => {
  it('returns missing_field for version when version key is absent', () => {
    const { version: _, ...noVersion } = validPayload()
    expect(validateAppData(noVersion)).toEqual({ kind: 'missing_field', field: 'version' })
  })

  it('returns missing_field for version when version is a string', () => {
    expect(validateAppData({ ...validPayload(), version: '1' })).toEqual({ kind: 'missing_field', field: 'version' })
  })

  it('returns missing_field for version when version is null', () => {
    expect(validateAppData({ ...validPayload(), version: null })).toEqual({ kind: 'missing_field', field: 'version' })
  })

  it('returns version_mismatch when version is a future number', () => {
    const found = CURRENT_DATA_VERSION + 1
    expect(validateAppData({ ...validPayload(), version: found })).toEqual({
      kind: 'version_mismatch',
      found,
      expected: CURRENT_DATA_VERSION,
    })
  })

  it('returns version_mismatch when version is 0', () => {
    expect(validateAppData({ ...validPayload(), version: 0 })).toEqual({
      kind: 'version_mismatch',
      found: 0,
      expected: CURRENT_DATA_VERSION,
    })
  })
})

describe('validateAppData — required array fields', () => {
  const arrayFields = ['notes', 'templates', 'tags', 'notebooks', 'folders', 'categories'] as const

  for (const field of arrayFields) {
    it(`returns missing_field when "${field}" is absent`, () => {
      const payload = { ...validPayload() }
      delete (payload as Record<string, unknown>)[field]
      expect(validateAppData(payload)).toEqual({ kind: 'missing_field', field })
    })

    it(`returns wrong_type when "${field}" is a string`, () => {
      expect(validateAppData({ ...validPayload(), [field]: 'bad' })).toEqual({
        kind: 'wrong_type',
        field,
        expected: 'array',
        got: 'string',
      })
    })

    it(`returns wrong_type when "${field}" is an object`, () => {
      expect(validateAppData({ ...validPayload(), [field]: {} })).toEqual({
        kind: 'wrong_type',
        field,
        expected: 'array',
        got: 'object',
      })
    })
  }
})

describe('validateAppData — settings field', () => {
  it('returns missing_field when settings is absent', () => {
    const { settings: _, ...noSettings } = validPayload()
    expect(validateAppData(noSettings)).toEqual({ kind: 'missing_field', field: 'settings' })
  })

  it('returns wrong_type when settings is a string', () => {
    expect(validateAppData({ ...validPayload(), settings: 'bad' })).toEqual({
      kind: 'wrong_type',
      field: 'settings',
      expected: 'object',
      got: 'string',
    })
  })

  it('returns wrong_type when settings is an array', () => {
    expect(validateAppData({ ...validPayload(), settings: [] })).toEqual({
      kind: 'wrong_type',
      field: 'settings',
      expected: 'object',
      got: 'object',
    })
  })

  it('returns wrong_type when settings is null', () => {
    expect(validateAppData({ ...validPayload(), settings: null })).toEqual({
      kind: 'wrong_type',
      field: 'settings',
      expected: 'object',
      got: 'object',
    })
  })
})

describe('validateAppData — metadata field', () => {
  it('returns missing_field when metadata is absent', () => {
    const { metadata: _, ...noMeta } = validPayload()
    expect(validateAppData(noMeta)).toEqual({ kind: 'missing_field', field: 'metadata' })
  })

  it('returns wrong_type when metadata is a string', () => {
    expect(validateAppData({ ...validPayload(), metadata: 'bad' })).toEqual({
      kind: 'wrong_type',
      field: 'metadata',
      expected: 'object',
      got: 'string',
    })
  })
})

describe('validateAppData — valid data', () => {
  it('returns null for a fully valid payload', () => {
    expect(validateAppData(validPayload())).toBeNull()
  })

  it('returns null for data produced by createDefaultData()', () => {
    expect(validateAppData(createDefaultData())).toBeNull()
  })

  it('returns null when extra unknown fields are present', () => {
    expect(validateAppData({ ...validPayload(), unknown_extra: true })).toBeNull()
  })

  it('returns null when notes array contains items (no deep validation)', () => {
    const payload = { ...validPayload(), notes: [{ id: '1', type: 'note', title: 'Hi' }] }
    expect(validateAppData(payload)).toBeNull()
  })
})

// ─── mismatchSummary ─────────────────────────────────────────────────────────

describe('mismatchSummary', () => {
  it('formats not_object', () => {
    const msg = mismatchSummary({ kind: 'not_object' })
    expect(msg).toMatch(/valid data object/i)
  })

  it('formats missing_field', () => {
    const msg = mismatchSummary({ kind: 'missing_field', field: 'notes' })
    expect(msg).toContain('"notes"')
    expect(msg).toMatch(/missing/i)
  })

  it('formats wrong_type', () => {
    const msg = mismatchSummary({ kind: 'wrong_type', field: 'notes', expected: 'array', got: 'string' })
    expect(msg).toContain('"notes"')
    expect(msg).toContain('array')
    expect(msg).toContain('string')
  })

  it('formats version_mismatch with both versions', () => {
    const msg = mismatchSummary({ kind: 'version_mismatch', found: 2, expected: 1 })
    expect(msg).toContain('2')
    expect(msg).toContain('1')
  })
})
