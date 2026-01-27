import { expect } from 'chai'
import { formatDuration } from '../src/index'

describe('formatDuration', () => {
  describe('default format (HHHMMSS)', () => {
    test('zero', () => {
      expect(formatDuration(0)).to.equal('0:00')
    })

    test('5 minutes', () => {
      expect(formatDuration(300000)).to.equal('5:00')
    })

    test('1 hour 30 minutes', () => {
      expect(formatDuration(5400000)).to.equal('1:30:00')
    })

    test('1 hour 2 minutes 3 seconds', () => {
      expect(formatDuration(3723000)).to.equal('1:02:03')
    })

    test('sub-second rounds up (ceil)', () => {
      expect(formatDuration(500)).to.equal('0:01')
    })

    test('sub-second with ceil=false rounds down', () => {
      expect(formatDuration(500, { ceil: false })).to.equal('0:00')
    })
  })

  describe('MMMSS format', () => {
    test('90 minutes 30 seconds', () => {
      expect(formatDuration(5430000, { format: 'MMMSS' })).to.equal('90:30')
    })
  })

  describe('MMMSSF format', () => {
    test('5 minutes 30.5 seconds', () => {
      expect(formatDuration(330500, { format: 'MMMSSF', ceil: false })).to.equal('5:30.5')
    })
  })

  describe('HHHMMSSF format', () => {
    test('1 hour 30 minutes 59.5 seconds', () => {
      expect(formatDuration(5459500, { format: 'HHHMMSSF', ceil: false })).to.equal('1:30:59.5')
    })
  })

  describe('DHHMMSS format', () => {
    test('1 day 5 hours', () => {
      expect(formatDuration(104400000, { format: 'DHHMMSS' })).to.equal('1:05:00:00')
    })
  })

  describe('letter format L_DHMS', () => {
    test('1 day 17 hours 30 minutes 59 seconds', () => {
      expect(formatDuration(149459000, { format: 'L_DHMS' })).to.equal('1d 17h 30m 59s')
    })
  })

  describe('leadingZeros option', () => {
    test('always: show zero hours', () => {
      expect(formatDuration(330000, { leadingZeros: 'always' })).to.equal('0:05:30')
    })

    test('always: zero duration', () => {
      expect(formatDuration(0, { leadingZeros: 'always' })).to.equal('0:00:00')
    })

    test('nonzero: hide zero hours (default)', () => {
      expect(formatDuration(330000)).to.equal('5:30')
    })
  })

  describe('trailingZeros option', () => {
    test('nonzero with L_DHMS: skip zero components', () => {
      expect(formatDuration(5400000, { format: 'L_DHMS', trailingZeros: 'nonzero' })).to.equal('1h 30m')
    })

    test('nonzero with L_DHMS: zero duration fallback', () => {
      expect(formatDuration(0, { format: 'L_DHMS', trailingZeros: 'nonzero' })).to.equal('0s')
    })

    test('nonzero with L_DHMS: days only', () => {
      expect(formatDuration(86400000, { format: 'L_DHMS', trailingZeros: 'nonzero' })).to.equal('1d')
    })

    test('nonzero with L_DHMS: skip middle zeros', () => {
      expect(formatDuration(90030000, { format: 'L_DHMS', trailingZeros: 'nonzero' })).to.equal('1d 1h 30s')
    })
  })

  describe('overtimePrefix', () => {
    test('negative with prefix', () => {
      expect(formatDuration(-330000, { overtimePrefix: '+' })).to.equal('+5:30')
    })

    test('negative without prefix (default)', () => {
      expect(formatDuration(-330000)).to.equal('5:30')
    })

    test('positive with prefix configured', () => {
      expect(formatDuration(330000, { overtimePrefix: '+' })).to.equal('5:30')
    })
  })

  describe('invalid input', () => {
    test('NaN returns empty string', () => {
      expect(formatDuration(NaN)).to.equal('')
    })

    test('non-number returns empty string', () => {
      // @ts-expect-error testing invalid input
      expect(formatDuration('abc')).to.equal('')
    })

    test('undefined returns default', () => {
      expect(formatDuration(undefined)).to.equal('0:00')
    })
  })
})
