import { hmsToMilliseconds } from './hmsToMilliseconds'
import { parseCalendarDay } from './parseCalendarDay'
import { applyDate } from './applyDate'
import { addDays } from 'date-fns/addDays'
import { tz } from '@date-fns/tz'
import type {
  TimerInput,
  TimesetInput,
  TimestampState,
  MemoryInput,
  Timestamp,
} from './types'

// --- Constants -----------------------------------------------------------

const TIMER_TYPES = {
  DURATION: 'DURATION' as const,
  FINISH_TIME: 'FINISH_TIME' as const,
  TIME_WARP: 'TIME_WARP' as const,
}

const TIMESTAMP_STATE = {
  PAST: 'PAST' as TimestampState,
  ACTIVE: 'ACTIVE' as TimestampState,
  FUTURE: 'FUTURE' as TimestampState,
}

// --- Helpers -------------------------------------------------------------

/**
 * Resolve a wall-clock anchor to epoch ms by placing the time-of-day from
 * `rawInput` on `roomDate + datePlus` in the target timezone.
 */
function resolveAnchoredTime (
  rawInput: Date,
  roomDate: Date,
  datePlus: number = 0,
  timezone: string | undefined = 'UTC',
): number {
  const day = datePlus ? addDays(roomDate, datePlus, { in: tz(timezone) }) : roomDate
  const result = applyDate(rawInput, day, timezone)
  return result ? result.getTime() : 0
}

// --- Main ----------------------------------------------------------------

/**
 * Builds planned + actual timestamp chain for a list of timers.
 *
 * You give it a rundown — a list of timers, plus what's currently running
 * (`timeset`), the room's date, the timezone, and any memory of past runs.
 * It returns one row per timer with two parallel timelines:
 *
 *   - **planned** — when the rundown *says* this timer should start, finish,
 *     and how long it should last. Pure schedule.
 *   - **actual** — when it really started, finished, and ran for. Mixes
 *     recorded history (PAST), live kickoff + clock (ACTIVE), and projection
 *     from the prior row (FUTURE).
 *
 * Plus a few derived fields per row: `startDrift` / `finishDrift` (actual − planned
 * at each endpoint), `gap` (the planned pause before this row), and flags for
 * how the row should render (`hasMemory`, `explicitStart`, `explicitFinish`).
 *
 * ## Rules
 *
 * - **Honest nulls.** `planned.start` / `planned.finish` are `null` when the
 *   chain has no anchor (no `startTime` / `finishTime`) reachable upstream
 *   *or* downstream. We don't fabricate a fallback like `kickoff || now` —
 *   null is the truth. No anchors anywhere → all planned values null.
 * - **Anchors radiate both ways.** If the show has even just ONE hard start, then we
 *   can derive times forward & backward from there as far as possible (derive forward wins)
 * - **Duration defaults to 0.** Durations can never be negative, so `0` is the
 *   honest "don't know" value. Saves null checks at the boundary.
 * - **Actual mirrors planned by default.** When we don't know any better
 *   (no kickoff, no memory, no prev actual to chain from), `actual === planned`
 *   — including null. Kickoff (ACTIVE) and memory (PAST) override this; FUTURE
 *   chains forward from the previous row's `actual.finish` once any timer has
 *   run.
 * - **Hard anchors honor scheduled gaps.** A FUTURE timer with a `startTime`
 *   later than the prior row's actual finish waits at the anchor — the gap
 *   was scheduled on purpose. Chaining only kicks in once we've overshot the
 *   anchor (prior row ran long): `actualStart = max(plannedStart, prevActualFinish)`.
 *   No anchor → always chain.
 * - **State is positional, not historical.** `ACTIVE` is the row matching
 *   `timeset.timerId`; `PAST` is everything before it; `FUTURE` is everything
 *   after. Memory says "this timer once ran" — it doesn't tell us where in
 *   the show order the timer sits, so it's irrelevant to state. With no
 *   active timer, every row is FUTURE.
 * - **Drift / gap inherit nulls.** `startDrift` / `finishDrift` / `gap` are
 *   `null` when either endpoint of the subtraction is null. `gap` is `0` for
 *   the first row by convention.
 * - **One canonical day.** All wall-clock anchors (`startTime` / `finishTime`)
 *   are placed on `roomDate + datePlus` in `timezone`. No prev-finish
 *   compensation, no "today" guessing — every anchor has a fully determined
 *   calendar day.
 * - **Strict input shapes.** Callers normalize: `startTime` / `finishTime` are
 *   `Date | null`, `kickoff` etc. are epoch ms. Library does no parsing of
 *   ISO strings or wall-clock formats.
 */
