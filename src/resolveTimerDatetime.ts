import { applyDate } from './applyDate'
import { parseCalendarDay } from './parseCalendarDay'

/**
 * Place a wall-clock time on a calendar day, returning the absolute instant.
 *
 * ### Why not inline `applyDate(time, parseCalendarDay(...), timezone)`?
 * `timezone` has to reach both calls, and the trailing one is easy to drop.
 * `parseCalendarDay` then returns local midnight — an instant on the *previous*
 * UTC day for any zone ahead of UTC — which `applyDate` reads in UTC, landing
 * the cue a full day early. Silent, and invisible from UTC or the Americas.
 *
 * @param time - Time-of-day carrier. Only its clock time is read; its date part
 *   is discarded. `null` (an unset time) returns `null`.
 * @param roomDate - `'YYYY-MM-DD'` or `null` for "today in `timezone`."
 * @param options.timezone - IANA timezone. Defaults to `'UTC'`.
 * @returns The resolved instant, or `null` if `time` is unset or unparseable.
 */
export function resolveTimerDatetime (
  time: Date | string | null,
  roomDate: string | null = null,
  { timezone = undefined }: { timezone?: string } = {},
): Date | null {
  return applyDate(time, parseCalendarDay(roomDate, { timezone }), timezone)
}
