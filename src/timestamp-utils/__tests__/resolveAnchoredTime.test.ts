import { expect, describe, it } from 'vitest'
import { resolveAnchoredTime, resolveNearestTime } from '../resolveAnchoredTime'

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

  it('`after`: an exact hit on the anchor rolls a full day', () => {
    expect(resolveAnchoredTime(tod('2022-01-01T09:30:00.000Z'), at('2024-06-15T09:30:00.000Z'), 'UTC', { after: true }))
      .toBe(at('2024-06-16T09:30:00.000Z'))
    expect(resolveAnchoredTime(tod('2022-01-01T09:31:00.000Z'), at('2024-06-15T09:30:00.000Z'), 'UTC', { after: true }))
      .toBe(at('2024-06-15T09:31:00.000Z'))
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

describe('resolveNearestTime', () => {
  const ref = at('2024-06-15T16:30:00.000Z')

  it('stays on the reference day when that is nearest, even before the reference', () => {
    expect(resolveNearestTime(tod('2022-01-01T06:30:00.000Z'), ref, 'UTC')).toBe(at('2024-06-15T06:30:00.000Z'))
  })

  it('rolls forward past midnight when the next day is nearer', () => {
    expect(resolveNearestTime(tod('2022-01-01T02:00:00.000Z'), at('2024-06-15T23:00:00.000Z'), 'UTC')).toBe(at('2024-06-16T02:00:00.000Z'))
  })

  it('rolls back to the day before when that is nearer', () => {
    expect(resolveNearestTime(tod('2022-01-01T23:00:00.000Z'), at('2024-06-15T01:00:00.000Z'), 'UTC')).toBe(at('2024-06-14T23:00:00.000Z'))
  })

  it('a tie, 12 hours either way, goes forward', () => {
    expect(resolveNearestTime(tod('2022-01-01T04:30:00.000Z'), ref, 'UTC')).toBe(at('2024-06-16T04:30:00.000Z'))
  })

  it('reads the wall time in the timezone', () => {
    // 06:30 Chicago (CDT, UTC−5) after a 16:30 Chicago finish is the same day.
    expect(resolveNearestTime(tod('2022-07-01T11:30:00.000Z'), at('2024-06-15T21:30:00.000Z'), 'America/Chicago')).toBe(at('2024-06-15T11:30:00.000Z'))
  })

  it('returns 0 for an unparseable time rather than throwing', () => {
    expect(resolveNearestTime(new Date('nonsense'), ref, 'UTC')).toBe(0)
  })
  it('never lands on a calendar day before dayStart\'s: 21:00 after a 07:00 finish is that evening', () => {
    const dayStart = at('2024-06-15T06:00:00.000Z')
    expect(resolveNearestTime(tod('2022-01-01T21:00:00.000Z'), at('2024-06-15T07:00:00.000Z'), 'UTC')).toBe(at('2024-06-14T21:00:00.000Z'))
    expect(resolveNearestTime(tod('2022-01-01T21:00:00.000Z'), at('2024-06-15T07:00:00.000Z'), 'UTC', { dayStart })).toBe(at('2024-06-15T21:00:00.000Z'))
  })

  it('dayStart still allows an earlier time on the same date: 06:30 after 16:30', () => {
    expect(resolveNearestTime(tod('2022-01-01T06:30:00.000Z'), ref, 'UTC', { dayStart: at('2024-06-15T08:30:00.000Z') })).toBe(at('2024-06-15T06:30:00.000Z'))
  })

  it('reads dayStart\'s midnight in the timezone', () => {
    // 9:30 PM CDT after an 8:00 AM CDT finish is that evening. A UTC midnight
    // (00:00Z) would let the evening before (02:30Z) through.
    const dayStart = at('2024-06-15T12:00:00.000Z')
    expect(resolveNearestTime(tod('2022-07-01T02:30:00.000Z'), at('2024-06-15T13:00:00.000Z'), 'America/Chicago', { dayStart })).toBe(at('2024-06-16T02:30:00.000Z'))
  })
})
