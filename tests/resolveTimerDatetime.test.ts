import { describe, it, expect } from 'vitest'
import { resolveTimerDatetime } from '../src/resolveTimerDatetime'
import { parseCalendarDay } from '../src/parseCalendarDay'
import { deriveDatePlus } from '../src/deriveDatePlus'
import { applyDate } from '../src/applyDate'

const HOUR = 3600_000

/** Wall-clock 'HH:mm' a resolved instant reads as in `timezone`. */
function clockAt (instant: Date | null, timezone: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: timezone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).format(instant as Date)
}

/** An instant that reads as `hours` local time on `day` in `timezone`. */
function localTime (day: string, hours: number, timezone: string): Date {
  return new Date(parseCalendarDay(day, { timezone }).getTime() + hours * HOUR)
}

describe('resolveTimerDatetime', () => {
  const timezone = 'Europe/Berlin'

  it('places the time-of-day on the room date', () => {
    const time = localTime('2026-07-22', 9.5, timezone)
    const resolved = resolveTimerDatetime(time, '2026-07-22', { timezone })
    expect(resolved?.getTime()).toBe(time.getTime())
  })

  it('shifts by datePlus', () => {
    const time = localTime('2026-07-22', 9.5, timezone)
    const resolved = resolveTimerDatetime(time, '2026-07-22', { timezone, datePlus: 2 })
    expect(clockAt(resolved, timezone)).toBe('09:30')
    expect(deriveDatePlus(resolved as Date, '2026-07-22', { timezone })).toBe(2)
  })

  it('keeps the local clock time, discarding the calendar day', () => {
    const time = localTime('2026-07-22', 9.5, timezone)
    const resolved = resolveTimerDatetime(time, '2026-09-04', { timezone })
    expect(clockAt(resolved, timezone)).toBe('09:30')
    expect(deriveDatePlus(resolved as Date, '2026-09-04', { timezone })).toBe(0)
  })

  it('preserves the local clock time across a DST boundary', () => {
    // A cue set at 09:30 in winter must still read 09:30 when the room date
    // moves into summer, even though the UTC offset changed underneath it.
    const winter = localTime('2026-01-15', 9.5, timezone)
    expect(winter.toISOString()).toBe('2026-01-15T08:30:00.000Z') // 09:30 CET
    const resolved = resolveTimerDatetime(winter, '2026-07-22', { timezone })
    expect(clockAt(resolved, timezone)).toBe('09:30')
    expect(resolved?.toISOString()).toBe('2026-07-22T07:30:00.000Z') // 09:30 CEST
  })

  it('carries the timezone into both halves', () => {
    // The bug the wrapper exists to prevent. Handing `timezone` to
    // parseCalendarDay but not to applyDate yields local midnight, which is the
    // previous UTC day for any zone ahead of UTC — so the cue lands a day early.
    const time = localTime('2026-07-22', 9.5, timezone)
    const halfZoned = applyDate(time, parseCalendarDay('2026-07-22', { timezone }))
    expect(deriveDatePlus(halfZoned as Date, '2026-07-22', { timezone })).toBe(-1)

    const resolved = resolveTimerDatetime(time, '2026-07-22', { timezone })
    expect(deriveDatePlus(resolved as Date, '2026-07-22', { timezone })).toBe(0)
  })

  it('returns null for an unset time', () => {
    expect(resolveTimerDatetime(null, '2026-07-22', { timezone })).toBe(null)
  })

  it('returns null for an unparseable time', () => {
    expect(resolveTimerDatetime('not a time', '2026-07-22', { timezone })).toBe(null)
  })

  it('falls back to today when the room date is null', () => {
    const time = localTime('2026-07-22', 9.5, timezone)
    const resolved = resolveTimerDatetime(time, null, { timezone })
    expect(clockAt(resolved, timezone)).toBe('09:30')
    expect(deriveDatePlus(resolved as Date, null, { timezone })).toBe(0)
  })

  it('round-trips with deriveDatePlus across far-east zones', () => {
    const zones = [
      'UTC', 'America/Los_Angeles', 'Europe/Berlin', 'Australia/Sydney',
      'Pacific/Auckland', 'Pacific/Chatham', 'Pacific/Apia', 'Pacific/Kiritimati',
    ]
    for (const zone of zones) {
      for (const datePlus of [-1, 0, 1, 3]) {
        for (const hours of [0, 9.5, 23.5]) {
          const time = localTime('2026-07-22', hours, zone)
          const resolved = resolveTimerDatetime(time, '2026-07-22', { timezone: zone, datePlus })
          const label = `${zone} +${datePlus} @${hours}`
          expect(deriveDatePlus(resolved as Date, '2026-07-22', { timezone: zone }), label).toBe(datePlus)
          expect(clockAt(resolved, zone), label).toBe(clockAt(time, zone))
        }
      }
    }
  })
})
