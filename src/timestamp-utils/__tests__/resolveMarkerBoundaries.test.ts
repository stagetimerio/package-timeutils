import { expect, describe, it } from 'vitest'
import { resolveMarkerBoundaries } from '../resolveMarkerBoundaries'
import type { MarkerInput, TimerInput } from '../../types'

const timers = ['a', 'b', 'c'].map((_id) => ({ _id })) as TimerInput[]
const marker = (over: Partial<MarkerInput> = {}): MarkerInput =>
  ({ _id: 'm1', type: 'END_OF_DAY', beforeTimerId: 'b', ...over })

describe('resolveMarkerBoundaries', () => {
  it('returns nothing for no markers', () => {
    expect(resolveMarkerBoundaries([], timers)).toEqual([])
  })

  it('anchors to the index of the cue it sits above', () => {
    expect(resolveMarkerBoundaries([marker()], timers)).toEqual([{ markerId: 'm1', index: 1, time: null, frozen: null }])
  })

  it('pins a null anchor past the last cue', () => {
    expect(resolveMarkerBoundaries([marker({ beforeTimerId: null })], timers)).toEqual([{ markerId: 'm1', index: 3, time: null, frozen: null }])
  })

  it('drops an anchor naming no cue in this rundown', () => {
    expect(resolveMarkerBoundaries([marker({ beforeTimerId: 'gone' })], timers)).toEqual([])
  })

  it('sorts by row, whatever order the markers arrive in', () => {
    const markers = [marker({ _id: 'm2', beforeTimerId: 'c' }), marker()]
    expect(resolveMarkerBoundaries(markers, timers).map((b) => b.index)).toEqual([1, 2])
  })

  it('keeps stacked markers on one boundary in list order — an empty day between them', () => {
    const markers = [marker({ _id: 'm2' }), marker()]
    expect(resolveMarkerBoundaries(markers, timers).map((b) => b.markerId)).toEqual(['m2', 'm1'])
  })

  it('carries the typed time through unresolved — the forward pass places it', () => {
    const time = new Date('2022-01-01T02:00:00.000Z')
    expect(resolveMarkerBoundaries([marker({ time })], timers)[0]!.time).toBe(time)
  })
})
