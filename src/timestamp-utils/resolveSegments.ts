export interface Segment {
  /** Declared end of this segment. Null until the forward pass resolves it, and stays null when nothing declares one. */
  end: number | null
  /** Row span, or -1/-1 for a segment with no rows (a boundary at either end). */
  firstRow: number
  lastRow: number
}

/**
 * Cut the rundown into segments: one per marker boundary, plus a last one
 * closed by the show target. With no markers this is a single segment spanning
 * every row, which is what every room without day breaks gets.
 *
 * `segmentIndexByRow` is the inverse lookup — the segment each row belongs to,
 * which is also the number the timestamp carries out to callers.
 */
export function resolveSegments (
  boundaries: { index: number }[],
  rowCount: number,
): { segments: Segment[], segmentIndexByRow: number[] } {
  const segments: Segment[] = Array.from({ length: boundaries.length + 1 }, () => ({ end: null, firstRow: -1, lastRow: -1 }))

  const segmentIndexByRow: number[] = []
  let s = 0
  for (let i = 0; i < rowCount; i++) {
    while (s < boundaries.length && boundaries[s]!.index <= i) s++
    const segment = segments[s]!
    if (segment.firstRow < 0) segment.firstRow = i
    segment.lastRow = i
    segmentIndexByRow.push(s)
  }

  return { segments, segmentIndexByRow }
}
