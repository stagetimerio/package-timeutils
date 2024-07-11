import { expect } from 'chai'
import { isValidTimezone } from '../index.js'

describe('isValidTimezone', () => {
  it('should return true for a valid time zone', () => {
    expect(isValidTimezone('America/New_York')).to.be.true
  })

  it('should return false for an invalid time zone', () => {
    expect(isValidTimezone('Invalid/Timezone')).to.be.false
  })

  it('should return false for a valid GMT offset', () => {
    expect(isValidTimezone('GMT+01:00')).to.be.false
  })

  it('should throw an error if time zones are not available in the environment', () => {
    const originalIntl = global.Intl

    // Mock the absence of Intl
    global.Intl = undefined

    try {
      expect(() => isValidTimezone('America/New_York')).to.throw('Time zones are not available in this environment')
    } finally {
      // Restore the original Intl object
      global.Intl = originalIntl
    }
  })
})
