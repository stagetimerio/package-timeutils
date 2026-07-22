import { describe, it, expect } from 'vitest'
import { deriveDatePlus } from '../src/deriveDatePlus'
import { parseCalendarDay } from '../src/parseCalendarDay'

const HOUR = 3600_000

describe('deriveDatePlus', () => {
  const timezone = 'Europe/Berlin'

  it('returns 0 for an instant on the room date', () => {
    const noon = parseCalendarDay('2026-07-22', { timezone }).getTime() + 12 * HOUR
    expect(deriveDatePlus(noon, '2026-07-22', { timezone })).toBe(0)
  })

  it('returns 1 for the next day, even one ms past local midnight', () => {
    const justPastMidnight = parseCalendarDay('2026-07-23', { timezone }).getTime() + 1
    expect(deriveDatePlus(justPastMidnight, '2026-07-22', { timezone })).toBe(1)
  })

  it('returns negative for instants before the room date', () => {
    const dayBefore = parseCalendarDay('2026-07-21', { timezone }).getTime() + 12 * HOUR
    expect(deriveDatePlus(dayBefore, '2026-07-22', { timezone })).toBe(-1)
  })

  it('round-trips with the anchor placement (datePlus in, datePlus out)', () => {
    const day = parseCalendarDay('2026-07-22', { timezone, datePlus: 2 })
    const instant = day.getTime() + 1 * HOUR // 01:00 local on roomDate + 2
    expect(deriveDatePlus(instant, '2026-07-22', { timezone })).toBe(2)
  })

  it('reads calendar days in the target timezone, not the machine\'s', () => {
    // 23:30 local in Auckland — a different calendar day in UTC and most
    // machine timezones the suite runs in
    const tzAK = 'Pacific/Auckland'
    const lateEvening = parseCalendarDay('2026-07-23', { timezone: tzAK }).getTime() + 23.5 * HOUR
    expect(deriveDatePlus(lateEvening, '2026-07-22', { timezone: tzAK })).toBe(1)
  })

  it('resolves a null roomDate to today via now', () => {
    const now = parseCalendarDay('2026-07-22', { timezone }).getTime() + 10 * HOUR
    const tomorrowNoon = parseCalendarDay('2026-07-23', { timezone }).getTime() + 12 * HOUR
    expect(deriveDatePlus(tomorrowNoon, null, { timezone, now })).toBe(1)
  })
})
