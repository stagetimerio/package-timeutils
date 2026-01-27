import { expect } from 'chai'
import { formatTimeOfDay, formatHasSeconds } from '../src/index'

// Test date: 2023-06-17T15:10:30Z (3:10:30 PM UTC)
const DATE_WITH_SECONDS = new Date('2023-06-17T15:10:30Z')
// Test date: 2023-06-17T15:10:00Z (3:10:00 PM UTC)
const DATE_NO_SECONDS = new Date('2023-06-17T15:10:00Z')
// Test date for leading zero: 2023-06-17T05:10:30Z (5:10:30 AM UTC)
const DATE_SINGLE_DIGIT_HOUR = new Date('2023-06-17T05:10:30Z')

describe('formatHasSeconds', () => {
  it('should return true for formats with :ss', () => {
    expect(formatHasSeconds('H:mm:ss')).to.equal(true)
    expect(formatHasSeconds('h:mm:ss aa')).to.equal(true)
    expect(formatHasSeconds('h:mm:ss')).to.equal(true)
  })

  it('should return false for formats without :ss', () => {
    expect(formatHasSeconds('H:mm')).to.equal(false)
    expect(formatHasSeconds('h:mm aa')).to.equal(false)
    expect(formatHasSeconds('h:mm')).to.equal(false)
  })
})

