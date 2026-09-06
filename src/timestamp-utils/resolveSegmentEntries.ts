import { parseCalendarDay } from '../parseCalendarDay'
import { addDays } from 'date-fns/addDays'
import { tz } from '@date-fns/tz'

/**
 * Midnight of each segment's event day, in `timezone`.
 *
 * A dated room is planning: segment N is the room date plus N days, whatever
 * ran when. In a dateless room every day that has run is dated by when it
 * ran — `runStarts[s]` is the first recorded start in segment s — and a day
 * that hasn't counts from the nearest day that has, the one above it first.
 * With nothing run, segment 0 is today.
 */
export function resolveSegmentEntries (
  runStarts: (number | null)[],
  roomDate: string | null,
  timezone: string | undefined,
  now: number,
): number[] {
  const inTz = { in: tz(timezone ?? 'UTC') }
  const midnightOf = (ms: number) => parseCalendarDay(null, { timezone, now: new Date(ms) }).getTime()

  const entries: (number | null)[] = roomDate == null
    ? runStarts.map((start) => start == null ? null : midnightOf(start))
    : runStarts.map(() => null)

  if (entries.every((entry) => entry == null)) {
    const dayZero = parseCalendarDay(roomDate, { timezone, now: new Date(now) }).getTime()
    return entries.map((_, s) => addDays(dayZero, s, inTz).getTime())
  }

  for (let s = 1; s < entries.length; s++) {
    if (entries[s] == null && entries[s - 1] != null) entries[s] = addDays(entries[s - 1]!, 1, inTz).getTime()
  }
  for (let s = entries.length - 2; s >= 0; s--) {
    if (entries[s] == null && entries[s + 1] != null) entries[s] = addDays(entries[s + 1]!, -1, inTz).getTime()
  }
  return entries as number[]
}
