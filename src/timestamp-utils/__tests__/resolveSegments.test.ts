import { expect, describe, it } from 'vitest'
import { resolveSegments } from '../resolveSegments'

const at = (index: number) => ({ index })
const spans = (segments: { firstRow: number, lastRow: number }[]) =>
  segments.map(({ firstRow, lastRow }) => [firstRow, lastRow])

describe('resolveSegments', () => {
  it('is one segment spanning every row when nothing marks the rundown', () => {
    const { segments, segmentIndexByRow } = resolveSegments([], 3)
    expect(segments).toEqual([{ end: null, firstRow: 0, lastRow: 2 }])
    expect(segmentIndexByRow).toEqual([0, 0, 0])
  })

  it('cuts above the anchored row, so the boundary row opens the next segment', () => {
    const { segments, segmentIndexByRow } = resolveSegments([at(2)], 4)
    expect(segmentIndexByRow).toEqual([0, 0, 1, 1])
    expect(spans(segments)).toEqual([[0, 1], [2, 3]])
  })

  it('leaves the first segment empty when a boundary sits at row 0', () => {
    const { segments, segmentIndexByRow } = resolveSegments([at(0)], 2)
    expect(segmentIndexByRow).toEqual([1, 1])
    expect(spans(segments)).toEqual([[-1, -1], [0, 1]])
  })

  it('leaves the last segment empty when a boundary sits past the last row', () => {
    const { segments, segmentIndexByRow } = resolveSegments([at(2)], 2)
    expect(segmentIndexByRow).toEqual([0, 0])
    expect(spans(segments)).toEqual([[0, 1], [-1, -1]])
  })

  it('handles several boundaries', () => {
    const { segments, segmentIndexByRow } = resolveSegments([at(1), at(3)], 5)
    expect(segmentIndexByRow).toEqual([0, 1, 1, 2, 2])
    expect(spans(segments)).toEqual([[0, 0], [1, 2], [3, 4]])
  })

  it('still produces the target segment for an empty rundown', () => {
    const { segments, segmentIndexByRow } = resolveSegments([], 0)
    expect(segmentIndexByRow).toEqual([])
    expect(spans(segments)).toEqual([[-1, -1]])
  })
})
