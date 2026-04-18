import hmsToMilliseconds from './hmsToMilliseconds'
import parseDateAsToday from './parseDateAsToday'
import parseCalendarDay from './parseCalendarDay'
import { applyDate } from './applyDate'
import { addMinutes } from 'date-fns/addMinutes'

// --- Types ---------------------------------------------------------------

export type TimerType = 'DURATION' | 'FINISH_TIME' | 'TIME_WARP'
export type TimerTrigger = 'MANUAL' | 'LINKED' | 'SCHEDULED'
/**
 * Purely positional, relative to the active timer in the list:
 *   - `ACTIVE` — `timeset.timerId` matches this timer
 *   - `PAST`   — index is before the active timer
 *   - `FUTURE` — index is after the active timer
 *
 * Fallback when no timer is active: `PAST` iff the timer has memory, else
 * `FUTURE`. Memory presence is carried separately by `hasMemory`, so a PAST
 * timer without memory (skipped) and a FUTURE timer with memory (jumped
 * back from) are both valid and meaningful.
 */
export type TimestampState = 'PAST' | 'ACTIVE' | 'FUTURE'

export interface TimerInput {
  _id: string | number
  type: TimerType
  trigger: TimerTrigger
  hours?: number
  minutes?: number
  seconds?: number
  startTime?: string | Date | null
  startDatePlus?: number
  finishTime?: string | Date | null
  finishDatePlus?: number
}

export interface TimesetInput {
  timerId: string | number | null
  running: boolean
  kickoff: number | Date | null
  lastStop: number | Date | null
  deadline?: number | Date | null
}

export interface MemoryTimerEntry {
  start: number | null
  finish: number | null
  elapsed: number
  plannedStart?: number | null
  plannedFinish?: number | null
  plannedDuration?: number | null
}

export interface MemoryInput {
  driftResetAt?: number | null
  timers?: Record<string, MemoryTimerEntry>
}

/**
 * Per-timer output of `createTimestamps`. All time fields are epoch ms.
 *
 * `planned` and `actual` are two independent chains. `drift` (entering delta)
 * and `overUnder` (exiting delta) emerge between them, both quantised to
 * 500ms and bidirectional (negative = ahead of schedule).
 *
 * Event-level totals read from the endpoints — the actual chain already
 * carries accumulated deviation forward, so summing would double-count:
 *   eventActualFinish = last.actual.finish
 *   eventOverUnder    = last.overUnder
 *
 * On back-to-back chains `drift[i+1] === overUnder[i]`; a scheduled gap or a
 * previous under-run resets drift to 0 at the boundary (unless LINKED).
 * FINISH_TIME anchors absorb drift into their duration and clamp `overUnder`
 * to 0 until drift exceeds the slot.
 */
export interface Timestamp {
  /** Timer's `_id`, passed through from input. */
  timerId: string | number

  /** Positional label (see `TimestampState`). Orthogonal to `hasMemory`. */
  state: TimestampState

  /** Scheduled times from current timer config. */
  planned: { start: number, finish: number, duration: number }

  /** Realised times: memory for PAST, kickoff+live for ACTIVE, projected for FUTURE. */
  actual: { start: number, finish: number, duration: number }

  /** `actual.start - planned.start`. Baseline pinned to memory snapshot when present. */
  drift: number

  /** `actual.finish - planned.finish`. Grows live on the ACTIVE timer past its end. */
  overUnder: number

  /** Planned gap before this timer (`planned.start - prev.planned.finish`). 0 for the first. */
  gap: number

  /** Timer has a real memory entry (`finish != null`). Orthogonal to `state`. */
  hasMemory: boolean

  /** Timer has a `startTime` anchor — render separately, and a preceding `gap` is a scheduled pause. */
  explicitStart: boolean

  /** Timer is `FINISH_TIME` — wall-clock anchored finish, drift-absorbing. */
  explicitFinish: boolean
}

// --- Constants -----------------------------------------------------------

const TIMER_TYPES = {
  DURATION: 'DURATION' as const,
  FINISH_TIME: 'FINISH_TIME' as const,
  TIME_WARP: 'TIME_WARP' as const,
}

const TIMER_TRIGGERS = {
  MANUAL: 'MANUAL' as const,
  LINKED: 'LINKED' as const,
  SCHEDULED: 'SCHEDULED' as const,
}

// Quantise drift/overUnder to this grain (truncated toward zero, see roundDrift).
// Keeps values stable across `now` ticks so fastDeepEqual can short-circuit;
// sub-threshold drift reads as 0.
const DRIFT_ROUND_MS = 500

