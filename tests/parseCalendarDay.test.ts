import { expect } from 'chai'
import { parseCalendarDay } from '../src/index'

describe('parseCalendarDay', () => {
  // -----------------------------------------------------------------
  // Input validation
  // -----------------------------------------------------------------
  describe('input validation', () => {
    test('invalid day string throws RangeError', () => {
      expect(() => parseCalendarDay('2026-4-18')).to.throw(RangeError)
      expect(() => parseCalendarDay('04/18/2026')).to.throw(RangeError)
      expect(() => parseCalendarDay('not-a-date')).to.throw(RangeError)
      expect(() => parseCalendarDay('')).to.throw(RangeError)
      expect(() => parseCalendarDay('2026-04-18T00:00:00Z')).to.throw(RangeError)
    })

    test('returns a Date instance', () => {
      expect(parseCalendarDay('2026-04-18')).to.be.an.instanceof(Date)
      expect(parseCalendarDay(null)).to.be.an.instanceof(Date)
    })
  })

  // -----------------------------------------------------------------
  // Default timezone (UTC)
  // -----------------------------------------------------------------
  describe('UTC (default)', () => {
    test('happy path', () => {
      expect(parseCalendarDay('2026-04-18').toISOString()).to.equal('2026-04-18T00:00:00.000Z')
    })

    test('explicit UTC matches default', () => {
      expect(parseCalendarDay('2026-04-18', { timezone: 'UTC' }).toISOString())
        .to.equal('2026-04-18T00:00:00.000Z')
    })

    test('datePlus shifts forward', () => {
      expect(parseCalendarDay('2026-04-18', { datePlus: 1 }).toISOString())
        .to.equal('2026-04-19T00:00:00.000Z')
      expect(parseCalendarDay('2026-04-18', { datePlus: 7 }).toISOString())
        .to.equal('2026-04-25T00:00:00.000Z')
    })

    test('datePlus crosses month boundary', () => {
      expect(parseCalendarDay('2026-01-31', { datePlus: 1 }).toISOString())
        .to.equal('2026-02-01T00:00:00.000Z')
    })

    test('datePlus crosses year boundary', () => {
      expect(parseCalendarDay('2026-12-31', { datePlus: 1 }).toISOString())
        .to.equal('2027-01-01T00:00:00.000Z')
    })
  })

  // -----------------------------------------------------------------
  // Common zones that are already covered elsewhere
  // -----------------------------------------------------------------
  describe('common timezones', () => {
    test('Europe/Berlin — CEST (summer)', () => {
      expect(parseCalendarDay('2026-04-18', { timezone: 'Europe/Berlin' }).toISOString())
        .to.equal('2026-04-17T22:00:00.000Z')
    })

    test('Europe/Berlin — CET (winter)', () => {
      expect(parseCalendarDay('2026-01-15', { timezone: 'Europe/Berlin' }).toISOString())
        .to.equal('2026-01-14T23:00:00.000Z')
    })

    test('America/Los_Angeles — PDT', () => {
      expect(parseCalendarDay('2026-04-18', { timezone: 'America/Los_Angeles' }).toISOString())
        .to.equal('2026-04-18T07:00:00.000Z')
    })

    test('America/Los_Angeles — PST', () => {
      expect(parseCalendarDay('2026-01-15', { timezone: 'America/Los_Angeles' }).toISOString())
        .to.equal('2026-01-15T08:00:00.000Z')
    })

    test('Australia/Sydney — AEST (post-April DST end)', () => {
      expect(parseCalendarDay('2026-04-18', { timezone: 'Australia/Sydney' }).toISOString())
        .to.equal('2026-04-17T14:00:00.000Z')
    })

    test('Australia/Sydney — AEDT (summer)', () => {
      expect(parseCalendarDay('2026-01-15', { timezone: 'Australia/Sydney' }).toISOString())
        .to.equal('2026-01-14T13:00:00.000Z')
    })
  })

  // -----------------------------------------------------------------
  // Edge cases — the whole reason this util exists
  // -----------------------------------------------------------------
  describe('far-east timezones (> UTC+12)', () => {
    test('Pacific/Auckland — NZST (+12, winter)', () => {
      // NZDT ends first Sunday of April 2026 (April 5), so April 18 is NZST.
      expect(parseCalendarDay('2026-04-18', { timezone: 'Pacific/Auckland' }).toISOString())
        .to.equal('2026-04-17T12:00:00.000Z')
    })

    test('Pacific/Auckland — NZDT (+13, summer)', () => {
      expect(parseCalendarDay('2026-01-15', { timezone: 'Pacific/Auckland' }).toISOString())
        .to.equal('2026-01-14T11:00:00.000Z')
    })

    test('Pacific/Kiritimati — Line Islands, UTC+14 year-round', () => {
      expect(parseCalendarDay('2026-04-18', { timezone: 'Pacific/Kiritimati' }).toISOString())
        .to.equal('2026-04-17T10:00:00.000Z')
    })

    test('Pacific/Chatham — NZST +12:45 (winter)', () => {
      expect(parseCalendarDay('2026-04-18', { timezone: 'Pacific/Chatham' }).toISOString())
        .to.equal('2026-04-17T11:15:00.000Z')
    })

    test('Pacific/Chatham — NZDT +13:45 (summer)', () => {
      expect(parseCalendarDay('2026-01-15', { timezone: 'Pacific/Chatham' }).toISOString())
        .to.equal('2026-01-14T10:15:00.000Z')
    })

    test('Pacific/Apia — Samoa, UTC+13 year-round since 2021', () => {
      expect(parseCalendarDay('2026-04-18', { timezone: 'Pacific/Apia' }).toISOString())
        .to.equal('2026-04-17T11:00:00.000Z')
    })
  })

  describe('far-west timezones (< UTC-11)', () => {
    test('Pacific/Niue — UTC-11', () => {
      expect(parseCalendarDay('2026-04-18', { timezone: 'Pacific/Niue' }).toISOString())
        .to.equal('2026-04-18T11:00:00.000Z')
    })

    test('Pacific/Pago_Pago — American Samoa, UTC-11', () => {
      expect(parseCalendarDay('2026-04-18', { timezone: 'Pacific/Pago_Pago' }).toISOString())
        .to.equal('2026-04-18T11:00:00.000Z')
    })
  })

  // -----------------------------------------------------------------
  // DST transitions
  // -----------------------------------------------------------------
  describe('DST transitions', () => {
    test('Europe/Berlin spring-forward day (2026-03-29)', () => {
      // 00:00 Berlin is still CET (+1); DST jumps 02:00 → 03:00.
      expect(parseCalendarDay('2026-03-29', { timezone: 'Europe/Berlin' }).toISOString())
        .to.equal('2026-03-28T23:00:00.000Z')
    })

    test('Europe/Berlin day after spring-forward (2026-03-30)', () => {
      // 00:00 Berlin is now CEST (+2).
      expect(parseCalendarDay('2026-03-30', { timezone: 'Europe/Berlin' }).toISOString())
        .to.equal('2026-03-29T22:00:00.000Z')
    })

    test('Europe/Berlin fall-back day (2026-10-25)', () => {
      // 00:00 Berlin is still CEST (+2); DST ends at 03:00 → 02:00.
      expect(parseCalendarDay('2026-10-25', { timezone: 'Europe/Berlin' }).toISOString())
        .to.equal('2026-10-24T22:00:00.000Z')
    })

    test('Europe/Berlin day after fall-back (2026-10-26)', () => {
      // 00:00 Berlin is now CET (+1).
      expect(parseCalendarDay('2026-10-26', { timezone: 'Europe/Berlin' }).toISOString())
        .to.equal('2026-10-25T23:00:00.000Z')
    })

    test('datePlus across spring-forward stays DST-safe', () => {
      // Mar 28 + 1 = Mar 29 (still CET). Mar 29 + 1 = Mar 30 (CEST).
      expect(parseCalendarDay('2026-03-28', { timezone: 'Europe/Berlin', datePlus: 1 }).toISOString())
        .to.equal('2026-03-28T23:00:00.000Z')
      expect(parseCalendarDay('2026-03-29', { timezone: 'Europe/Berlin', datePlus: 1 }).toISOString())
        .to.equal('2026-03-29T22:00:00.000Z')
    })

    test('datePlus across fall-back stays DST-safe', () => {
      expect(parseCalendarDay('2026-10-24', { timezone: 'Europe/Berlin', datePlus: 1 }).toISOString())
        .to.equal('2026-10-24T22:00:00.000Z')
      expect(parseCalendarDay('2026-10-25', { timezone: 'Europe/Berlin', datePlus: 1 }).toISOString())
        .to.equal('2026-10-25T23:00:00.000Z')
    })
  })

  // -----------------------------------------------------------------
  // null → today in timezone
  // -----------------------------------------------------------------
  describe('null day (fallback to today)', () => {
    test('UTC — uses today in UTC', () => {
      const now = new Date('2026-04-18T13:45:00.000Z')
      expect(parseCalendarDay(null, { timezone: 'UTC', now }).toISOString())
        .to.equal('2026-04-18T00:00:00.000Z')
    })

    test('Europe/Berlin — uses today in Berlin', () => {
      const now = new Date('2026-04-18T13:45:00.000Z') // 15:45 Berlin (CEST)
      expect(parseCalendarDay(null, { timezone: 'Europe/Berlin', now }).toISOString())
        .to.equal('2026-04-17T22:00:00.000Z')
    })

    test('America/Los_Angeles — Y-M-D differs from UTC', () => {
      // 04:00 UTC → 21:00 previous day in LA.
      const now = new Date('2026-04-19T04:00:00.000Z')
      expect(parseCalendarDay(null, { timezone: 'America/Los_Angeles', now }).toISOString())
        .to.equal('2026-04-18T07:00:00.000Z')
    })

    test('Pacific/Kiritimati — Y-M-D differs from UTC', () => {
      // 22:00 April 17 UTC → 12:00 April 18 at Kiritimati (+14).
      const now = new Date('2026-04-17T22:00:00.000Z')
      expect(parseCalendarDay(null, { timezone: 'Pacific/Kiritimati', now }).toISOString())
        .to.equal('2026-04-17T10:00:00.000Z')
    })

    test('null + datePlus', () => {
      const now = new Date('2026-04-18T13:45:00.000Z')
      expect(parseCalendarDay(null, { timezone: 'UTC', datePlus: 1, now }).toISOString())
        .to.equal('2026-04-19T00:00:00.000Z')
    })
  })

  // -----------------------------------------------------------------
  // Output invariant: result + offset = local midnight
  // -----------------------------------------------------------------
  describe('invariants', () => {
    test('result represents 00:00 local in target timezone', () => {
      const zones = [
        'UTC',
        'Europe/Berlin',
        'America/Los_Angeles',
        'Australia/Sydney',
        'Pacific/Auckland',
        'Pacific/Kiritimati',
        'Pacific/Chatham',
        'Pacific/Apia',
        'Pacific/Niue',
      ]
      for (const tz of zones) {
        const result = parseCalendarDay('2026-04-18', { timezone: tz })
        const localMs = result.getTime() + getOffsetMs(tz, result)
        const local = new Date(localMs)
        expect(local.getUTCFullYear(), `${tz} year`).to.equal(2026)
        expect(local.getUTCMonth() + 1, `${tz} month`).to.equal(4)
        expect(local.getUTCDate(), `${tz} day`).to.equal(18)
        expect(local.getUTCHours(), `${tz} hour`).to.equal(0)
        expect(local.getUTCMinutes(), `${tz} minute`).to.equal(0)
      }
    })
  })
})

// Minimal offset reader for the invariant test — keeps the test independent
// of the util it's exercising.
function getOffsetMs (timezone: string, date: Date): number {
  const fmt = new Intl.DateTimeFormat('en', { timeZone: timezone, timeZoneName: 'longOffset' })
  const offsetStr = fmt.format(date).split(', ')[1]
  const match = offsetStr?.match(/GMT(?:([+-]\d{2}):(\d{2}))?/)
  if (!match) return 0
  if (!match[1]) return 0
  const hours = parseInt(match[1])
  const minutes = parseInt(match[2] ?? '0')
  return (hours * 60 + (hours < 0 ? -minutes : minutes)) * 60 * 1000
}
