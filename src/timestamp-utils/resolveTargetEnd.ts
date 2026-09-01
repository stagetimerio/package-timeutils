import { parseCalendarDay } from '../parseCalendarDay'
import { resolveAnchoredTime } from './resolveAnchoredTime'
import type { TargetInput } from '../types'


/**
 * Resolve the show target end to an epoch-ms instant.
 *
 * Same precedence and date placement as `createTimestamps` uses internally
 * (this IS the function it calls): the user-set ("white") `target.time` is
 * placed on `roomDate + target.datePlus` in `timezone`, exactly like a timer
 * anchor, and wins over the kickoff-frozen ("gray") `target.frozen` instant.
 * Returns `null` when neither is set — the live-derived end is not a fixed
 * line, so there is nothing to resolve.
 *
 * Exported so display layers can compare the same instant the reverse walk
 * anchors on (e.g. the gap between the last timer's planned finish and the
 * target) without re-implementing the precedence rules.
 */
export function resolveTargetEnd (
  target: TargetInput | null,
  {
    timezone = undefined,
    now = Date.now(),
    roomDate = null,
  }: {
    timezone?: string
    now?: number
    roomDate?: string | null
  } = {},
): number | null {
  if (target?.time) {
    const iRoomDate = parseCalendarDay(roomDate, { timezone, now: new Date(now) })
    return resolveAnchoredTime(target.time, iRoomDate, target.datePlus, timezone)
  }
  return target?.frozen ?? null
}
