import { expect, describe, it } from 'vitest'
import { resolveSegments } from '../resolveSegments'

const at = (index: number, end: number | null = null) => ({ index, end })
const spans = (segments: { firstRow: number, lastRow: number }[]) =>
  segments.map(({ firstRow, lastRow }) => [firstRow, lastRow])

describe('resolveSegments', () => {
  it('is one segment closed by the target when nothing marks the rundown', () => {
    const { segments, segmentIndexByRow } = resolveSegments([], 500, 3)
    expect(segments).toEqual([{ end: 500, firstRow: 0, lastRow: 2, headroom: null }])
    expect(segmentIndexByRow).toEqual([0, 0, 0])
  })

  it('cuts above the anchored row, so the boundary row opens the next segment', () => {
    const { segments, segmentIndexByRow } = resolveSegments([at(2, 100)], 500, 4)
    expect(segmentIndexByRow).toEqual([0, 0, 1, 1])
    expect(spans(segments)).toEqual([[0, 1], [2, 3]])
    expect(segments.map((s) => s.end)).toEqual([100, 500])
  })

  it('leaves the first segment empty when a boundary sits at row 0', () => {
    const { segments, segmentIndexByRow } = resolveSegments([at(0, 100)], 500, 2)
    expect(segmentIndexByRow).toEqual([1, 1])
    expect(spans(segments)).toEqual([[-1, -1], [0, 1]])
  })

  it('leaves the last segment empty when a boundary sits past the last row', () => {
    const { segments, segmentIndexByRow } = resolveSegments([at(2, 100)], 500, 2)
    expect(segmentIndexByRow).toEqual([0, 0])
    expect(spans(segments)).toEqual([[0, 1], [-1, -1]])
  })

  it('handles several boundaries', () => {
    const { segments, segmentIndexByRow } = resolveSegments([at(1, 100), at(3, 200)], 500, 5)
    expect(segmentIndexByRow).toEqual([0, 1, 1, 2, 2])
    expect(spans(segments)).toEqual([[0, 0], [1, 2], [3, 4]])
    expect(segments.map((s) => s.end)).toEqual([100, 200, 500])
  })

  it('still produces the target segment for an empty rundown', () => {
    const { segments, segmentIndexByRow } = resolveSegments([], 500, 0)
    expect(segmentIndexByRow).toEqual([])
    expect(spans(segments)).toEqual([[-1, -1]])
  })

  it('carries a null end through — a day break with no declared time', () => {
    const { segments } = resolveSegments([at(1, null)], null, 2)
    expect(segments.map((s) => s.end)).toEqual([null, null])
  })
})
