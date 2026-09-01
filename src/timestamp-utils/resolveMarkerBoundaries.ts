import { resolveAnchoredTime } from './resolveAnchoredTime'
import type { MarkerInput, TimerInput } from '../types'

/**
 * Turn markers into row-index boundaries, in list order.
 *
 * A marker sits above the cue named by `beforeTimerId`; a null anchor pins it
 * below the last cue. Anchors naming no cue in this rundown are dropped, and
 * only the first marker at any one boundary survives — two ends of the same day
 * is not a state the timeline can hold.
 */
export function resolveMarkerBoundaries (
  markers: MarkerInput[],
  timers: TimerInput[],
  roomDate: Date,
  timezone: string | undefined,
): { index: number, end: number | null }[] {
  if (!Array.isArray(markers) || !markers.length) return []

  const indexById = new Map(timers.map((t, i) => [String(t._id), i]))
  const boundaries: { index: number, end: number | null }[] = []
  const taken = new Set<number>()

  for (const marker of markers) {
    const index = marker.beforeTimerId == null
      ? timers.length
      : indexById.get(String(marker.beforeTimerId))
    if (index === undefined || taken.has(index)) continue
    taken.add(index)
    boundaries.push({
      index,
      end: marker.time ? resolveAnchoredTime(marker.time, roomDate, marker.datePlus, timezone) : null,
    })
  }

  return boundaries.sort((a, b) => a.index - b.index)
}