// --- Helpers -------------------------------------------------------------

/**
 * Normalise a mixed number | Date input to epoch ms.
 * null/undefined/garbage → null.
 */
function toMs (value: number | Date | null | undefined): number | null {
  if (value == null) return null
  if (value instanceof Date) return value.getTime()
  return typeof value === 'number' ? value : null
}

/**
 * Resolve a timer's anchored startTime/finishTime (a wall-clock string) to an
 * absolute epoch ms, applying roomDate/datePlus shifts when present.
 *
 * The 30-minute rewind on prevFinish lets parseDateAsToday pick the correct
 * "today" reference when a timer's anchor slightly predates the previous
 * finish (a common UX pattern, e.g. scheduling back-to-back cues where
 * clocks overlap).
 */
function resolveAnchoredTime (
  rawInput: string | Date,
  datePlus: number,
  roomDate: string | null,
  timezone: string | undefined,
  prevFinishMs: number | null,
): number {
  const prevFinish30 = prevFinishMs !== null ? addMinutes(new Date(prevFinishMs), -30) : undefined
  const parsed = parseDateAsToday(rawInput, {
    timezone,
    after: prevFinish30,
    now: prevFinish30,
  })
  let result: Date | null = parsed
  if (datePlus > 0 || roomDate) {
    const targetDate = parseCalendarDay(roomDate, { datePlus, timezone })
    result = applyDate(result, targetDate, timezone)
  }
  return result ? result.getTime() : 0
}

/**
 * Truncate toward zero at DRIFT_ROUND_MS grain — symmetric for negative drift
 * (ahead of schedule). Math.floor would round -749ms to -1000ms, overstating.
 */
function roundDrift (ms: number): number {
  const sign = ms < 0 ? -1 : 1
  return sign * Math.floor(Math.abs(ms) / DRIFT_ROUND_MS) * DRIFT_ROUND_MS
}

// --- Main ----------------------------------------------------------------

/**
 * Build planned + actual timestamp chain for a list of timers.
 *
 * The planned chain walks from the current timer config (startTime anchors,
 * durations, FINISH_TIME). The actual chain walks independently, driven by
 * three orthogonal signals per timer:
 *   - `isActive` → kickoff + live-clamped finish
 *   - `hasMemory` → recorded values from the memory entry
 *   - otherwise → projection from prev.actual.finish
 *
 * `drift` and `overUnder` emerge as the difference between the two chains.
 * `state` is a purely positional label for consumers; it does not steer the
 * actual-chain computation.
 */
