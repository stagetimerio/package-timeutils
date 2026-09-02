import { expect, describe, it } from 'vitest'
import { resolveAnchoredTime } from '../resolveAnchoredTime'

const at = (iso: string) => new Date(iso).getTime()
const tod = (iso: string) => new Date(iso)

describe('resolveAnchoredTime', () => {
  it('keeps the time of day and lands on the anchor day when that is at or after the anchor', () => {
    expect(resolveAnchoredTime(tod('2022-01-01T09:30:00.000Z'), at('2024-06-15T00:00:00.000Z'), 'UTC'))
      .toBe(at('2024-06-15T09:30:00.000Z'))
  })

  it('an exact hit on the anchor stays — at or after, not strictly after', () => {
    expect(resolveAnchoredTime(tod('2022-01-01T09:30:00.000Z'), at('2024-06-15T09:30:00.000Z'), 'UTC'))
      .toBe(at('2024-06-15T09:30:00.000Z'))
  })

  it('rolls to the next day when the time of day has already passed on the anchor day', () => {
    expect(resolveAnchoredTime(tod('2022-01-01T02:00:00.000Z'), at('2024-06-15T22:00:00.000Z'), 'UTC'))
      .toBe(at('2024-06-16T02:00:00.000Z'))
  })

  it('ignores the date part of the input entirely', () => {
    expect(resolveAnchoredTime(tod('2030-12-31T09:30:00.000Z'), at('2024-06-15T00:00:00.000Z'), 'UTC'))
      .toBe(at('2024-06-15T09:30:00.000Z'))
  })

  it('reads the time of day in the target timezone, not the host one', () => {
    // 22:00Z in January is 23:00 in Berlin (CET); on a June date that wall time
    // is CEST, an hour further from UTC.
    expect(resolveAnchoredTime(tod('2022-01-01T22:00:00.000Z'), at('2024-06-14T22:00:00.000Z'), 'Europe/Berlin'))
      .toBe(at('2024-06-15T21:00:00.000Z'))
  })

  it('holds the local wall time when the roll crosses a DST boundary', () => {
    // Berlin springs forward on 2026-03-29. 10:00 local stays 10:00 local.
    const anchor = at('2026-03-28T10:00:00.000Z') // 11:00 CET, so 10:00 has passed
    expect(resolveAnchoredTime(tod('2022-01-01T09:00:00.000Z'), anchor, 'Europe/Berlin'))
      .toBe(at('2026-03-29T08:00:00.000Z'))
  })

  it('returns 0 for an unparseable time rather than throwing', () => {
    expect(resolveAnchoredTime(new Date('nonsense'), at('2024-06-15T00:00:00.000Z'), 'UTC')).toBe(0)
  })
})
