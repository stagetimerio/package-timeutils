import { expect, describe, it } from 'vitest'
import { resolveTargetEnd } from '../resolveTargetEnd'

describe('resolveTargetEnd', () => {
  it('returns null for no target / empty target', () => {
    expect(resolveTargetEnd(null)).toBeNull()
    expect(resolveTargetEnd({})).toBeNull()
    expect(resolveTargetEnd({ time: null, frozen: null })).toBeNull()
  })

  it('returns the frozen gray instant as-is', () => {
    const frozen = new Date('2024-06-15T15:30:00.000Z').getTime()
    expect(resolveTargetEnd({ frozen })).toBe(frozen)
  })

  it('white time wins over frozen and resolves onto roomDate + datePlus', () => {
    const resolved = resolveTargetEnd(
      {
        time: new Date('2022-01-01T01:30:00.000Z'),
        datePlus: 1,
        frozen: new Date('2024-06-15T15:00:00.000Z').getTime(),
      },
      { timezone: 'UTC', roomDate: '2024-06-15' },
    )
    expect(resolved).toBe(new Date('2024-06-16T01:30:00.000Z').getTime())
  })

  it('reads the time of day in the target timezone, across a DST change', () => {
    // 22:00Z in January is 23:00 in Berlin (CET). Placed on a June room date
    // that same 23:00 wall time is CEST, an hour further off UTC.
    const resolved = resolveTargetEnd(
      { time: new Date('2022-01-01T22:00:00.000Z') },
      { timezone: 'Europe/Berlin', roomDate: '2024-06-15' },
    )
    expect(resolved).toBe(new Date('2024-06-15T21:00:00.000Z').getTime())
  })
})
