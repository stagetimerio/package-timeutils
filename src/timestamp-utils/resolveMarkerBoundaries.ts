import type { MarkerInput, TimerInput } from '../types'

export interface Boundary {
  markerId: string
  /** Row the marker sits above; `timers.length` for one pinned below the last cue. */
  index: number
  /** The typed end, still a time-of-day. Resolved by the forward pass, in list order. */
  time: Date | null
  /** The kickoff-frozen end, an instant already. Stands in when `time` is null. */
  frozen: number | null
}

/**
 * Turn markers into row-index boundaries, in list order.
 *
 * A marker sits above the cue named by `beforeTimerId`; a null anchor pins it
 * below the last cue. Anchors naming no cue in this rundown are dropped. Markers
 * sharing a boundary stay in list order and cut an empty segment between them —
 * a day with no cues, which is how a show gets scaffolded before its cues exist.
 */
export function resolveMarkerBoundaries (
  markers: MarkerInput[],
  timers: TimerInput[],
): Boundary[] {
  if (!Array.isArray(markers) || !markers.length) return []

  const indexById = new Map(timers.map((t, i) => [String(t._id), i]))
  const boundaries: Boundary[] = []

  for (const marker of markers) {
    const index = marker.beforeTimerId == null
      ? timers.length
      : indexById.get(String(marker.beforeTimerId))
    if (index === undefined) continue
    boundaries.push({ markerId: marker._id, index, time: marker.time ?? null, frozen: marker.frozen ?? null })
  }

  return boundaries.sort((a, b) => a.index - b.index)
}
