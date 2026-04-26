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
  const prev30 = prevFinishMs !== null ? addMinutes(new Date(prevFinishMs), -30) : undefined
  const parsed = parseDateAsToday(rawInput, {
    timezone,
    after: prev30,
    now: prev30,
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
 * Three passes:
 *   1. Forward planned chain — anchors, durations, FINISH_TIME, with
 *      `kickoffMs ?? now` fallback for the first unanchored timer.
 *   2. Reverse-walk override — when no timer is active (pre-kickoff), upstream
 *      timers without their own forward source are filled by walking backward
 *      from each downstream hard-time anchor, subtracting `timer.duration` per
 *      row. The walk stops at FINISH_TIME timers (variable duration). Forward
 *      always wins; once a hard `startTime` exists at j ≤ i, row i is forward-
 *      anchored and not reverse-filled.
 *   3. Forward actual chain — driven by per-row `isActive` / `hasMemory` /
 *      positional state. `startDrift` and `finishDrift` emerge as the delta
 *      between planned and actual at each endpoint. Live planned values are
 *      the baseline; no memory snapshots.
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

  const N = timers.length
  const kickoffMs = toMs(timeset.kickoff)
  const driftResetAt = memory.driftResetAt ?? null
  const hasActive = timeset.timerId != null

  // Locate the active timer's index up front — `state` is positional relative
  // to it. When there is no active timer (event paused / not started), fall
  // back to a memory-based classification so ended events still read sensibly.
  const activeIdx = hasActive
    ? timers.findIndex(t => String(t._id) === String(timeset.timerId))
    : -1

  // -----------------------------------------------------------------------
  // Pass 1 — forward planned chain
  // -----------------------------------------------------------------------

  const plannedStart: number[] = new Array(N)
  const plannedFinish: number[] = new Array(N)
  const plannedDuration: number[] = new Array(N)
  // forwardAnchored[i] = this row has a real forward source: a startTime at
  // j ≤ i, or an active timer (kickoff is the source). Reverse-walk skips
  // forward-anchored rows so "forward wins".
  const forwardAnchored: boolean[] = new Array(N)

  {
    let prevPlannedFinish: number = 0
    for (let i = 0; i < N; i++) {
      const timer = timers[i]!
      const hasStartAnchor = !!timer.startTime

      forwardAnchored[i] = hasActive || hasStartAnchor || (i > 0 && forwardAnchored[i - 1]!)

      if (timer.startTime) {
        plannedStart[i] = resolveAnchoredTime(
          timer.startTime,
          timer.startDatePlus ?? 0,
          roomDate,
          timezone,
          prevPlannedFinish || null,
        )
      } else if (prevPlannedFinish) {
        plannedStart[i] = prevPlannedFinish
      } else {
        // First timer with no scheduled start: project from active kickoff or now
        plannedStart[i] = kickoffMs ?? now
      }

      if (timer.type === TIMER_TYPES.FINISH_TIME) {
        if (timer.finishTime) {
          plannedFinish[i] = resolveAnchoredTime(
            timer.finishTime,
            timer.finishDatePlus ?? 0,
            roomDate,
            timezone,
            plannedStart[i]! || null,
          )
        } else {
          plannedFinish[i] = plannedStart[i]!
        }
        plannedDuration[i] = plannedFinish[i]! - plannedStart[i]!
      } else {
        plannedDuration[i] = hmsToMilliseconds(timer)
        plannedFinish[i] = plannedStart[i]! + plannedDuration[i]!
      }

      prevPlannedFinish = plannedFinish[i]!
    }
  }

  // -----------------------------------------------------------------------
  // Pass 2 — reverse walk for soft-start derivation (pre-kickoff only)
  // -----------------------------------------------------------------------
  //
  // For each downstream hard-time anchor (hard `startTime` or FINISH_TIME with
  // `finishTime`), walk backward subtracting `timer.duration` per row to fill
  // unanchored upstream timers with "to land on this anchor, finish here"
  // values. Stops at FINISH_TIME without a finishTime (variable duration) and
  // restarts at every fresh anchor encountered. Skips forward-anchored rows.
  //
  // Skipped entirely when an active timer exists — once kickoff happens,
  // forward chain has a real source (kickoff → timer 0 fallback) and reverse
  // values would just shadow it. See phase-3-pivot.md open question 8.
  if (!hasActive) {
    let target: number | null = null
    for (let i = N - 1; i >= 0; i--) {
      const timer = timers[i]!
      const hasStartAnchor = !!timer.startTime
      const isFinishTimeAnchor = timer.type === TIMER_TYPES.FINISH_TIME && !!timer.finishTime
      const isFinishTimeRow = timer.type === TIMER_TYPES.FINISH_TIME

      if (hasStartAnchor) {
        // Hard startTime: own forward source. Restart walk for upstream from
        // this row's plannedStart. Don't reverse-fill this row.
        target = plannedStart[i]!
      } else if (isFinishTimeAnchor) {
        // FINISH_TIME with finishTime: anchor for upstream. Walk's target is
        // its plannedFinish (the anchor itself). Don't reverse-fill its
        // plannedStart — that's whatever-fits, chained from prev (re-derived
        // in Pass 3 once prev.plannedFinish may have been overridden).
        target = plannedFinish[i]!
      } else if (isFinishTimeRow) {
        // FINISH_TIME without finishTime: variable duration, no fixed amount
        // to subtract. Walk stops; upstream rows get no target via this row.
        target = null
      } else if (target != null && !forwardAnchored[i]) {
        // DURATION row, walk alive, no forward source — reverse-fill.
        plannedFinish[i] = target
        plannedStart[i] = target - plannedDuration[i]!
        target = plannedStart[i]!
      }
      // else: row is forward-anchored (forward wins) or target is null
      // (no downstream anchor). Walks restart at upstream hard-time anchors.
    }

    // -------------------------------------------------------------------
    // Pass 3 — re-chain plannedStart for FINISH_TIME rows whose preceding
    // row was reverse-filled. Their plannedStart depends on prev.plannedFinish;
    // plannedDuration recomputes from the (stable) anchor.
    // -------------------------------------------------------------------
    for (let i = 1; i < N; i++) {
      const timer = timers[i]!
      if (timer.type !== TIMER_TYPES.FINISH_TIME) continue
      const newStart = plannedFinish[i - 1]!
      if (newStart === plannedStart[i]) continue
      plannedStart[i] = newStart
      plannedDuration[i] = plannedFinish[i]! - newStart
    }
  }

  // -----------------------------------------------------------------------
  // Pass 4 — forward actual chain + emit
  // -----------------------------------------------------------------------

  let prevActualFinish: number = 0
  let prevActualExists = false

  // Drift baseline chain — tracks the floored baseline finish of the previous
  // row so a reset-induced shift cascades through the active + future chain.
  // Without this, every row would floor only at the reset moment and a prev
  // timer's shifted slot would appear as drift on the next timer.
  let prevDriftBaselineFinish: number = 0

  const out: Timestamp[] = []

  for (let i = 0; i < N; i++) {
    const timer = timers[i]!
    const memoryEntry = memory.timers?.[String(timer._id)] ?? null
    const hasMemory = !!(memoryEntry && memoryEntry.finish != null)

    const isActive = i === activeIdx
    let state: TimestampState
    if (isActive) state = 'ACTIVE'
    else if (activeIdx >= 0) state = i < activeIdx ? 'PAST' : 'FUTURE'
    else state = hasMemory ? 'PAST' : 'FUTURE'

    const planned = {
      start: plannedStart[i]!,
      finish: plannedFinish[i]!,
      duration: plannedDuration[i]!,
    }

    // ---------------------------------------------------------------------
    // Drift baseline (live planned values, with driftResetAt floor)
    // ---------------------------------------------------------------------

    // `driftResetAt` acts as a floor on the drift baseline for the active
    // timer and future rows — their zero-point shifts forward to the reset
    // moment, so `startDrift` and `finishDrift` both read 0 at reset. Past
    // rows with memory keep the raw baseline; they already drift-to-zero by
    // snapping `actual` to the baseline (both sides move together).
    const applyFloor = driftResetAt != null && (isActive || state === 'FUTURE')
    const driftBaselineStart = applyFloor
      ? Math.max(planned.start, driftResetAt!, prevDriftBaselineFinish)
      : planned.start
    const driftBaselineFinish = timer.type === TIMER_TYPES.FINISH_TIME
      ? Math.max(planned.finish, driftBaselineStart)
      : driftBaselineStart + planned.duration

    // ---------------------------------------------------------------------
    // Actual chain
    // ---------------------------------------------------------------------
    //
    // Branches on positional state + memory presence:
    //   isActive              → live kickoff + clamped-to-now finish
    //   PAST + hasMemory      → use recorded values (actually ran)
    //   otherwise             → project forward from prev.actual.finish
    //     covers: FUTURE (incl. stale memory from a jump-back — memory is
    //     preserved on disk for the resume feature but ignored here since
    //     the timer has not yet played in the current pass), and skipped
    //     PAST-no-mem (zero-duration, see below).

    let actualStart: number
    let actualFinish: number
    let actualDuration: number

    if (isActive) {
      const rawActualStart = kickoffMs ?? planned.start
      // Floor: reset pressed while this timer was active → treat the reset
      // moment (or the cascaded baseline from prev) as the effective start.
      actualStart = applyFloor ? Math.max(rawActualStart, driftBaselineStart) : rawActualStart
      if (timer.type === TIMER_TYPES.FINISH_TIME) {
        actualFinish = Math.max(driftBaselineFinish, actualStart, now)
      } else {
        actualFinish = Math.max(actualStart + planned.duration, now)
      }
      actualDuration = Math.max(0, actualFinish - actualStart)
    } else if (state === 'PAST' && hasMemory) {
      const memStart = memoryEntry!.start ?? memoryEntry!.finish! - (memoryEntry!.elapsed ?? 0)
      const memFinish = memoryEntry!.finish!
      const beforeReset = driftResetAt != null && memStart < driftResetAt
      if (beforeReset) {
        // Drift reset erases any drift before the reset point. Snap actual
        // to the live planned values so past rows stay at their planned slot.
        actualStart = planned.start
        actualFinish = planned.finish
        actualDuration = planned.duration
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
        actualStart = Math.max(prevActualFinish, planned.start)
      } else {
        actualStart = planned.start
      }
      // Floor FUTURE rows at the cascaded baseline so the chain zeros cleanly.
      if (applyFloor) {
        actualStart = Math.max(actualStart, driftBaselineStart)
      }

      if (state === 'PAST') {
        // Skipped: user advanced past this timer without running it.
        // Collapse to zero duration so recovered time reduces finishDrift.
        actualFinish = actualStart
        actualDuration = 0
      } else if (timer.type === TIMER_TYPES.FINISH_TIME) {
        actualFinish = Math.max(planned.finish, actualStart)
        actualDuration = Math.max(0, actualFinish - actualStart)
      } else {
        actualDuration = planned.duration
        actualFinish = actualStart + actualDuration
      }
    }

    const actual = { start: actualStart, finish: actualFinish, duration: actualDuration }

    // ---------------------------------------------------------------------
    // Emergent values
    // ---------------------------------------------------------------------

    const startDrift = roundDrift(actualStart - driftBaselineStart)
    const finishDrift = roundDrift(actualFinish - driftBaselineFinish)
    const gap = i > 0 ? planned.start - plannedFinish[i - 1]! : 0

    out.push({
      timerId: timer._id,
      state,
      planned,
      actual,
      startDrift,
      finishDrift,
      gap,
      hasMemory,
      explicitStart: !!timer.startTime,
      explicitFinish: timer.type === TIMER_TYPES.FINISH_TIME,
    })

    prevActualFinish = actualFinish
    prevActualExists = true
    prevDriftBaselineFinish = driftBaselineFinish
  }

  return out
}