export function createTimestamps (
  timers: TimerInput[],
  timeset: TimesetInput,
  timezone: string | undefined = undefined,
  now: number = Date.now(),
  roomDate: string | null = null, // 'YYYY-MM-DD'
  memory: MemoryInput = {},
): Timestamp[] {
  if (!Array.isArray(timers) || !timers.length) return []
  if (!timeset) return []

  // 00:00 local time in `timezone` on the room's date (or today if none).
  const iRoomDate: Date = parseCalendarDay(roomDate, { timezone, now: new Date(now) })
  const kickoffMs: number | null = timeset.kickoff
  const activeIdx: number = timeset.timerId
    ? timers.findIndex(t => String(t._id) === String(timeset.timerId))
    : -1

  const out: Timestamp[] = []
  let prevPlannedFinish: number | null = null
  let prevActualFinish: number | null = null

  for (const [i, timer] of timers.entries()) {

    const mem = memory.timers?.[String(timer._id)] ?? null
    const hasMemory = !!(mem && mem.finish)

    // --- state ---------------------------------------------------------
    let state: TimestampState
    if (String(timer._id) === String(timeset.timerId)) state = TIMESTAMP_STATE.ACTIVE
    else if (i < activeIdx) state = TIMESTAMP_STATE.PAST
    else state = TIMESTAMP_STATE.FUTURE

    // --- planned -------------------------------------------------------
    let plannedStart: number | null = null
    let plannedFinish: number | null = null
    let plannedDuration: number = 0

    // - planned start
    if (timer.startTime) plannedStart = resolveAnchoredTime(timer.startTime, iRoomDate, timer.startDatePlus, timezone)
    else if (prevPlannedFinish) plannedStart = prevPlannedFinish

    // - planned finish
    if (timer.type === TIMER_TYPES.FINISH_TIME) {
      if (timer.finishTime) plannedFinish = resolveAnchoredTime(timer.finishTime, iRoomDate, timer.finishDatePlus, timezone)
      else plannedFinish = plannedStart
      if (plannedStart && plannedFinish) plannedDuration = plannedFinish - plannedStart
    } else {
      plannedDuration = hmsToMilliseconds(timer)
      if (plannedStart) plannedFinish = plannedStart + plannedDuration
    }

    // --- actual --------------------------------------------------------
    // Default: actual mirrors planned.
    let actualStart: number | null = plannedStart
    let actualFinish: number | null = plannedFinish
    let actualDuration: number = 0

    // - actual start
    switch (state) {
      case TIMESTAMP_STATE.PAST:
        if (mem?.start) actualStart = mem.start
        break
      case TIMESTAMP_STATE.ACTIVE:
        if (kickoffMs) actualStart = kickoffMs
        break
      case TIMESTAMP_STATE.FUTURE:
        // Hard `startTime` honors the scheduled gap; chain forward only if
        // we've already overshot the anchor. Otherwise chain from prev.
        if (timer.startTime && plannedStart) {
          actualStart = prevActualFinish ? Math.max(plannedStart, prevActualFinish) : plannedStart
        } else if (prevActualFinish) {
          actualStart = prevActualFinish
        }
        break
    }

    // - actual finish
    switch (state) {
      case TIMESTAMP_STATE.PAST:
        if (hasMemory) actualFinish = mem!.finish!
        else actualFinish = actualStart // skipped: collapse to zero duration
        break
      case TIMESTAMP_STATE.ACTIVE:
        if (actualStart) {
          if (timer.type === TIMER_TYPES.FINISH_TIME && plannedFinish) {
            actualFinish = Math.max(plannedFinish, actualStart, now)
          } else {
            actualFinish = Math.max(actualStart + plannedDuration, now)
          }
        }
        break
      case TIMESTAMP_STATE.FUTURE:
        if (actualStart) {
          if (timer.type === TIMER_TYPES.FINISH_TIME) {
            actualFinish = Math.max(plannedFinish ?? actualStart, actualStart)
          } else {
            actualFinish = actualStart + plannedDuration
          }
        }
        break
    }

    // - actual duration
    if (actualStart && actualFinish) actualDuration = Math.max(0, actualFinish - actualStart)

    const startDrift = actualStart && plannedStart ? actualStart - plannedStart : null
    const finishDrift = actualFinish && plannedFinish ? actualFinish - plannedFinish : null
    const gap = plannedStart && prevPlannedFinish
      ? plannedStart - prevPlannedFinish
      : i === 0 ? 0 : null

    // --- output -------------------------------------------------------
    out.push({
      timerId: timer._id,
      state,
      planned: { start: plannedStart, finish: plannedFinish, duration: plannedDuration },
      actual: { start: actualStart, finish: actualFinish, duration: actualDuration },
      startDrift,
      finishDrift,
      gap,
      hasMemory,
      explicitStart: !!timer.startTime,
      explicitFinish: timer.type === TIMER_TYPES.FINISH_TIME,
    })

    prevPlannedFinish = plannedFinish
    prevActualFinish = actualFinish
  }

  return out
}

// --- Helpers -------------------------------------------------------------
