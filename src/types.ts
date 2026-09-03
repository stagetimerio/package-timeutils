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
 * Single-unit formats round the remainder up, so the displayed number is the
 * time left *at most*: 'HHH' → 42, 'MMM' → 231, 'L_H' → 42h, 'L_M' → 231m.
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
 *   - `ACTIVE` — `timeset.timerId` matches this timer, and it's live
 *   - `PAST`   — index is before the active timer
 *   - `FUTURE` — index is after the active timer, or the active cue while
 *                merely armed (reset/parked at the start — not started yet)
 *
 * Memory never sets state, so a PAST timer without memory (skipped) and a
 * FUTURE timer with memory (jumped back from) are both valid and meaningful.
 * Memory is carried separately by `memory`.
 *
 * With no active timer — `timeset.timerId` null, or dangling at a deleted
 * timer — there is no position to be relative to, so every row is `FUTURE`
 * and the chain projects from the plan no matter how much has already run
 * (see "No active cue" in `createTimestamps`). Don't read "everything is
 * FUTURE" as "nothing has run": check `memory` for that.
 */
export type TimestampState = 'PAST' | 'ACTIVE' | 'FUTURE'

/**
 * Canonical shape inside `createTimestamps`. Callers normalize at the
 * boundary: server-side `startTime`/`finishTime` come straight from Mongoose
 * as `Date`; client-side they're ISO strings that the caller wraps in
 * `new Date()` before calling. ObjectId is serialized to string. All
 * numeric fields have schema defaults and are always present.
 */
export interface TimerInput {
  _id: string
  type: TimerType
  trigger: TimerTrigger
  hours: number
  minutes: number
  seconds: number
  startTime: Date | null
  finishTime: Date | null
}

/**
 * `timerId` is an ObjectId serialized to string. `kickoff`/`lastStop`/
 * `deadline` are epoch ms — Mongo stores them as `Number`, never `Date`.
 */
export interface TimesetInput {
  timerId: string | null
  running: boolean
  kickoff: number | null
  lastStop: number | null
  deadline: number | null
}

/**
 * Per-timer memory entry. Serves two orthogonal roles:
 *
 *   Schedule-history layer (drift math):
 *     `start`  — wall-clock moment of first kickoff
 *     `finish` — wall-clock moment the timer left active (transition point)
 *
 *   Resume layer (countdown state):
 *     `elapsed` — total countdown time consumed, excluding pauses. When the
 *       user jumps back to a previously-run timer, this is where the
 *       countdown resumes from. NOT equal to `finish - start` when the timer
 *       was paused during its run.
 *
 * `createTimestamps` reads `start`/`finish` for the schedule layer and passes
 * the whole entry through as `Timestamp.memory`. `elapsed` is for the caller's
 * resume logic — don't derive `expected.duration` from it; use
 * `finish - start` to keep wall-clock identity.
 *
 * Drift baselines are NOT pinned via memory snapshots. Planned values are
 * computed live from current timer config; user-placed hard-time anchors
 * (`startTime`, FINISH_TIME `finishTime`) are the truth-tellers that catch
 * silent edits, not a frozen snapshot. See phase-3-pivot.md.
 */
export interface MemoryTimerEntry {
  start: number | null
  finish: number | null
  elapsed: number
}

export interface MemoryInput {
  timers?: Record<string, MemoryTimerEntry>
}

/**
 * Show target end input for `createTimestamps` — the resolvable goalpost.
 *
 * `time` is the user-set ("white") target: a wall-clock Date whose date
 * portion is ignored — it lands at or after the last segment's start, exactly
 * like timer start/finish anchors. `frozen` is the kickoff-frozen derived end
 * ("gray"), already an epoch-ms instant. `time` wins when both are set.
 */
export interface TargetInput {
  time?: Date | null
  frozen?: number | null
}

