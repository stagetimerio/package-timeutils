import { applyDate } from '../applyDate'
import { addDays } from 'date-fns/addDays'
import { tz } from '@date-fns/tz'

/**
 * Resolve a wall-clock anchor to epoch ms by placing the time-of-day from
 * `rawInput` on `roomDate + datePlus` in the target timezone.
 *
 * This is how every anchor in the system is placed — timer starts and finishes,
 * the show target, day-break markers. Exported so callers outside the timeline
 * (import lifting, offset repair) resolve to the same instant the app reads
 * back rather than reproducing the arithmetic.
 */
export function resolveAnchoredTime (
  rawInput: Date,
  roomDate: Date,
  datePlus: number = 0,
  timezone: string | undefined = 'UTC',
): number {
  const day = datePlus ? addDays(roomDate, datePlus, { in: tz(timezone) }) : roomDate
  const result = applyDate(rawInput, day, timezone)
  return result ? result.getTime() : 0
}
