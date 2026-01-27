import { expect } from 'chai'
import { dhmsToDigits } from '../src/index'
import type { DHMS } from '../src/index'

function makeDhms (overrides: Partial<DHMS> = {}): DHMS {
  return { negative: 0, days: 0, hours: 0, minutes: 0, seconds: 0, decimals: 0, ...overrides }
}

function join (dhms: DHMS, opts?: Parameters<typeof dhmsToDigits>[1]): string {
  return dhmsToDigits(dhms, opts).join('')
}

describe('dhmsToDigits', () => {
  describe('default format (HHHMMSS)', () => {
    test('zero duration', () => {
      expect(join(makeDhms())).to.equal('0:00')
    })

    test('5 minutes', () => {
      expect(join(makeDhms({ minutes: 5 }))).to.equal('5:00')
    })

    test('1 hour 30 minutes', () => {
      expect(join(makeDhms({ hours: 1, minutes: 30 }))).to.equal('1:30:00')
    })

    test('1 hour 2 minutes 3 seconds', () => {
      expect(join(makeDhms({ hours: 1, minutes: 2, seconds: 3 }))).to.equal('1:02:03')
    })

    test('negative duration', () => {
      expect(join(makeDhms({ negative: 1, minutes: 5, seconds: 30 }))).to.equal('+5:30')
    })

    test('100+ hours (days overflow into hours)', () => {
      expect(join(makeDhms({ days: 5, hours: 3, minutes: 45, seconds: 6 }))).to.equal('123:45:06')
    })
  })

  describe('DHHMMSS format', () => {
    test('1 day 5 hours 30 minutes', () => {
      expect(join(makeDhms({ days: 1, hours: 5, minutes: 30 }), { format: 'DHHMMSS' })).to.equal('1:05:30:00')
    })

    test('0 days hidden by default', () => {
      expect(join(makeDhms({ hours: 5, minutes: 30 }), { format: 'DHHMMSS' })).to.equal('5:30:00')
    })
  })

  describe('DHHMMSSF format', () => {
    test('with decimals', () => {
      expect(join(makeDhms({ days: 1, hours: 17, minutes: 30, seconds: 59, decimals: 5 }), { format: 'DHHMMSSF' })).to.equal('1:17:30:59.5')
    })
  })

  describe('HHHMMSSF format', () => {
    test('with decimals', () => {
      expect(join(makeDhms({ hours: 1, minutes: 30, seconds: 59, decimals: 5 }), { format: 'HHHMMSSF' })).to.equal('1:30:59.5')
    })
  })

  describe('MMMSS format', () => {
    test('90 minutes 30 seconds (hours overflow into minutes)', () => {
      expect(join(makeDhms({ hours: 1, minutes: 30, seconds: 30 }), { format: 'MMMSS' })).to.equal('90:30')
    })

    test('5 minutes', () => {
      expect(join(makeDhms({ minutes: 5 }), { format: 'MMMSS' })).to.equal('5:00')
    })
  })

  describe('MMMSSF format', () => {
    test('with decimals (hours overflow into minutes)', () => {
      expect(join(makeDhms({ hours: 3, minutes: 50, seconds: 59, decimals: 5 }), { format: 'MMMSSF' })).to.equal('230:59.5')
    })
  })

  describe('SSS format', () => {
    test('minutes overflow into seconds', () => {
      expect(join(makeDhms({ minutes: 1, seconds: 32 }), { format: 'SSS' })).to.equal('92')
    })
  })

  describe('SSSF format', () => {
    test('with decimals (minutes overflow into seconds)', () => {
      expect(join(makeDhms({ minutes: 1, seconds: 32, decimals: 5 }), { format: 'SSSF' })).to.equal('92.5')
    })
  })

  describe('letter formats', () => {
    test('L_DHMS basic', () => {
      expect(join(makeDhms({ days: 1, hours: 17, minutes: 30, seconds: 59 }), { format: 'L_DHMS' })).to.equal('1d 17h 30m 59s')
    })

    test('L_HMS (days overflow into hours)', () => {
      expect(join(makeDhms({ days: 1, hours: 17, minutes: 30, seconds: 59 }), { format: 'L_HMS' })).to.equal('41h 30m 59s')
    })

    test('L_MS (hours overflow into minutes)', () => {
      expect(join(makeDhms({ hours: 3, minutes: 50, seconds: 59 }), { format: 'L_MS' })).to.equal('230m 59s')
    })

    test('L_S (minutes overflow into seconds)', () => {
      expect(join(makeDhms({ minutes: 1, seconds: 32 }), { format: 'L_S' })).to.equal('92s')
    })

    test('L_D', () => {
      expect(join(makeDhms({ days: 2 }), { format: 'L_D' })).to.equal('2d')
    })

    test('L_DH', () => {
      expect(join(makeDhms({ days: 1, hours: 18 }), { format: 'L_DH' })).to.equal('1d 18h')
    })

    test('L_DHM', () => {
      expect(join(makeDhms({ days: 1, hours: 17, minutes: 30 }), { format: 'L_DHM' })).to.equal('1d 17h 30m')
    })

    test('L_DHMS with zero hours shows 0h (default trailingZeros=always)', () => {
      expect(join(makeDhms({ days: 1, minutes: 30 }), { format: 'L_DHMS' })).to.equal('1d 0h 30m 00s')
    })
  })

  describe('leadingZeros option', () => {
    test('always: show zero hours', () => {
      expect(join(makeDhms({ minutes: 5, seconds: 30 }), { leadingZeros: 'always' })).to.equal('0:05:30')
    })

    test('always: show zero hours for zero duration', () => {
      expect(join(makeDhms(), { leadingZeros: 'always' })).to.equal('0:00:00')
    })

    test('always: with DHHMMSS shows zero days', () => {
      expect(join(makeDhms({ hours: 5, minutes: 30 }), { format: 'DHHMMSS', leadingZeros: 'always' })).to.equal('0:05:30:00')
    })

    test('nonzero: hide zero hours (default)', () => {
      expect(join(makeDhms({ minutes: 5, seconds: 30 }))).to.equal('5:30')
    })

    test('always with L_DHMS: show zero days and hours', () => {
      expect(join(makeDhms({ minutes: 5, seconds: 30 }), { format: 'L_DHMS', leadingZeros: 'always' })).to.equal('0d 0h 5m 30s')
    })

    test('always with L_HMS: show zero hours', () => {
      expect(join(makeDhms({ minutes: 5, seconds: 30 }), { format: 'L_HMS', leadingZeros: 'always' })).to.equal('0h 5m 30s')
    })

    test('nonzero with L_DHMS: hide zero days and hours', () => {
      expect(join(makeDhms({ minutes: 5, seconds: 30 }), { format: 'L_DHMS' })).to.equal('5m 30s')
    })
  })

  describe('trailingZeros option', () => {
    test('nonzero with letter format: skip all zero components', () => {
      expect(join(makeDhms({ days: 1, minutes: 30 }), { format: 'L_DHMS', trailingZeros: 'nonzero' })).to.equal('1d 30m')
    })

    test('nonzero with letter format: skip trailing seconds', () => {
      expect(join(makeDhms({ hours: 1, minutes: 30 }), { format: 'L_DHMS', trailingZeros: 'nonzero' })).to.equal('1h 30m')
    })

    test('nonzero with letter format: all zeros fallback', () => {
      expect(join(makeDhms(), { format: 'L_DHMS', trailingZeros: 'nonzero' })).to.equal('0s')
    })

    test('nonzero with colon format: skip trailing seconds', () => {
      expect(join(makeDhms({ hours: 1, minutes: 30 }), { trailingZeros: 'nonzero' })).to.equal('1:30')
    })

    test('nonzero with colon format: keep middle zeros', () => {
      expect(join(makeDhms({ hours: 1, seconds: 30 }), { trailingZeros: 'nonzero' })).to.equal('1:00:30')
    })

    test('never: remove lowest component', () => {
      expect(join(makeDhms({ hours: 1, minutes: 30, seconds: 45 }), { trailingZeros: 'never' })).to.equal('1:30')
    })
  })

  describe('overtimePrefix', () => {
    test('custom prefix', () => {
      expect(join(makeDhms({ negative: 1, minutes: 5, seconds: 30 }), { overtimePrefix: '-' })).to.equal('-5:30')
    })

    test('no prefix for positive', () => {
      expect(join(makeDhms({ minutes: 5, seconds: 30 }), { overtimePrefix: '-' })).to.equal('5:30')
    })

    test('no prefix for zero', () => {
      expect(join(makeDhms({ negative: 1 }), { overtimePrefix: '+' })).to.equal('0:00')
    })

    test('show prefix for zero with decimals format', () => {
      expect(join(makeDhms({ negative: 1 }), { format: 'HHHMMSSF' })).to.equal('+0:00.0')
    })
  })

  describe('edge cases', () => {
    test('large numbers (999 days)', () => {
      expect(join(makeDhms({ days: 999, hours: 23, minutes: 59, seconds: 59, decimals: 9 }), { format: 'DHHMMSSF' })).to.equal('999:23:59:59.9')
    })

    test('hours > 1000 when days not shown', () => {
      expect(join(makeDhms({ days: 50, minutes: 30, seconds: 45 }))).to.equal('1200:30:45')
    })

    test('minutes > 1000 when hours not shown', () => {
      expect(join(makeDhms({ days: 1, minutes: 30, seconds: 45 }), { format: 'MMMSS' })).to.equal('1470:45')
    })

    test('seconds > 1000 when minutes not shown', () => {
      expect(join(makeDhms({ hours: 1, seconds: 45 }), { format: 'SSS' })).to.equal('3645')
    })

    test('round up days when hiding smaller units with remainder', () => {
      expect(join(makeDhms({ days: 0, hours: 1, minutes: 30, seconds: 45 }), { format: 'L_D' })).to.equal('1d')
    })
  })

  describe('padding behavior', () => {
    test('pad hours to 2 digits when days shown with colon separator', () => {
      expect(join(makeDhms({ days: 1, hours: 5, minutes: 30, seconds: 45 }), { format: 'DHHMMSS' })).to.equal('1:05:30:45')
    })

    test('pad minutes to 2 digits when hours shown with colon separator', () => {
      expect(join(makeDhms({ hours: 2, minutes: 5, seconds: 45 }))).to.equal('2:05:45')
    })

    test('pad seconds to 2 digits', () => {
      expect(join(makeDhms({ minutes: 5, seconds: 5 }), { format: 'MMMSS' })).to.equal('5:05')
    })
  })
})
