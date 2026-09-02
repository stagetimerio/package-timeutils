import { applyDate } from '../applyDate'
import { addDays } from 'date-fns/addDays'
import { tz } from '@date-fns/tz'

/**
 * Resolve a wall-clock time to epoch ms: the first occurrence of `rawInput`'s
 * time-of-day, read in `timezone`, at or after `anchor`. The date part of
 * `rawInput` is ignored.
 *
 * This is how every typed time in the system is placed — timer starts and
 * finishes, day-break markers, the show target — so the rundown never runs
 * backwards. Exported so callers outside the timeline land on the same
 * instant the app reads back rather than reproducing the arithmetic.
 */
export function resolveAnchoredTime (
  rawInput: Date,
  anchor: number,
  timezone: string | undefined = 'UTC',
): number {
  const onAnchorDay = applyDate(rawInput, new Date(anchor), timezone)
  if (!onAnchorDay) return 0
  if (onAnchorDay.getTime() >= anchor) return onAnchorDay.getTime()
  return addDays(onAnchorDay, 1, { in: tz(timezone) }).getTime()
}
