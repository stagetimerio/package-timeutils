import { applyDate } from '../applyDate'
import { addDays } from 'date-fns/addDays'
import { tz } from '@date-fns/tz'

/**
 * Resolve a wall-clock time to epoch ms: the first occurrence of `rawInput`'s
 * time-of-day, read in `timezone`, at or after `anchor` — strictly after it
 * with `after`. The date part of `rawInput` is ignored.
 *
 * This places every typed time with nothing above it to read from — a day's
 * first cue, day-break markers, the show target. Cues use the default: one
 * typed at its day's own start is the normal case. Boundaries pass `after`: a
 * day cannot end when it begins, so two day ends typed the same time are 24
 * hours apart. A cue below another uses `resolveNearestTime`. Exported so callers
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

/**
 * Resolve a wall-clock time to epoch ms: the occurrence of `rawInput`'s
 * time-of-day, read in `timezone`, nearest to `reference`. A tie (12 hours
 * either way) goes forward. The date part of `rawInput` is ignored.
 *
 * A typed time inside a day: 02:00 after a 23:00 finish is the same night,
 * 06:30 after a 16:30 finish is an overlap, not the next morning.
 */
export function resolveNearestTime (
  rawInput: Date,
  reference: number,
  timezone: string | undefined = 'UTC',
): number {
  const onReferenceDay = applyDate(rawInput, new Date(reference), timezone)
  if (!onReferenceDay) return 0
  const candidates = [-1, 0, 1].map((d) => addDays(onReferenceDay, d, { in: tz(timezone) }).getTime())
  return candidates.reduce((best, ms) => {
    const diff = Math.abs(ms - reference) - Math.abs(best - reference)
    return diff < 0 || (diff === 0 && ms > best) ? ms : best
  })
}