/**
 * A row placed *between* cues, closing the stretch of rundown above it.
 *
 * Two words for two things: a *marker* is the row the user places, a *segment*
 * is the stretch of cues between markers (or between a marker and an end of
 * the rundown). Rows belong to a segment, a marker closes one, and
 * `segmentIndex` on both `Timestamp` and `MarkerTimestamp` is the link. A
 * *boundary* is whatever closes a segment — a marker, or the show target for
 * the last one — and both report the same `BoundaryTimestamp` shape. A segment
 * is usually a show day but isn't called one, because nothing caps its length
 * at 24h.
 *
 * `time` is a wall-clock Date whose date portion is ignored — it lands at or
 * after the start of the segment it closes, exactly like `TargetInput.time`
 * and timer anchors. `beforeTimerId` names the cue the marker sits above;
 * `null` pins it below the last cue. An anchor naming no cue in the list is
 * dropped.
 *
 * `END_OF_DAY` is a wall, with or without a `time`, and the segments on either
 * side are little rooms. Nothing crosses the wall: rows above back-time to it
 * (not to the show target), rows below never chain off it, drift stops at it.
 * Each little room times itself the way a whole room does, and one with
 * nothing typed has no times at all until someone types one.
 */
export interface MarkerInput {
  _id: string
  type: MarkerType
  time?: Date | null
  beforeTimerId?: string | null
}

export type MarkerType = 'END_OF_DAY'

/**
 * Per-timer output of `createTimestamps`. All time fields are epoch ms.
 *
 * ## Three channels: `planned`, `expected`, `memory`
 *
 * - **`planned`** — pure schedule. What the rundown says.
 * - **`expected`** — the timeline: reality where known, projection where not.
 *   Read this for "when does this row run".
 * - **`memory`** — raw facts of the row's LAST run, or `null`. Never a guess.
 *
 * **`memory` is stale when `state === 'FUTURE'`** — jump back over a cue and
 * it still holds the previous pass while `expected` projects the next run, so
 * `memory.start ?? expected.start` is NOT a safe read: it returns last pass's
 * start for a cue that hasn't run yet.
 *
 * A value is a fact iff `state !== 'FUTURE' && memory?.<field> != null` — per
 * field, which is the point. An ACTIVE row has a fact start and a projected
 * finish (`memory.finish === null`); the old `hasMemory` boolean keyed on
 * `finish`, so it couldn't tell a live cue from one that never ran. Facts
 * render solid, everything else italic.
 *
 * `startDrift` and `finishDrift` are the schedule delta measured at the two
 * endpoints of the same timer — drift entering and drift exiting. Both
 * quantised to 500ms and bidirectional (negative = ahead of schedule).
 *
 * Event-level totals read from the endpoints — the expected chain already
 * carries accumulated deviation forward, so summing would double-count:
 *   eventExpectedFinish = last.expected.finish
 *   eventFinishDrift    = last.finishDrift
 *
 * On back-to-back chains `startDrift[i+1] === finishDrift[i]`; a scheduled gap
 * or a previous under-run resets startDrift to 0 at the boundary (unless
 * LINKED). FINISH_TIME anchors absorb drift into their duration and clamp
 * `finishDrift` to 0 until drift exceeds the slot.
 *
 * The timer's own variance (over- or under-run vs its planned duration) is
 * `finishDrift - startDrift`, which equals `expected.duration - planned.duration`.
 * Not exposed as a field — compute at call sites if needed.
 */
export interface Timestamp {
  /** Timer's `_id`, passed through from input. */
  timerId: string

  /** Positional label (see `TimestampState`). Orthogonal to `memory`. */
  state: TimestampState

  /**
   * Scheduled times from current timer config. `start`/`finish` are `null`
   * when the chain has no upstream anchor (a timer with no `startTime` and no
   * resolvable predecessor). `duration` defaults to `0` when unknown — durations
   * can never be negative, so `0` is the honest "don't know" value.
   */
  planned: { start: number | null, finish: number | null, duration: number }

  /**
   * The reality-anchored chain: memory for PAST, kickoff + live clock for
   * ACTIVE, projected from the prior row for FUTURE. Falls back to `planned`
   * when nothing better is known — so `expected` inherits `null` when planned
   * is null.
   *
   * Passes through facts rather than excluding them, so a row that has run
   * this pass has `expected` equal to its `memory`. This is the timeline —
   * read it for "when does this row run", whatever the state.
   */
  expected: { start: number | null, finish: number | null, duration: number }

