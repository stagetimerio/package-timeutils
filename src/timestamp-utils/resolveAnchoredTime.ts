import { applyDate } from '../applyDate'
import { addDays } from 'date-fns/addDays'
import { tz } from '@date-fns/tz'

/**
 * Resolve a wall-clock time to epoch ms: the first occurrence of `rawInput`'s
 * time-of-day, read in `timezone`, at or after `anchor` — strictly after it
 * with `after`. The date part of `rawInput` is ignored.
 *
 * This is how every typed time in the system is placed — timer starts and
 * finishes, day-break markers, the show target — so the rundown never runs
 * backwards. Cues use the default: one typed at its day's own start is the
 * normal case. Boundaries pass `after`: a day cannot end when it begins, so
 * two day ends typed the same time are 24 hours apart. Exported so callers
 * outside the timeline land on the same instant the app reads back rather
 * than reproducing the arithmetic.
 */
export function resolveAnchoredTime (
  rawInput: Date,
  anchor: number,
  timezone: string | undefined = 'UTC',
  { after = false }: { after?: boolean } = {},
): number {
  const onAnchorDay = applyDate(rawInput, new Date(anchor), timezone)
  if (!onAnchorDay) return 0
  const ms = onAnchorDay.getTime()
  if (after ? ms > anchor : ms >= anchor) return ms
  return addDays(onAnchorDay, 1, { in: tz(timezone) }).getTime()
}
