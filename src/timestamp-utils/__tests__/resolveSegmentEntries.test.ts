import { expect, describe, it } from 'vitest'
import { resolveSegmentEntries } from '../resolveSegmentEntries'

const at = (iso: string) => new Date(iso).getTime()
const NOW = at('2026-03-12T08:00:00Z')

describe('resolveSegmentEntries', () => {
  it('nothing run: today plus N in a dateless room', () => {
    expect(resolveSegmentEntries([null, null, null], null, 'UTC', NOW)).toEqual([
      at('2026-03-12T00:00:00Z'),
      at('2026-03-13T00:00:00Z'),
      at('2026-03-14T00:00:00Z'),
    ])
  })

  it('a dated room is the room date plus N, whatever ran when', () => {
    expect(resolveSegmentEntries([at('2026-03-06T09:00:00Z'), at('2026-03-09T09:00:00Z')], '2026-03-01', 'UTC', NOW)).toEqual([
      at('2026-03-01T00:00:00Z'),
      at('2026-03-02T00:00:00Z'),
    ])
  })

  it('every day that has run is dated by when it ran; the rest count from the nearest', () => {
    const entries = resolveSegmentEntries([null, at('2026-03-06T09:00:00Z'), null, at('2026-03-09T09:00:00Z'), null], null, 'UTC', NOW)
    expect(entries).toEqual([
      at('2026-03-05T00:00:00Z'), // counted back from day 1
      at('2026-03-06T00:00:00Z'),
      at('2026-03-07T00:00:00Z'), // counted forward from day 1, not back from day 3
      at('2026-03-09T00:00:00Z'),
      at('2026-03-10T00:00:00Z'),
    ])
  })

  it('reads the run day in the room timezone', () => {
    // 23:30 in Los Angeles on the 5th is 07:30 UTC on the 6th.
    const [entry] = resolveSegmentEntries([at('2026-03-06T07:30:00Z')], null, 'America/Los_Angeles', NOW)
    expect(entry).toBe(at('2026-03-05T08:00:00Z'))
  })
})
