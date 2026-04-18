import { hmsToMilliseconds } from './hmsToMilliseconds'
import { parseDateAsToday } from './parseDateAsToday'
import { parseCalendarDay } from './parseCalendarDay'
import { applyDate } from './applyDate'
import { addMinutes } from 'date-fns/addMinutes'
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

const TIMER_TRIGGERS = {
  MANUAL: 'MANUAL' as const,
  LINKED: 'LINKED' as const,
  SCHEDULED: 'SCHEDULED' as const,
}

// Quantise startDrift/finishDrift to this grain (truncated toward zero, see
// roundDrift). Keeps values stable across `now` ticks so fastDeepEqual can
// short-circuit; sub-threshold drift reads as 0.
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
 * `startDrift` and `finishDrift` emerge as the difference between the two
 * chains at each endpoint. `state` is a purely positional label for
 * consumers; it does not steer the actual-chain computation.
 */
export function createTimestamps (
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

    // Actual chain branches on positional state + memory presence:
    //   isActive              → live kickoff + clamped-to-now finish
    //   PAST + hasMemory      → use recorded values (actually ran)
    //   otherwise             → project forward from prev.actual.finish
    //     covers: FUTURE (incl. stale memory from a jump-back — memory is
    //     preserved on disk for the resume feature but ignored here since
    //     the timer has not yet played in the current pass), and skipped
    //     PAST-no-mem (zero-duration, see below).
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
    } else if (state === 'PAST' && hasMemory) {
      const memStart = memoryEntry!.start ?? memoryEntry!.finish! - (memoryEntry!.elapsed ?? 0)
      const memFinish = memoryEntry!.finish!
      const beforeReset = driftResetAt != null && memStart < driftResetAt
      if (beforeReset) {
        // Drift reset erases any drift before the reset point
        actualStart = driftBaselineStart
        actualFinish = driftBaselineFinish
        actualDuration = driftBaselineFinish - driftBaselineStart
      } else {
        // `actual.duration` is wall-clock (finish - start) to keep the
        // identity `actual.finish - actual.start === actual.duration` consistent
        // across all output rows. `memory.elapsed` is the resume-layer concern
        // (countdown time excluding pauses) — consumers read it from memory
        // directly if they need it.
        actualStart = memStart
        actualFinish = memFinish
        actualDuration = memFinish - memStart
      }
    } else {
      if (timer.trigger === TIMER_TRIGGERS.LINKED && prevActualExists) {
        actualStart = prevActualFinish
      } else if (prevActualExists) {
        actualStart = Math.max(prevActualFinish, plannedStart)
      } else {
        actualStart = plannedStart
      }

      if (state === 'PAST') {
        // Skipped: user advanced past this timer without running it.
        // Collapse to zero duration so recovered time reduces finishDrift.
        actualFinish = actualStart
        actualDuration = 0
      } else if (timer.type === TIMER_TYPES.FINISH_TIME) {
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

    const startDrift = roundDrift(actualStart - driftBaselineStart)
    const finishDrift = roundDrift(actualFinish - driftBaselineFinish)
    const gap = prevPlannedFinish ? plannedStart - prevPlannedFinish : 0

    out.push({
      timerId: timer._id,
      state,
      planned,
      actual,
      startDrift,
      finishDrift,
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