describe('formatTimeOfDay', () => {
  // ── Concrete format values ──────────────────────────────────

  describe('H:mm:ss (24h with seconds)', () => {
    it('should format correctly', () => {
      expect(formatTimeOfDay(DATE_WITH_SECONDS, { format: 'H:mm:ss' })).to.equal('15:10:30')
    })

    it('should show zero seconds', () => {
      expect(formatTimeOfDay(DATE_NO_SECONDS, { format: 'H:mm:ss' })).to.equal('15:10:00')
    })
  })

  describe('H:mm (24h without seconds)', () => {
    it('should format correctly', () => {
      expect(formatTimeOfDay(DATE_WITH_SECONDS, { format: 'H:mm' })).to.equal('15:10')
    })
  })

  describe('h:mm:ss aa (12h with seconds and AM/PM)', () => {
    it('should format PM correctly', () => {
      expect(formatTimeOfDay(DATE_WITH_SECONDS, { format: 'h:mm:ss aa' })).to.equal('3:10:30 PM')
    })

    it('should format AM correctly', () => {
      expect(formatTimeOfDay(DATE_SINGLE_DIGIT_HOUR, { format: 'h:mm:ss aa' })).to.equal('5:10:30 AM')
    })
  })

  describe('h:mm aa (12h without seconds, with AM/PM)', () => {
    it('should format correctly', () => {
      expect(formatTimeOfDay(DATE_WITH_SECONDS, { format: 'h:mm aa' })).to.equal('3:10 PM')
    })
  })

  describe('h:mm:ss (12h with seconds, no AM/PM)', () => {
    it('should format correctly', () => {
      expect(formatTimeOfDay(DATE_WITH_SECONDS, { format: 'h:mm:ss' })).to.equal('3:10:30')
    })
  })

  describe('h:mm (12h without seconds, no AM/PM)', () => {
    it('should format correctly', () => {
      expect(formatTimeOfDay(DATE_WITH_SECONDS, { format: 'h:mm' })).to.equal('3:10')
    })
  })

  // ── Default (no options) ───────────────────────────────────────

  describe('default (no options)', () => {
    it('should use H:mm:ss in UTC', () => {
      expect(formatTimeOfDay(DATE_WITH_SECONDS)).to.equal('15:10:30')
    })

    it('should show zero seconds', () => {
      expect(formatTimeOfDay(DATE_NO_SECONDS)).to.equal('15:10:00')
    })
  })

  // ── seconds override ──────────────────────────────────────────

  describe('seconds override', () => {
    describe('seconds: "never"', () => {
      it('should strip seconds from H:mm:ss', () => {
        expect(formatTimeOfDay(DATE_WITH_SECONDS, { format: 'H:mm:ss', seconds: 'never' })).to.equal('15:10')
      })

      it('should strip seconds from h:mm:ss aa', () => {
        expect(formatTimeOfDay(DATE_WITH_SECONDS, { format: 'h:mm:ss aa', seconds: 'never' })).to.equal('3:10 PM')
      })

      it('should strip seconds from h:mm:ss', () => {
        expect(formatTimeOfDay(DATE_WITH_SECONDS, { format: 'h:mm:ss', seconds: 'never' })).to.equal('3:10')
      })

      it('should not affect H:mm (already no seconds)', () => {
        expect(formatTimeOfDay(DATE_WITH_SECONDS, { format: 'H:mm', seconds: 'never' })).to.equal('15:10')
      })

      it('should not affect h:mm aa (already no seconds)', () => {
        expect(formatTimeOfDay(DATE_WITH_SECONDS, { format: 'h:mm aa', seconds: 'never' })).to.equal('3:10 PM')
      })
    })

    describe('seconds: "nonzero"', () => {
      it('should show seconds when nonzero (H:mm:ss)', () => {
        expect(formatTimeOfDay(DATE_WITH_SECONDS, { format: 'H:mm:ss', seconds: 'nonzero' })).to.equal('15:10:30')
      })

      it('should hide seconds when zero (H:mm:ss)', () => {
        expect(formatTimeOfDay(DATE_NO_SECONDS, { format: 'H:mm:ss', seconds: 'nonzero' })).to.equal('15:10')
      })

      it('should show seconds when nonzero (h:mm:ss aa)', () => {
        expect(formatTimeOfDay(DATE_WITH_SECONDS, { format: 'h:mm:ss aa', seconds: 'nonzero' })).to.equal('3:10:30 PM')
      })

      it('should hide seconds when zero (h:mm:ss aa)', () => {
        expect(formatTimeOfDay(DATE_NO_SECONDS, { format: 'h:mm:ss aa', seconds: 'nonzero' })).to.equal('3:10 PM')
      })

      it('should not add seconds to H:mm (most restrictive wins)', () => {
        expect(formatTimeOfDay(DATE_WITH_SECONDS, { format: 'H:mm', seconds: 'nonzero' })).to.equal('15:10')
      })

      it('should not add seconds to h:mm aa (most restrictive wins)', () => {
        expect(formatTimeOfDay(DATE_WITH_SECONDS, { format: 'h:mm aa', seconds: 'nonzero' })).to.equal('3:10 PM')
      })
    })
  })

  // ── leadingZero ────────────────────────────────────────────────

  describe('leadingZero', () => {
    it('should add leading zero to 24h format', () => {
      expect(formatTimeOfDay(DATE_SINGLE_DIGIT_HOUR, { format: 'H:mm:ss', leadingZero: true })).to.equal('05:10:30')
    })

    it('should not add leading zero to 24h format by default', () => {
      expect(formatTimeOfDay(DATE_SINGLE_DIGIT_HOUR, { format: 'H:mm:ss' })).to.equal('5:10:30')
    })

    it('should add leading zero to 12h format', () => {
      expect(formatTimeOfDay(DATE_SINGLE_DIGIT_HOUR, { format: 'h:mm:ss', leadingZero: true })).to.equal('05:10:30')
    })

    it('should add leading zero to 12h AM/PM format', () => {
      expect(formatTimeOfDay(DATE_SINGLE_DIGIT_HOUR, { format: 'h:mm:ss aa', leadingZero: true })).to.equal('05:10:30 AM')
    })

    it('should add leading zero to H:mm format', () => {
      expect(formatTimeOfDay(DATE_SINGLE_DIGIT_HOUR, { format: 'H:mm', leadingZero: true })).to.equal('05:10')
    })

    it('should add leading zero to h:mm aa format', () => {
      expect(formatTimeOfDay(DATE_SINGLE_DIGIT_HOUR, { format: 'h:mm aa', leadingZero: true })).to.equal('05:10 AM')
    })
  })

  // ── Timezone support ───────────────────────────────────────────

  describe('timezone support', () => {
    describe('Europe/Berlin (UTC+2 in summer)', () => {
      it('should format 24h correctly', () => {
        expect(formatTimeOfDay(DATE_WITH_SECONDS, { format: 'H:mm:ss', timezone: 'Europe/Berlin' })).to.equal('17:10:30')
      })

      it('should format 12h correctly', () => {
        expect(formatTimeOfDay(DATE_WITH_SECONDS, { format: 'h:mm:ss', timezone: 'Europe/Berlin' })).to.equal('5:10:30')
      })

      it('should format 12h AM/PM correctly', () => {
        expect(formatTimeOfDay(DATE_WITH_SECONDS, { format: 'h:mm:ss aa', timezone: 'Europe/Berlin' })).to.equal('5:10:30 PM')
      })
    })

    describe('Australia/Sydney (UTC+10 in winter)', () => {
      it('should format 24h correctly', () => {
        expect(formatTimeOfDay(DATE_WITH_SECONDS, { format: 'H:mm:ss', timezone: 'Australia/Sydney' })).to.equal('1:10:30')
      })

      it('should format 12h correctly', () => {
        expect(formatTimeOfDay(DATE_WITH_SECONDS, { format: 'h:mm:ss', timezone: 'Australia/Sydney' })).to.equal('1:10:30')
      })

      it('should format 12h AM/PM correctly', () => {
        expect(formatTimeOfDay(DATE_WITH_SECONDS, { format: 'h:mm:ss aa', timezone: 'Australia/Sydney' })).to.equal('1:10:30 AM')
      })
    })

    describe('America/Los_Angeles (UTC-7 in summer)', () => {
      it('should format 24h correctly', () => {
        expect(formatTimeOfDay(DATE_WITH_SECONDS, { format: 'H:mm:ss', timezone: 'America/Los_Angeles' })).to.equal('8:10:30')
      })

      it('should format 12h correctly', () => {
        expect(formatTimeOfDay(DATE_WITH_SECONDS, { format: 'h:mm:ss', timezone: 'America/Los_Angeles' })).to.equal('8:10:30')
      })

      it('should format 12h AM/PM correctly', () => {
        expect(formatTimeOfDay(DATE_WITH_SECONDS, { format: 'h:mm:ss aa', timezone: 'America/Los_Angeles' })).to.equal('8:10:30 AM')
      })
    })
  })

  // ── Error handling ─────────────────────────────────────────────

  describe('error handling', () => {
    it('should return --:-- for non-Date input', () => {
      expect(formatTimeOfDay('not a date' as any)).to.equal('--:--')
      expect(formatTimeOfDay(null as any)).to.equal('--:--')
      expect(formatTimeOfDay(undefined as any)).to.equal('--:--')
    })

    it('should return --:-- for invalid timezone', () => {
      expect(formatTimeOfDay(DATE_WITH_SECONDS, { timezone: 'Invalid/Timezone' })).to.equal('--:--')
    })
  })
})
