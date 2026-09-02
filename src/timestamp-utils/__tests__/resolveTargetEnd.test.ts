import { expect, describe, it } from 'vitest'
import { resolveTargetEnd } from '../resolveTargetEnd'

const at = (iso: string) => new Date(iso).getTime()
const anchor = at('2024-06-15T09:00:00.000Z')

describe('resolveTargetEnd', () => {
  it('returns null for no target / empty target', () => {
    expect(resolveTargetEnd(null, anchor, 'UTC')).toBeNull()
    expect(resolveTargetEnd({}, anchor, 'UTC')).toBeNull()
    expect(resolveTargetEnd({ time: null, frozen: null }, anchor, 'UTC')).toBeNull()
  })

  it('returns the frozen gray instant as-is', () => {
    const frozen = at('2024-06-15T15:30:00.000Z')
    expect(resolveTargetEnd({ frozen }, anchor, 'UTC')).toBe(frozen)
  })

  it('white time wins over frozen and lands at or after the anchor', () => {
    const resolved = resolveTargetEnd(
      { time: new Date('2022-01-01T01:30:00.000Z'), frozen: at('2024-06-15T15:00:00.000Z') },
      anchor,
      'UTC',
    )
    expect(resolved).toBe(at('2024-06-16T01:30:00.000Z'))
  })

  it('reads the time of day in the target timezone, across a DST change', () => {
    // 22:00Z in January is 23:00 in Berlin (CET). Placed on a June day that
    // same 23:00 wall time is CEST, an hour further off UTC.
    const resolved = resolveTargetEnd({ time: new Date('2022-01-01T22:00:00.000Z') }, anchor, 'Europe/Berlin')
    expect(resolved).toBe(at('2024-06-15T21:00:00.000Z'))
  })
})
