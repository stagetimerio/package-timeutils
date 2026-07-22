import { differenceInCalendarDays } from 'date-fns/differenceInCalendarDays'
import { tz } from '@date-fns/tz'
import { parseCalendarDay } from './parseCalendarDay'

/**
 * Inverse of the anchor placement in `createTimestamps`: given an instant,
 * return the day offset (`datePlus`) of its calendar day relative to the room
 * date in `timezone`. Re-placing the instant's time-of-day on
 * `roomDate + deriveDatePlus(...)` reproduces the same instant, so a wall-clock
 * value written back with this offset round-trips through the resolver.
 *
 * Negative when the instant falls before the room date — callers whose schema
 * doesn't allow that clamp at the boundary.
 *
 * @param instant - Epoch ms or `Date` to place relative to the room date.
 * @param roomDate - `'YYYY-MM-DD'` or `null` for "today in `timezone`."
 * @param options.timezone - IANA timezone the calendar days are read in.
 * @param options.now - Override "now" for the `roomDate: null` path. For testing.
 */
export function deriveDatePlus (
  instant: Date | number,
  roomDate: string | null = null,
  {
    timezone = undefined,
    now = Date.now(),
  }: {
    timezone?: string
    now?: number
  } = {},
): number {
  const roomDay = parseCalendarDay(roomDate, { timezone, now: new Date(now) })
  return differenceInCalendarDays(instant, roomDay, timezone ? { in: tz(timezone) } : undefined)
}
