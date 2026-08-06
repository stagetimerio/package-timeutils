import { applyDate } from './applyDate'
import { parseCalendarDay } from './parseCalendarDay'

/**
 * Place a timer's wall-clock time on the day it runs, returning the absolute
 * instant. The inverse of {@link deriveDatePlus}: a `startTime`/`finishTime`
 * stores only a time-of-day, and the day it belongs to lives in the room date
 * plus the timer's `startDatePlus`/`finishDatePlus` offset.
 *
 * ```
 * resolveTimerDatetime(timer.finishTime, room.date, {
 *   timezone: room.settings.timezone,
 *   datePlus: timer.finishDatePlus,
 * })
 * ```
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
 * @param options.datePlus - Days past `roomDate` the timer sits on.
 * @returns The resolved instant, or `null` if `time` is unset or unparseable.
 */
export function resolveTimerDatetime (
  time: Date | string | null,
  roomDate: string | null = null,
  {
    timezone = undefined,
    datePlus = 0,
  }: {
    timezone?: string
    datePlus?: number
  } = {},
): Date | null {
  return applyDate(time, parseCalendarDay(roomDate, { timezone, datePlus }), timezone)
}
