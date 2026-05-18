import type { AppData } from '../types'

export const CURRENT_DATA_VERSION = 1

export type SchemaMismatch =
  | { kind: 'not_object' }
  | { kind: 'missing_field'; field: string }
  | { kind: 'wrong_type'; field: string; expected: string; got: string }
  | { kind: 'version_mismatch'; found: number; expected: number }

const REQUIRED_ARRAYS: Array<keyof AppData> = [
  'notes', 'templates', 'tags', 'notebooks', 'folders', 'categories',
]

export function validateAppData(raw: unknown): SchemaMismatch | null {
  if (raw === null || raw === undefined || typeof raw !== 'object' || Array.isArray(raw)) {
    return { kind: 'not_object' }
  }

  const obj = raw as Record<string, unknown>

  if (typeof obj.version !== 'number') {
    return { kind: 'missing_field', field: 'version' }
  }
  if (obj.version !== CURRENT_DATA_VERSION) {
    return { kind: 'version_mismatch', found: obj.version, expected: CURRENT_DATA_VERSION }
  }

  for (const field of REQUIRED_ARRAYS) {
    if (!(field in obj)) return { kind: 'missing_field', field }
    if (!Array.isArray(obj[field])) {
      return { kind: 'wrong_type', field, expected: 'array', got: typeof obj[field] }
    }
  }

  if (!('settings' in obj)) return { kind: 'missing_field', field: 'settings' }
  if (typeof obj.settings !== 'object' || obj.settings === null || Array.isArray(obj.settings)) {
    return { kind: 'wrong_type', field: 'settings', expected: 'object', got: typeof obj.settings }
  }

  if (!('metadata' in obj)) return { kind: 'missing_field', field: 'metadata' }
  if (typeof obj.metadata !== 'object' || obj.metadata === null || Array.isArray(obj.metadata)) {
    return { kind: 'wrong_type', field: 'metadata', expected: 'object', got: typeof obj.metadata }
  }

  return null
}

export function mismatchSummary(m: SchemaMismatch): string {
  switch (m.kind) {
    case 'not_object':
      return 'The file does not contain a valid data object.'
    case 'missing_field':
      return `Required field "${m.field}" is missing.`
    case 'wrong_type':
      return `Field "${m.field}" must be ${m.expected} but found ${m.got}.`
    case 'version_mismatch':
      return `Data version ${m.found} is not compatible with version ${m.expected}.`
  }
}