export default function createTimestamps (
  timers: TimerInput[],
  timeset: TimesetInput,
  timezone: string | undefined = undefined,
  now: number = Date.now(),
  roomDate: string | null = null,
  memory: MemoryInput = {},
): Timestamp[] {
  if (!Array.isArray(timers) || !timers.length) return []
  if (!timeset) return []

  const kickoffMs = toMs(timeset.kickoff)
  const driftResetAt = memory.driftResetAt ?? null

  // Locate the active timer's index up front — `state` is positional relative
  // to it. When there is no active timer (event paused / not started), fall
  // back to a memory-based classification so ended events still read sensibly.
  const activeIdx = timeset.timerId != null
    ? timers.findIndex(t => String(t._id) === String(timeset.timerId))
    : -1

  // Planned chain state
  let prevPlannedFinish: number = 0

  // Actual chain state
  let prevActualFinish: number = 0
  let prevActualExists = false

  const out: Timestamp[] = []

  for (let i = 0; i < timers.length; i++) {
    const timer = timers[i]!
    const memoryEntry = memory.timers?.[String(timer._id)] ?? null
    const hasMemory = !!(memoryEntry && memoryEntry.finish != null)

    const isActive = i === activeIdx
    let state: TimestampState
    if (isActive) state = 'ACTIVE'
    else if (activeIdx >= 0) state = i < activeIdx ? 'PAST' : 'FUTURE'
    else state = hasMemory ? 'PAST' : 'FUTURE'

    // ---------------------------------------------------------------------
    // 1. Planned chain (current config)
    // ---------------------------------------------------------------------

    const explicitStart = Boolean(timer.startTime)
    let plannedStart: number
    if (timer.startTime) {
      plannedStart = resolveAnchoredTime(
        timer.startTime,
        timer.startDatePlus ?? 0,
        roomDate,
        timezone,
        prevPlannedFinish || null,
      )
    } else if (prevPlannedFinish) {
      plannedStart = prevPlannedFinish
    } else {
      // First timer with no scheduled start: project from active kickoff or now
      plannedStart = kickoffMs ?? now
    }

    let plannedFinish: number
    let plannedDuration: number
    let explicitFinish = false
    if (timer.type === TIMER_TYPES.FINISH_TIME) {
      explicitFinish = true
      if (timer.finishTime) {
        plannedFinish = resolveAnchoredTime(
          timer.finishTime,
          timer.finishDatePlus ?? 0,
          roomDate,
          timezone,
          plannedStart || null,
        )
      } else {
        plannedFinish = plannedStart
      }
      plannedDuration = plannedFinish - plannedStart
    } else {
      plannedDuration = hmsToMilliseconds(timer)
      plannedFinish = plannedStart + plannedDuration
    }

    const planned = { start: plannedStart, finish: plannedFinish, duration: plannedDuration }

    // ---------------------------------------------------------------------
    // 2. Drift baseline (use snapshot if present)
    // ---------------------------------------------------------------------

    const snapStart = memoryEntry?.plannedStart ?? null
    const snapFinish = memoryEntry?.plannedFinish ?? null
    const driftBaselineStart = snapStart !== null ? snapStart : plannedStart
    const driftBaselineFinish = snapFinish !== null ? snapFinish : plannedFinish

    // ---------------------------------------------------------------------
    // 3. Actual chain
    // ---------------------------------------------------------------------

    let actualStart: number
    let actualFinish: number
    let actualDuration: number

    // Actual chain branches on three orthogonal signals:
    //   isActive   → live kickoff + clamped-to-now finish
    //   hasMemory  → use recorded values (works for PAST-with-mem and the
    //                rare FUTURE-with-mem case after a jump-back)
    //   otherwise  → project forward from prev.actual.finish (covers
    //                FUTURE-no-mem AND skipped PAST-no-mem; drift propagates)
    if (isActive) {
      actualStart = kickoffMs ?? plannedStart
      if (timer.type === TIMER_TYPES.FINISH_TIME) {
        const baseFinish = Math.max(plannedFinish, actualStart)
        actualFinish = Math.max(baseFinish, now)
        actualDuration = Math.max(0, actualFinish - actualStart)
      } else {
        const scheduled = actualStart + plannedDuration
        actualFinish = Math.max(scheduled, now)
        actualDuration = Math.max(0, actualFinish - actualStart)
      }
    } else if (hasMemory) {
      const memStart = memoryEntry!.start ?? memoryEntry!.finish! - (memoryEntry!.elapsed ?? 0)
      const memFinish = memoryEntry!.finish!
      const beforeReset = driftResetAt != null && memStart < driftResetAt
      if (beforeReset) {
        // Drift reset erases any drift before the reset point
        actualStart = driftBaselineStart
        actualFinish = driftBaselineFinish
        actualDuration = driftBaselineFinish - driftBaselineStart
      } else {
        actualStart = memStart
        actualFinish = memFinish
        actualDuration = memoryEntry!.elapsed ?? (memFinish - memStart)
      }
    } else {
      if (timer.trigger === TIMER_TRIGGERS.LINKED && prevActualExists) {
        actualStart = prevActualFinish
      } else if (prevActualExists) {
        actualStart = Math.max(prevActualFinish, plannedStart)
      } else {
        actualStart = plannedStart
      }

      if (timer.type === TIMER_TYPES.FINISH_TIME) {
        actualFinish = Math.max(plannedFinish, actualStart)
        actualDuration = Math.max(0, actualFinish - actualStart)
      } else {
        actualDuration = plannedDuration
        actualFinish = actualStart + actualDuration
      }
    }

    const actual = { start: actualStart, finish: actualFinish, duration: actualDuration }

    // ---------------------------------------------------------------------
    // 4. Emergent values
    // ---------------------------------------------------------------------

    const drift = roundDrift(actualStart - driftBaselineStart)
    const overUnder = roundDrift(actualFinish - driftBaselineFinish)
    const gap = prevPlannedFinish ? plannedStart - prevPlannedFinish : 0

    out.push({
      timerId: timer._id,
      state,
      planned,
      actual,
      drift,
      overUnder,
      gap,
      hasMemory,
      explicitStart,
      explicitFinish,
    })

    prevPlannedFinish = plannedFinish
    prevActualFinish = actualFinish
    prevActualExists = true
  }

  return out
}
