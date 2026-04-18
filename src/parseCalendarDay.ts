import { getTimezoneOffset } from './getTimezoneOffset'
import { getToday } from './getToday'

const CALENDAR_DAY_REGEX = /^(\d{4})-(\d{2})-(\d{2})$/

export interface ParseCalendarDayOptions {
  timezone?: string
  datePlus?: number
  now?: Date
}

/**
 * Parse a calendar-day string (`'YYYY-MM-DD'`) into a JS `Date` representing
 * 00:00:00.000 local time on that day in the given timezone.
 *
 * The input is a *calendar day* — year-month-day with no time, no timezone.
 * The output is an absolute UTC instant (`Date`) that corresponds to the
 * start of that day as a person standing in `timezone` would see it.
 *
 * ```
 * parseCalendarDay('2026-04-18', { timezone: 'America/Los_Angeles' })
 * // → 2026-04-18T07:00:00.000Z  (midnight Pacific on April 18)
 *
 * parseCalendarDay('2026-04-18', { timezone: 'Pacific/Kiritimati' })  // UTC+14
 * // → 2026-04-17T10:00:00.000Z  (still 00:00 April 18 at the venue)
 * ```
 *
 * ### Why not `new Date(day + 'T00:00:00Z')` or `'T12:00:00Z'`?
 * Picking an arbitrary UTC hour as a pivot only lands on the intended calendar
 * day for zones within ±12h of UTC. Far-east zones (Kiribati +14, Chatham
 * +12:45, Samoa +13, Auckland +13 DST) would silently fall on the wrong day.
 * This util resolves to the zone's actual midnight instead of a UTC heuristic.
 *
 * ### Why is `null` allowed?
 * In Stagetimer a room may not have a scheduled date. Callers pass `roomDate`
 * through directly; a `null` input resolves to 00:00 **today** in the target
 * timezone — the sensible default for "no fixed date, use today's."
 *
 * ### DST
 * `datePlus` is applied via `Date.UTC` day-overflow arithmetic before the zone
 * conversion, so crossing a DST boundary during the shift still lands on local
 * midnight. Zones that *transition exactly at midnight* (extremely rare, e.g.
 * historical Brazil) will resolve to the next valid local instant — whatever
 * `getToday` produces.
 *
 * @param day - `'YYYY-MM-DD'` or `null`. `null` means "today in `timezone`."
 * @param options.timezone - IANA timezone. Defaults to `'UTC'`.
 * @param options.datePlus - Shift the resolved day by N days (integer).
 * @param options.now - Override "now" for the `null` path. For testing.
 * @returns A `Date` at 00:00:00.000 local time on the resolved day.
 * @throws {RangeError} if `day` is a non-null string that doesn't match `YYYY-MM-DD`.
 */
export function parseCalendarDay (
  day: string | null,
  {
    datePlus = 0,
    timezone = 'UTC',
    now,
  }: ParseCalendarDayOptions = {},
): Date {
  // Null day → today in the target timezone. getToday already solves this;
  // short-circuit when there's no datePlus shift to apply.
  if (day == null && !datePlus) return getToday(timezone, now)

  let year: number
  let month: number
  let date: number

  if (day == null) {
    // Read today's Y-M-D in the target timezone from getToday's result.
    // getToday returns 00:00 local expressed as UTC; shift back by the zone's
    // offset to recover local Y-M-D.
    const today = getToday(timezone, now)
    const offset = getTimezoneOffset(timezone, today)
    const local = new Date(today.getTime() + offset)
    year = local.getUTCFullYear()
    month = local.getUTCMonth() + 1
    date = local.getUTCDate()
  } else {
    const match = CALENDAR_DAY_REGEX.exec(day)
    if (!match) throw new RangeError(`Invalid calendar day: '${day}'. Expected 'YYYY-MM-DD'.`)
    year = Number(match[1])
    month = Number(match[2])
    date = Number(match[3])
  }

  // Build a UTC pivot guaranteed to fall inside the target local day, then let
  // getToday snap it to 00:00 local. Starting from UTC midnight of the naive
  // date minus the zone's offset at that moment yields local midnight expressed
  // in UTC — safe for offsets from -12h to +14h. datePlus is folded into the
  // Date.UTC arguments so day overflow (and any DST shift at the target) is
  // handled cleanly.
  const naive = new Date(Date.UTC(year, month - 1, date + datePlus))
  const offset = getTimezoneOffset(timezone, naive)
  const pivot = new Date(naive.getTime() - offset)

  return getToday(timezone, pivot)
}
