import { describe, it, expect } from 'vitest'
import { getLocationTag, formatLocation } from '../utils/location.js'

describe('getLocationTag', () => {
  it('returns a non-empty timezone string', () => {
    const tz = getLocationTag()
    expect(typeof tz).toBe('string')
    expect(tz.length).toBeGreaterThan(0)
  })
})

describe('formatLocation', () => {
  it('extracts the city name from a tz string', () => {
    expect(formatLocation('America/New_York')).toBe('New York')
    expect(formatLocation('Europe/London')).toBe('London')
    expect(formatLocation('Asia/Kolkata')).toBe('Kolkata')
  })

  it('handles a timezone with no slash', () => {
    expect(formatLocation('UTC')).toBe('UTC')
  })

  it('returns empty string for falsy input', () => {
    expect(formatLocation('')).toBe('')
    expect(formatLocation(null)).toBe('')
    expect(formatLocation(undefined)).toBe('')
  })
})
