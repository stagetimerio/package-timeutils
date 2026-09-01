import { expect, describe, it } from 'vitest'
import { resolveAnchoredTime } from '../resolveAnchoredTime'
import { parseCalendarDay } from '../../parseCalendarDay'

const day = (date: string, timezone: string) => parseCalendarDay(date, { timezone })
const at = (iso: string) => new Date(iso).getTime()

describe('resolveAnchoredTime', () => {
  it('keeps the time of day and replaces the date', () => {
    const resolved = resolveAnchoredTime(new Date('2022-01-01T09:30:00.000Z'), day('2024-06-15', 'UTC'), 0, 'UTC')
    expect(resolved).toBe(at('2024-06-15T09:30:00.000Z'))
  })

  it('adds datePlus as calendar days', () => {
    const resolved = resolveAnchoredTime(new Date('2022-01-01T02:00:00.000Z'), day('2024-06-15', 'UTC'), 2, 'UTC')
    expect(resolved).toBe(at('2024-06-17T02:00:00.000Z'))
  })

  it('reads the time of day in the target timezone, not the host one', () => {
    // 22:00Z in January is 23:00 in Berlin (CET); on a June date that wall time
    // is CEST, an hour further from UTC.
    const resolved = resolveAnchoredTime(new Date('2022-01-01T22:00:00.000Z'), day('2024-06-15', 'Europe/Berlin'), 0, 'Europe/Berlin')
    expect(resolved).toBe(at('2024-06-15T21:00:00.000Z'))
  })

  it('holds the local wall time when datePlus crosses a DST boundary', () => {
    // Berlin springs forward on 2026-03-29. 10:00 local stays 10:00 local.
    const roomDate = day('2026-03-28', 'Europe/Berlin')
    const time = new Date('2022-01-01T09:00:00.000Z') // 10:00 CET
    expect(resolveAnchoredTime(time, roomDate, 0, 'Europe/Berlin')).toBe(at('2026-03-28T09:00:00.000Z'))
    expect(resolveAnchoredTime(time, roomDate, 1, 'Europe/Berlin')).toBe(at('2026-03-29T08:00:00.000Z'))
  })

  it('returns 0 for an unparseable anchor rather than throwing', () => {
    expect(resolveAnchoredTime(new Date('nonsense'), day('2024-06-15', 'UTC'), 0, 'UTC')).toBe(0)
  })
})
