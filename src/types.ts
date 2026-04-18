export interface HMS {
  hours: number
  minutes: number
  seconds: number
  decimals: number
}

export interface DHMS extends HMS {
  negative: number // Rename to overtime
  days: number
}

/**
 * Controls seconds display in time-of-day formatting.
 * - undefined: respect the format string as-is (default)
 * - 'always':  force seconds even if the format lacks :ss
 * - 'nonzero': show seconds only when non-zero (strip :ss when seconds = 0)
 * - 'never':   always strip :ss from the format
 */
export type SecondsDisplay = 'always' | 'nonzero' | 'never'

/**
 * Controls tenths-of-a-second display in time-of-day formatting.
 * - undefined: no tenths shown (default)
 * - 'always':  append .{tenths} to the formatted time
 */
export type TenthsDisplay = 'always'

/**
 * Duration format string. Parsed character-by-character via .includes():
 *
 *   D — show days component
 *   H — show hours component
 *   M — show minutes component
 *   S — show seconds component
 *   F — show fractional seconds (tenths)
 *   L — use letter separators (d h m s) instead of colons (:)
 *
 * Standard formats (defined as constants in @stagetimerio/shared):
 *   'HHHMMSS'  →  41:30:59         'L_DHMS' →  1d 17h 30m 59s
 *   'DHHMMSS'  →  1:17:30:59       'L_HMS'  →  41h 30m 59s
 *   'MMMSS'    →  230:59           'L_MS'   →  230m 59s
 *   'SSS'      →  92               'L_S'    →  92s
 *   Append 'F' for decimals:       'L_D', 'L_DH', 'L_DHM' for truncated
 *   'HHHMMSSF' →  41:30:59.5
 *
 * Repeated chars are cosmetic — only presence matters.
 * Any string with the right characters works: 'HMS' = 'HHHMMSS' = 'H_M_S'.
 */
export type DurationFormat = string

export type ZeroDisplay = 'always' | 'nonzero' | 'never'

// --- createTimestamps ----------------------------------------------------

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

/**
 * Per-timer memory entry. Serves two orthogonal roles:
 *
 *   Schedule-history layer (drift math):
 *     `start`  — wall-clock moment of first kickoff
 *     `finish` — wall-clock moment the timer left active (transition point)
 *     `plannedStart` / `plannedFinish` / `plannedDuration` — snapshots of the
 *       timer's planned values at first kickoff, used as the drift baseline
 *       so live edits to duration don't silently shift the zero point
 *
 *   Resume layer (countdown state):
 *     `elapsed` — total countdown time consumed, excluding pauses. When the
 *       user jumps back to a previously-run timer, this is where the
 *       countdown resumes from. NOT equal to `finish - start` when the timer
 *       was paused during its run.
 *
 * `createTimestamps` reads `start`/`finish` (+ planned snapshots) for the
 * schedule layer. `elapsed` is for the caller's resume logic — don't derive
 * `actual.duration` from it; use `finish - start` to keep wall-clock identity.
 */
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
 * `planned` and `actual` are two independent chains. `startDrift` and
 * `finishDrift` are the schedule delta measured at the two endpoints of the
 * same timer — drift entering and drift exiting. Both quantised to 500ms and
 * bidirectional (negative = ahead of schedule).
 *
 * Event-level totals read from the endpoints — the actual chain already
 * carries accumulated deviation forward, so summing would double-count:
 *   eventActualFinish = last.actual.finish
 *   eventFinishDrift  = last.finishDrift
 *
 * On back-to-back chains `startDrift[i+1] === finishDrift[i]`; a scheduled gap
 * or a previous under-run resets startDrift to 0 at the boundary (unless
 * LINKED). FINISH_TIME anchors absorb drift into their duration and clamp
 * `finishDrift` to 0 until drift exceeds the slot.
 *
 * The timer's own variance (over- or under-run vs its planned duration) is
 * `finishDrift - startDrift`, which equals `actual.duration - planned.duration`.
 * Not exposed as a field — compute at call sites if needed.
 */
export interface Timestamp {
  /** Timer's `_id`, passed through from input. */
  timerId: string | number

  /** Positional label (see `TimestampState`). Orthogonal to `hasMemory`. */
  state: TimestampState

  /** Scheduled times from current timer config. */
  planned: { start: number, finish: number, duration: number }

  /**
   * Realised times: memory for PAST, kickoff+live for ACTIVE, projected for
   * FUTURE. All wall-clock — `duration === finish - start` holds for every row.
   * For countdown time consumed (excluding pauses) on PAST timers, read
   * `memory.elapsed` directly; it's a different concept.
   */
  actual: { start: number, finish: number, duration: number }

  /** `actual.start - planned.start`. Drift entering the timer. Baseline pinned to memory snapshot when present. */
  startDrift: number

  /** `actual.finish - planned.finish`. Drift exiting the timer. Grows live on the ACTIVE timer past its end. */
  finishDrift: number

  /** Planned gap before this timer (`planned.start - prev.planned.finish`). 0 for the first. */
  gap: number

  /** Timer has a real memory entry (`finish != null`). Orthogonal to `state`. */
  hasMemory: boolean

  /** Timer has a `startTime` anchor — render separately, and a preceding `gap` is a scheduled pause. */
  explicitStart: boolean

  /** Timer is `FINISH_TIME` — wall-clock anchored finish, drift-absorbing. */
  explicitFinish: boolean
}