  /**
   * Raw memory passthrough — recorded facts for this timer, or `null` when it
   * has never run. Fields are independently nullable: `start` without `finish`
   * is a cue that started and hasn't stopped.
   *
   * The fact channel, but it describes the row's *last* run — stale when
   * `state === 'FUTURE'` (jumped back). Fact iff
   * `state !== 'FUTURE' && memory?.<field> != null`. Consumers never need to
   * cross-read a memory store.
   */
  memory: MemoryTimerEntry | null

  /** `expected.start - planned.start`. `null` when either side is null. */
  startDrift: number | null

  /** `expected.finish - planned.finish`. `null` when either side is null. */
  finishDrift: number | null

  /** Planned gap before this timer (`planned.start - prev.planned.finish`). `null` when either side is null; `0` for the first. */
  gap: number | null

  /**
   * The signed live boundary before this timer — time actually available
   * there *now*, negative when the chain above runs past this point. Drift
   * eats it as the show runs; `gap` is what the plan set aside, this is what
   * is left.
   *
   * Pre-show it equals `gap`: nothing live to read, the plan stands as
   * written. Once the show has started it reads
   * `expected.start - prev.expected.finish` — except for a still-future hard
   * start, which measures against its fixed anchor (`planned.start`) instead:
   * the forward chain clamps `expected.start` to `max(anchor, prevFinish)`,
   * which can never go negative and would hide a live overlap. Chained soft
   * rows read ~0 by construction; rows already run read the pause actually
   * taken. `null` when an endpoint is unresolvable; `0` for the first row.
   */
  liveGap: number | null

  /**
   * Which segment this row belongs to — the stretch between two markers, or
   * between a marker and an end of the rundown. `0` when there are no markers,
   * so every reader can treat the rundown as one segment without branching.
   */
  segmentIndex: number

  /**
   * The declared end of this row's segment: the closing marker's resolved
   * instant, or the show target for the last segment. `null` when that end
   * isn't set. Identical for every row in a segment.
   */
  segmentEnd: number | null

  /**
   * This row is the front wall: its `planned.start` is pinned to the run's
   * recorded start because no planning anchor reached the row. Fact-frozen —
   * render white like a hard start, dies with the memory doc on reset.
   * Derived every pass, never stored. `false` whenever planning resolved the
   * start, even on the wall row itself.
   */
  pinnedStart: boolean

  /** Timer has a `startTime` anchor — render separately, and a preceding `gap` is a scheduled pause. */
  explicitStart: boolean

  /** Timer is `FINISH_TIME` — wall-clock anchored finish, drift-absorbing. */
  explicitFinish: boolean
}

/**
 * A boundary — an End of Day marker or the show target — as `createTimestamps`
 * sees it. Same channels as a row: `planned` is the schedule, `expected` is
 * reality where known and projection where not. Both are read off the last
 * cue of the segment the boundary closes.
 */
export interface BoundaryTimestamp {
  /**
   * The end the segment measures against: the typed time (or the target's
   * kickoff-frozen end) when there is one, else where the plan lands the last
   * cue. Null only when nothing in the segment resolves.
   */
  planned: { end: number | null }

  /** Where the segment actually lands: the last cue's `expected.finish`. Mirrors `planned` until known better. */
  expected: { end: number | null }

  /** True when `planned.end` is a commitment — typed, or the target's frozen end — rather than the plan's own landing. */
  fixedEnd: boolean

  /** `planned.end` minus where the plan lands the last cue: slack (+) or overrun (−) against a fixed end. Null unless fixed. */
  gap: number | null

  /** `expected.end` minus `planned.end`: over (+) or under (−). Null when either is unknown. */
  drift: number | null
}

/**
 * Per-marker output of `createTimestamps`, in input order: `markers[i]`
 * answers for the `i`th `MarkerInput`. A marker that names no cue in the list,
 * or doubles another marker's boundary, keeps its slot with every field null.
 */
export interface MarkerTimestamp extends BoundaryTimestamp {
  /** Marker's `_id`, passed through from input. */
  markerId: string

  /** Row the marker sits above; `timers.length` for one pinned below the last cue. */
  index: number | null

  /** The segment this marker closes — the `segmentIndex` of the rows above it. */
  segmentIndex: number | null
}

export interface Timestamps {
  timestamps: Timestamp[]
  markers: MarkerTimestamp[]
  /** The show target, closing the last segment. Always present, whether or not a `TargetInput` was given. */
  target: BoundaryTimestamp
}
