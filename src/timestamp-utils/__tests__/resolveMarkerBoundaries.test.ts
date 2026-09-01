import { expect, describe, it } from 'vitest'
import { resolveMarkerBoundaries } from '../resolveMarkerBoundaries'
import type { MarkerInput, TimerInput } from '../../types'

const timers = ['a', 'b', 'c'].map((_id) => ({ _id })) as TimerInput[]
const roomDate = new Date('2024-06-15T00:00:00.000Z')
const marker = (over: Partial<MarkerInput> = {}): MarkerInput =>
  ({ _id: 'm1', type: 'END_OF_DAY', beforeTimerId: 'b', ...over })

describe('resolveMarkerBoundaries', () => {
  it('returns nothing for no markers', () => {
    expect(resolveMarkerBoundaries([], timers, roomDate, 'UTC')).toEqual([])
  })

  it('anchors to the index of the cue it sits above', () => {
    expect(resolveMarkerBoundaries([marker()], timers, roomDate, 'UTC')).toEqual([{ index: 1, end: null }])
  })

  it('pins a null anchor past the last cue', () => {
    const out = resolveMarkerBoundaries([marker({ beforeTimerId: null })], timers, roomDate, 'UTC')
    expect(out).toEqual([{ index: 3, end: null }])
  })

  it('drops an anchor naming no cue in this rundown', () => {
    expect(resolveMarkerBoundaries([marker({ beforeTimerId: 'gone' })], timers, roomDate, 'UTC')).toEqual([])
  })

  it('sorts by row, whatever order the markers arrive in', () => {
    const markers = [marker({ _id: 'm2', beforeTimerId: 'c' }), marker()]
    expect(resolveMarkerBoundaries(markers, timers, roomDate, 'UTC').map((b) => b.index)).toEqual([1, 2])
  })

  it('keeps only the first marker at a boundary — one day cannot end twice', () => {
    const markers = [marker(), marker({ _id: 'm2' })]
    expect(resolveMarkerBoundaries(markers, timers, roomDate, 'UTC')).toHaveLength(1)
  })

  it('resolves the time onto roomDate + datePlus', () => {
    const markers = [marker({ time: new Date('2022-01-01T02:00:00.000Z'), datePlus: 1 })]
    expect(resolveMarkerBoundaries(markers, timers, roomDate, 'UTC')[0]!.end)
      .toBe(new Date('2024-06-16T02:00:00.000Z').getTime())
  })
})
